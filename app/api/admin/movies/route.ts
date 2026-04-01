import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient, Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/admin/movies - List all movies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: Prisma.MovieWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status as Prisma.EnumMovieStatusFilter<"Movie">;
    }

    const skip = (page - 1) * limit;

    const [movies, totalCount] = await Promise.all([
      prisma.movie.findMany({
        where,
        include: {
          genres: {
            select: { id: true, name: true },
          },
          showtimes: {
            where: {
              status: "ACTIVE",
            },
            orderBy: {
              startTime: "asc",
            },
            include: {
              hall: {
                select: {
                  id: true,
                  name: true,
                  hallType: true,
                  capacity: true,
                  _count: {
                    select: {
                      seats: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  tickets: true,
                },
              },
            },
          },
          _count: {
            select: { showtimes: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.movie.count({ where }),
    ]);

    return NextResponse.json({
      movies,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}

// POST /api/admin/movies - Create new movie
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      description,
      releaseDate,
      duration,
      rating,
      posterUrl,
      backdropUrl,
      language,
      status,
      genreIds,
    } = body;

    // Validation
    if (!title || !slug) {
      return NextResponse.json(
        { error: "Title and slug are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingMovie = await prisma.movie.findUnique({
      where: { slug },
    });

    if (existingMovie) {
      return NextResponse.json(
        { error: "A movie with this slug already exists" },
        { status: 400 }
      );
    }

    const movie = await prisma.movie.create({
      data: {
        title,
        slug,
        description,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        duration: duration ? parseInt(duration) : null,
        rating: rating ? parseFloat(rating) : null,
        posterUrl,
        backdropUrl,
        language: language || "en",
        status: status || "RELEASED",
        genres: genreIds?.length > 0 ? {
          connect: genreIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        genres: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(movie, { status: 201 });
  } catch (error) {
    console.error("Error creating movie:", error);
    return NextResponse.json(
      { error: "Failed to create movie" },
      { status: 500 }
    );
  }
}
