import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient, Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FRONT_DESK")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const movieId = searchParams.get("movieId") || "";
    const hallId = searchParams.get("hallId") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "startTime";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    const where: Prisma.ShowtimeWhereInput = {};

    if (search) {
      where.OR = [
        { movie: { title: { contains: search, mode: "insensitive" } } },
        { hall: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (movieId) {
      where.movieId = movieId;
    }

    if (hallId) {
      where.hallId = hallId;
    }

    if (status) {
      where.status = status as Prisma.EnumShowtimeStatusFilter;
    }

    if (dateFrom || dateTo) {
      where.startTime = {};
      if (dateFrom) {
        where.startTime.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.startTime.lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

    const [showtimes, totalCount] = await Promise.all([
      prisma.showtime.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
          _count: {
            select: {
              bookings: true,
              tickets: true,
            },
          },
        },
      }),
      prisma.showtime.count({ where }),
    ]);

    const showtimesWithBookingCount = showtimes.map((showtime) => ({
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
    }));

    return NextResponse.json({
      showtimes: showtimesWithBookingCount,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching showtimes:", error);
    return NextResponse.json(
      { error: "Failed to fetch showtimes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FRONT_DESK")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { movieId, hallId, startTime, basePrice, weekendMultiplier, vipMultiplier, twinseatMultiplier, status } = body;

    if (!movieId || !hallId || !startTime || !basePrice) {
      return NextResponse.json(
        { error: "Missing required fields: movieId, hallId, startTime, basePrice" },
        { status: 400 }
      );
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true, title: true, duration: true, status: true },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    if (movie.status !== "RELEASED") {
      return NextResponse.json(
        { error: "Only released movies can be scheduled" },
        { status: 400 }
      );
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: { id: true, name: true, isPublished: true, isActive: true },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    if (!hall.isActive) {
      return NextResponse.json(
        { error: "Only active halls can be scheduled" },
        { status: 400 }
      );
    }

    const startDateTime = new Date(startTime);
    const duration = movie.duration || 120;
    const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

    const dayOfWeek = startDateTime.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
    const multiplier = weekendMultiplier
      ? parseFloat(weekendMultiplier)
      : isWeekend
      ? 1.3
      : 1.0;

    const conflictingShowtime = await prisma.showtime.findFirst({
      where: {
        hallId,
        status: { not: "CANCELLED" },
        OR: [
          {
            startTime: {
              lt: endDateTime,
            },
            endTime: {
              gt: startDateTime,
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

    const showtime = await prisma.showtime.create({
      data: {
        movieId,
        hallId,
        startTime: startDateTime,
        endTime: endDateTime,
        basePrice: parseFloat(basePrice),
        weekendMultiplier: multiplier,
        vipMultiplier: vipMultiplier ? parseFloat(vipMultiplier) : 1.5,
        twinseatMultiplier: twinseatMultiplier ? parseFloat(twinseatMultiplier) : 1.5,
        isWeekend,
        status: status || "ACTIVE",
      },
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

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating showtime:", error);
    return NextResponse.json(
      { error: "Failed to create showtime" },
      { status: 500 }
    );
  }
}
