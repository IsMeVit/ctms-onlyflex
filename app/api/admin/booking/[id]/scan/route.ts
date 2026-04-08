import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true, isScanned: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { isScanned: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        showtime: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                duration: true,
                posterUrl: true,
              },
            },
            hall: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payment: true,
        tickets: {
          include: {
            seat: {
              select: {
                id: true,
                row: true,
                seatNumber: true,
                column: true,
                seatType: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      ...updated,
      scanned: true,
    });
  } catch (error) {
    console.error("Error marking booking as scanned:", error);
    return NextResponse.json(
      { error: "Failed to mark booking as scanned" },
      { status: 500 },
    );
  }
}
