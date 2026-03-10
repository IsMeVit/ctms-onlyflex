import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "REFUNDED";

function parseDecimal(value: unknown): Prisma.Decimal | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  try {
    return new Prisma.Decimal(value as string | number | Prisma.Decimal);
  } catch {
    return null;
  }
}

function isValidBookingStatus(status: string): status is BookingStatusValue {
  return ["PENDING", "CONFIRMED", "CANCELLED", "REFUNDED"].includes(status);
}

// GET /api/admin/booking/[id] - Get single booking
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
    const booking = await prisma.booking.findUnique({
      where: { id },
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

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/booking/[id] - Update booking
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
    const {
      userId,
      showtimeId,
      subtotal,
      totalDiscount,
      finalAmount,
      bookingStatus,
    } = body;

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (bookingStatus !== undefined && !isValidBookingStatus(bookingStatus)) {
      return NextResponse.json(
        { error: "Invalid bookingStatus value" },
        { status: 400 }
      );
    }

    if (userId !== undefined) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!existingUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    if (showtimeId !== undefined) {
      const existingShowtime = await prisma.showtime.findUnique({
        where: { id: showtimeId },
        select: { id: true },
      });

      if (!existingShowtime) {
        return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
      }
    }

    const data: Prisma.BookingUpdateInput = {};

    if (userId !== undefined) {
      data.user = { connect: { id: userId } };
    }

    if (showtimeId !== undefined) {
      data.showtime = { connect: { id: showtimeId } };
    }

    if (subtotal !== undefined) {
      const parsed = parseDecimal(subtotal);
      if (!parsed) {
        return NextResponse.json(
          { error: "subtotal must be a valid number" },
          { status: 400 }
        );
      }
      data.subtotal = parsed;
    }

    if (totalDiscount !== undefined) {
      const parsed = parseDecimal(totalDiscount);
      if (!parsed) {
        return NextResponse.json(
          { error: "totalDiscount must be a valid number" },
          { status: 400 }
        );
      }
      data.totalDiscount = parsed;
    }

    if (finalAmount !== undefined) {
      const parsed = parseDecimal(finalAmount);
      if (!parsed) {
        return NextResponse.json(
          { error: "finalAmount must be a valid number" },
          { status: 400 }
        );
      }
      data.finalAmount = parsed;
    }

    if (bookingStatus !== undefined) {
      data.bookingStatus = bookingStatus;
    }

    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        showtime: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
          },
        },
        payment: true,
        tickets: true,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/booking/[id] - Delete booking
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

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        payment: { select: { id: true } },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existingBooking.payment || existingBooking._count.tickets > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete booking with linked payment or tickets. Remove related records first.",
          ticketCount: existingBooking._count.tickets,
          hasPayment: Boolean(existingBooking.payment),
        },
        { status: 400 }
      );
    }

    await prisma.booking.delete({ where: { id } });

    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
