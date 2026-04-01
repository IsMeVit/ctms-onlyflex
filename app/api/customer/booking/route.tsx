import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
}) as unknown as Pool;
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type PaymentMethodValue = "CASH" | "CARD" | "ONLINE" | "MOBILE_WALLET";
type SelectedSeatInput = {
  id?: string;
  row?: string;
  column?: number;
  seatNumber?: number | null;
};

function toDecimal(value: string | number | Prisma.Decimal) {
  return new Prisma.Decimal(value);
}

function addDecimals(values: Prisma.Decimal[]) {
  return values.reduce((sum, value) => sum.add(value), new Prisma.Decimal(0));
}

function mapPaymentMethod(method: unknown): PaymentMethodValue | null {
  if (typeof method !== "string") {
    return null;
  }

  switch (method.toLowerCase()) {
    case "cash":
      return "CASH";
    case "card":
      return "CARD";
    case "wallet":
      return "MOBILE_WALLET";
    case "upi":
      return "ONLINE";
    default:
      return null;
  }
}

function formatTimeForMatching(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

async function resolveShowtime({
  showtimeId,
  movieTitle,
  showtimeTime,
}: {
  showtimeId?: string;
  movieTitle?: string;
  showtimeTime?: string;
}) {
  if (showtimeId) {
    return prisma.showtime.findUnique({
      where: { id: showtimeId },
      include: {
        movie: { select: { title: true, posterUrl: true } }, // ✅ added posterUrl
        hall: { select: { id: true, name: true } },
      },
    });
  }

  if (!movieTitle) {
    return null;
  }

  const candidateShowtimes = await prisma.showtime.findMany({
    where: {
      status: "ACTIVE",
      movie: {
        title: {
          equals: movieTitle,
          mode: "insensitive",
        },
      },
    },
    include: {
      movie: { select: { title: true, posterUrl: true } }, // ✅ added posterUrl
      hall: { select: { id: true, name: true } },
    },
    orderBy: { startTime: "asc" },
    take: 20,
  });

  if (!showtimeTime) {
    return candidateShowtimes[0] ?? null;
  }

  return (
    candidateShowtimes.find(
      (candidate) => formatTimeForMatching(candidate.startTime) === showtimeTime
    ) ?? null
  );
}

async function resolveSeats(
  hallId: string,
  selectedSeats: SelectedSeatInput[]
) {
  const directSeatIds = selectedSeats
    .map((seat) => seat.id)
    .filter((seatId): seatId is string => Boolean(seatId));

  if (directSeatIds.length > 0) {
    const seatRecords = await prisma.seat.findMany({
      where: {
        hallId,
        id: { in: directSeatIds },
      },
    });

    if (seatRecords.length === directSeatIds.length) {
      return seatRecords;
    }
  }

  const seatLookups = selectedSeats.filter(
    (seat) => seat.row && typeof seat.column === "number"
  );

  if (seatLookups.length === 0) {
    return [];
  }

  const seatRecords = await prisma.seat.findMany({
    where: {
      hallId,
      OR: seatLookups.map((seat) => ({
        row: seat.row,
        column: seat.column,
      })),
    },
  });

  return seatRecords;
}

// GET: List all bookings
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const where: Prisma.BookingWhereInput = {
      userId: session.user.id,
    };

    if (status) {
      where.bookingStatus = status as Prisma.EnumBookingStatusFilter;
    }

    const skip = (page - 1) * limit;

    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          showtime: {
            include: {
              movie: { select: { title: true, posterUrl: true } }, // ✅ added posterUrl
              hall: { select: { name: true } },
            },
          },
          tickets: {
            include: {
              seat: {
                select: {
                  row: true,
                  seatNumber: true,
                },
              },
            },
          },
          payment: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST: Create a new booking with tickets and payment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const selectedSeats = Array.isArray(body.selectedSeats)
      ? (body.selectedSeats as SelectedSeatInput[])
      : [];
    const paymentMethod = mapPaymentMethod(body.paymentMethod);

    if (selectedSeats.length === 0) {
      return NextResponse.json(
        { error: "At least one seat must be selected" },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "A valid payment method is required" },
        { status: 400 }
      );
    }

    const showtime = await resolveShowtime({
      showtimeId: body.showtimeId,
      movieTitle: body.movieTitle,
      showtimeTime: body.showtimeTime,
    });

    if (!showtime) {
      return NextResponse.json(
        { error: "Showtime not found for this booking" },
        { status: 404 }
      );
    }

    const [user, seatRecords] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          membershipTier: true,
        },
      }),
      resolveSeats(showtime.hallId, selectedSeats),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (seatRecords.length !== selectedSeats.length) {
      return NextResponse.json(
        { error: "One or more selected seats could not be matched" },
        { status: 400 }
      );
    }

    const unavailableSeat = seatRecords.find((seat) =>
      ["INACTIVE", "BLOCKED"].includes(seat.status)
    );

    if (unavailableSeat) {
      return NextResponse.json(
        { error: "One or more selected seats are unavailable" },
        { status: 409 }
      );
    }

    const existingTickets = await prisma.ticket.findMany({
      where: {
        showtimeId: showtime.id,
        seatId: { in: seatRecords.map((seat) => seat.id) },
        status: { in: ["RESERVED", "CONFIRMED", "USED"] },
      },
      select: { seatId: true },
    });

    if (existingTickets.length > 0) {
      return NextResponse.json(
        { error: "One or more seats have already been booked" },
        { status: 409 }
      );
    }

    const basePrice = toDecimal(showtime.basePrice);
    const effectiveBasePrice = showtime.isWeekend
      ? basePrice.mul(showtime.weekendMultiplier)
      : basePrice;
    const discountRate =
      user.membershipTier === "MEMBER" ? new Prisma.Decimal(0.3) : new Prisma.Decimal(0);

    const ticketPricing = seatRecords.map((seat) => {
      let originalPrice = effectiveBasePrice;

      if (seat.seatType === "VIP") {
        originalPrice = originalPrice.add(10);
      }

      if (seat.seatType === "LOVESEAT_LEFT" || seat.seatType === "LOVESEAT_RIGHT") {
        originalPrice = originalPrice.mul(2);
      }

      const discountAmount = originalPrice.mul(discountRate);
      const finalPrice = originalPrice.sub(discountAmount);

      return {
        seatId: seat.id,
        originalPrice,
        discountAmount,
        finalPrice,
      };
    });

    const subtotal = addDecimals(ticketPricing.map((ticket) => ticket.originalPrice));
    const totalDiscount = addDecimals(
      ticketPricing.map((ticket) => ticket.discountAmount)
    );
    const finalAmount = addDecimals(ticketPricing.map((ticket) => ticket.finalPrice));
    const paymentStatus = paymentMethod === "CASH" ? "PENDING" : "COMPLETED";
    const bookingStatus = paymentMethod === "CASH" ? "PENDING" : "CONFIRMED";

    const booking = await prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          userId: user.id,
          showtimeId: showtime.id,
          subtotal,
          totalDiscount,
          finalAmount,
          bookingStatus,
        },
      });

      await tx.ticket.createMany({
        data: ticketPricing.map((ticket) => ({
          bookingId: createdBooking.id,
          showtimeId: showtime.id,
          seatId: ticket.seatId,
          originalPrice: ticket.originalPrice,
          discountAmount: ticket.discountAmount,
          finalPrice: ticket.finalPrice,
          status: paymentMethod === "CASH" ? "RESERVED" : "CONFIRMED",
        })),
      });

      await tx.payment.create({
        data: {
          bookingId: createdBooking.id,
          amount: finalAmount,
          paymentMethod,
          status: paymentStatus,
          transactionId:
            paymentMethod === "CASH"
              ? null
              : `TXN-${Date.now()}-${createdBooking.id.slice(0, 8)}`,
          paidAt: paymentStatus === "COMPLETED" ? new Date() : null,
        },
      });

      return tx.booking.findUnique({
        where: { id: createdBooking.id },
        include: {
          showtime: {
            include: {
              movie: { select: { title: true, posterUrl: true } }, // ✅ added posterUrl
              hall: { select: { name: true } },
            },
          },
          tickets: {
            include: {
              seat: {
                select: {
                  row: true,
                  seatNumber: true,
                },
              },
            },
          },
          payment: true,
        },
      });
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}