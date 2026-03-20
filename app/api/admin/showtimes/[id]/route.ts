import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient, Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const showtime = await prisma.showtime.findUnique({
      where: { id },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            duration: true,
            status: true,
          },
        },
        hall: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            tickets: true,
          },
        },
      },
    });

    if (!showtime) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    const response = {
      ...showtime,
      bookingCount: showtime._count.bookings,
      ticketCount: showtime._count.tickets,
      movie: {
        ...showtime.movie,
        duration: showtime.movie.duration ?? 0,
      },
      basePrice: showtime.basePrice.toString(),
      weekendMultiplier: showtime.weekendMultiplier.toString(),
      vipMultiplier: showtime.vipMultiplier.toString(),
      twinseatMultiplier: showtime.twinseatMultiplier.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching showtime:", error);
    return NextResponse.json(
      { error: "Failed to fetch showtime" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { movieId, hallId, startTime, basePrice, weekendMultiplier, vipMultiplier, twinseatMultiplier, status } = body;

    const existingShowtime = await prisma.showtime.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            tickets: true,
          },
        },
      },
    });

    if (!existingShowtime) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    if (existingShowtime._count.bookings > 0) {
      return NextResponse.json(
        { error: "Cannot update showtime with existing bookings" },
        { status: 400 }
      );
    }

    const updateData: Prisma.ShowtimeUpdateInput = {};
    let movie = existingShowtime.movieId;
    let hall = existingShowtime.hallId;
    const start = startTime ? new Date(startTime) : existingShowtime.startTime;

    if (movieId) {
      const movieData = await prisma.movie.findUnique({
        where: { id: movieId },
        select: { id: true, duration: true, status: true },
      });

      if (!movieData) {
        return NextResponse.json({ error: "Movie not found" }, { status: 404 });
      }

      if (movieData.status !== "RELEASED") {
        return NextResponse.json(
          { error: "Only released movies can be scheduled" },
          { status: 400 }
        );
      }

      movie = movieId;
    }

    if (hallId) {
      const hallData = await prisma.hall.findUnique({
        where: { id: hallId },
        select: { id: true, isPublished: true, isActive: true },
      });

      if (!hallData) {
        return NextResponse.json({ error: "Hall not found" }, { status: 404 });
      }

      if (!hallData.isActive) {
        return NextResponse.json(
          { error: "Only active halls can be scheduled" },
          { status: 400 }
        );
      }

      hall = hallId;
    }

    const movieData = await prisma.movie.findUnique({
      where: { id: movie },
      select: { duration: true },
    });

    const duration = movieData?.duration || 120;
    const endTime = new Date(start.getTime() + duration * 60000);

    if (startTime || hallId) {
      const dayOfWeek = start.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
      const multiplier = weekendMultiplier
        ? parseFloat(weekendMultiplier.toString())
        : isWeekend
        ? 1.3
        : 1.0;

      const conflictingShowtime = await prisma.showtime.findFirst({
        where: {
          hallId: hall,
          id: { not: id },
          status: { not: "CANCELLED" },
          OR: [
            {
              startTime: {
                lt: endTime,
              },
              endTime: {
                gt: start,
              },
            },
          ],
        },
      });

      if (conflictingShowtime) {
        return NextResponse.json(
          { error: "Hall is already booked for this time slot" },
          { status: 409 }
        );
      }

      updateData.startTime = start;
      updateData.endTime = endTime;
      updateData.isWeekend = isWeekend;
      updateData.weekendMultiplier = multiplier;
    }

    if (basePrice !== undefined) {
      updateData.basePrice = parseFloat(basePrice);
    }

    if (weekendMultiplier !== undefined && !startTime && !hallId) {
      updateData.weekendMultiplier = parseFloat(weekendMultiplier.toString());
    }

    if (vipMultiplier !== undefined) {
      updateData.vipMultiplier = parseFloat(vipMultiplier.toString());
    }

    if (twinseatMultiplier !== undefined) {
      updateData.twinseatMultiplier = parseFloat(twinseatMultiplier.toString());
    }

    if (status) {
      updateData.status = status;
    }

    if (movieId) {
      updateData.movie = { connect: { id: movieId } };
    }

    if (hallId) {
      updateData.hall = { connect: { id: hallId } };
    }

    const showtime = await prisma.showtime.update({
      where: { id },
      data: updateData,
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            duration: true,
          },
        },
        hall: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const response = {
      ...showtime,
      basePrice: showtime.basePrice.toString(),
      weekendMultiplier: showtime.weekendMultiplier.toString(),
      vipMultiplier: showtime.vipMultiplier.toString(),
      twinseatMultiplier: showtime.twinseatMultiplier.toString(),
      movie: {
        ...showtime.movie,
        duration: showtime.movie.duration ?? 0,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating showtime:", error);
    return NextResponse.json(
      { error: "Failed to update showtime" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existingShowtime = await prisma.showtime.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            tickets: true,
          },
        },
      },
    });

    if (!existingShowtime) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    if (existingShowtime._count.bookings > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete showtime with existing bookings",
          bookingCount: existingShowtime._count.bookings,
        },
        { status: 400 }
      );
    }

    await prisma.showtime.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Showtime deleted successfully" });
  } catch (error) {
    console.error("Error deleting showtime:", error);
    return NextResponse.json(
      { error: "Failed to delete showtime" },
      { status: 500 }
    );
  }
}
