import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const normalizePhone = (value: string) => value.replace(/\D/g, "");

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, recentBookings, bookingCount, ticketCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          membershipTier: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.booking.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          createdAt: true,
          finalAmount: true,
          bookingStatus: true,
          showtime: {
            select: {
              startTime: true,
              movie: {
                select: { title: true, posterUrl: true },
              },
              hall: {
                select: { name: true },
              },
            },
          },
          tickets: {
            select: {
              seat: {
                select: {
                  row: true,
                  seatNumber: true,
                },
              },
            },
          },
        },
      }),
      prisma.booking.count({ where: { userId: session.user.id } }),
      prisma.ticket.count({
        where: {
          booking: { userId: session.user.id },
          status: { in: ["RESERVED", "CONFIRMED"] },
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user,
      stats: {
        totalBookings: bookingCount,
        activeTickets: ticketCount,
      },
      recentBookings,
    });
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";
    const image = typeof body.image === "string" ? body.image : "";

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
        image: image || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        membershipTier: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating customer profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
