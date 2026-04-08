import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getSessionUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const movieId = req.nextUrl.searchParams.get("movieId")?.trim() ?? "";
    if (!movieId) {
      return NextResponse.json({ error: "movieId is required" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
      select: {
        id: true,
        rating: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      hasRated: Boolean(review),
      review,
    });
  } catch (error) {
    console.error("Error checking movie rating:", error);
    return NextResponse.json(
      { error: "Failed to check rating status" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const movieId = typeof body.movieId === "string" ? body.movieId.trim() : "";
    const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
    const ratingValue = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!movieId && !bookingId) {
      return NextResponse.json({ error: "movieId is required" }, { status: 400 });
    }

    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5" }, { status: 400 });
    }

    let resolvedMovieId = movieId;

    if (!resolvedMovieId) {
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId,
        },
        select: {
          id: true,
          showtime: {
            select: {
              movieId: true,
            },
          },
        },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      resolvedMovieId = booking.showtime.movieId;
    }

    const movie = await prisma.movie.findUnique({
      where: { id: resolvedMovieId },
      select: { id: true },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        movieId_userId: {
          movieId: resolvedMovieId,
          userId,
        },
      },
      select: { id: true },
    });

    if (existingReview) {
      await prisma.booking.updateMany({
        where: {
          userId,
          showtime: {
            movieId: resolvedMovieId,
          },
        },
        data: { isRated: true },
      });

      return NextResponse.json({ error: "You already rated this movie." }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        movieId: resolvedMovieId,
        userId,
        rating: ratingValue,
        content: comment || null,
      },
    });

    await prisma.booking.updateMany({
      where: {
        userId,
        showtime: {
          movieId: resolvedMovieId,
        },
      },
      data: { isRated: true },
    });

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
