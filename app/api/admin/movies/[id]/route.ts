import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/admin/movies/[id] - Get single movie
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movie = await prisma.movie.findUnique({
      where: { id },
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
      },
    });

    if (!movie) {
      return NextResponse.json(
        { error: "Movie not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(movie);
  } catch (error) {
    console.error("Error fetching movie:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/movies/[id] - Update movie
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
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

    // Check if movie exists
    const existingMovie = await prisma.movie.findUnique({
      where: { id },
    });

    if (!existingMovie) {
      return NextResponse.json(
        { error: "Movie not found" },
        { status: 404 }
      );
    }

    // Check if new slug conflicts with another movie
    if (slug && slug !== existingMovie.slug) {
      const slugExists = await prisma.movie.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A movie with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        title: title || undefined,
        slug: slug || undefined,
        description: description !== undefined ? description : undefined,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        duration: duration !== undefined ? parseInt(duration) : undefined,
        rating: rating !== undefined ? parseFloat(rating) : undefined,
        posterUrl: posterUrl !== undefined ? posterUrl : undefined,
        backdropUrl: backdropUrl !== undefined ? backdropUrl : undefined,
        language: language || undefined,
        status: status || undefined,
        genres: genreIds !== undefined ? {
          set: [],
          connect: genreIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        genres: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(movie);
  } catch (error) {
    console.error("Error updating movie:", error);
    return NextResponse.json(
      { error: "Failed to update movie" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/movies/[id] - Delete movie
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if movie exists
    const existingMovie = await prisma.movie.findUnique({
      where: { id },
      include: {
        showtimes: { select: { id: true } },
      },
    });

    if (!existingMovie) {
      return NextResponse.json(
        { error: "Movie not found" },
        { status: 404 }
      );
    }

    // Check if movie has active showtimes
    if (existingMovie.showtimes.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete movie with active showtimes. Please delete all showtimes first.",
          showtimeCount: existingMovie.showtimes.length 
        },
        { status: 400 }
      );
    }

    await prisma.movie.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Movie deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting movie:", error);
    return NextResponse.json(
      { error: "Failed to delete movie" },
      { status: 500 }
    );
  }
}
