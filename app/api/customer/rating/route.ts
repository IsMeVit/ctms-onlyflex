import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { canRateMovie } from "@/lib/rating-eligibility";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    const ratingValue = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
      include: {
        showtime: {
          include: {
            movie: {
              select: {
                id: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.isRated) {
      return NextResponse.json({ error: "You already rated this movie." }, { status: 409 });
    }

    const eligible = canRateMovie({
      showtimeStart: booking.showtime.startTime,
      duration: booking.showtime.movie.duration,
      isScanned: booking.isScanned,
      isRated: booking.isRated,
    });

    if (!eligible) {
      return NextResponse.json(
        { error: "This movie is not eligible for rating yet." },
        { status: 403 },
      );
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        movieId: booking.showtime.movieId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (existingReview) {
      const relatedBookings = await prisma.booking.findMany({
        where: {
          userId: session.user.id,
          showtime: {
            movieId: booking.showtime.movieId,
          },
        },
        select: { id: true },
      });

      if (relatedBookings.length > 0) {
        await prisma.booking.updateMany({
          where: {
            id: { in: relatedBookings.map((item) => item.id) },
          },
          data: { isRated: true },
        });
      }

      return NextResponse.json({ error: "You already rated this movie." }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        movieId: booking.showtime.movieId,
        userId: session.user.id,
        rating: ratingValue,
        content: comment || null,
      },
    });

    const relatedBookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        showtime: {
          movieId: booking.showtime.movieId,
        },
      },
      select: { id: true },
    });

    if (relatedBookings.length > 0) {
      await prisma.booking.updateMany({
        where: {
          id: { in: relatedBookings.map((item) => item.id) },
        },
        data: { isRated: true },
      });
    }

    return NextResponse.json({
      review,
      message: "Rating saved successfully.",
    });
  } catch (error) {
    console.error("Error saving movie rating:", error);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 },
    );
  }
}
