import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient, Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type DateRange = "today" | "week" | "month" | "year" | "all";

function getDateRange(range: DateRange): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);

  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(start.getDate() - 7);
      break;
    case "month":
      start.setMonth(start.getMonth() - 1);
      break;
    case "year":
      start.setFullYear(start.getFullYear() - 1);
      break;
    case "all":
      start.setFullYear(2000);
      break;
  }

  return { start, end };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") || "month") as DateRange;
    const { start, end } = getDateRange(range);

    const dateFilter: Prisma.BookingWhereInput = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    const dateFilterShowtime: Prisma.ShowtimeWhereInput = {
      startTime: {
        gte: start,
        lte: end,
      },
    };

    const dateFilterPayment: Prisma.PaymentWhereInput = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    // Get totals - get hall capacity from the hall record itself
    const [
      totalRevenueResult,
      totalBookingsResult,
      cancelledBookingsResult,
      totalUsersResult,
      hallsWithShowtimes,
      movies,
      showtimesWithBookings,
      bookings,
      payments,
    ] = await Promise.all([
      prisma.booking.aggregate({
        _sum: { finalAmount: true },
        where: {
          ...dateFilter,
          bookingStatus: { in: ["CONFIRMED", "PENDING"] },
        },
      }),
      prisma.booking.count({
        where: dateFilter,
      }),
      prisma.booking.count({
        where: {
          ...dateFilter,
          bookingStatus: "CANCELLED",
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.hall.findMany({
        select: {
          id: true,
          name: true,
          capacity: true,
          showtimes: {
            where: dateFilterShowtime,
            include: {
              bookings: {
                where: dateFilter,
              },
            },
          },
        },
      }),
      prisma.movie.findMany({
        include: {
          showtimes: {
            where: dateFilterShowtime,
            include: {
              bookings: {
                where: {
                  ...dateFilter,
                  bookingStatus: { in: ["CONFIRMED", "PENDING"] },
                },
              },
            },
          },
        },
      }),
      prisma.showtime.findMany({
        where: dateFilterShowtime,
        include: {
          bookings: {
            where: dateFilter,
          },
          hall: {
            select: {
              id: true,
              name: true,
              capacity: true,
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: dateFilter,
        orderBy: { createdAt: "asc" },
      }),
      prisma.payment.findMany({
        where: dateFilterPayment,
        orderBy: { createdAt: "asc" },
      }),
    ]);

    // Calculate total capacity and occupancy from showtimes
    const totalCapacity = hallsWithShowtimes.reduce(
      (sum, hall) => sum + (hall.capacity || 0),
      0
    );
    const totalShowtimeCapacity = showtimesWithBookings.reduce(
      (sum, st) => sum + (st.hall.capacity || 0),
      0
    );
    const totalBookedSeats = showtimesWithBookings.reduce(
      (sum, st) =>
        sum +
        st.bookings.filter(
          (b) => b.bookingStatus === "CONFIRMED" || b.bookingStatus === "PENDING"
        ).length,
      0
    );
    const occupancyRate =
      totalShowtimeCapacity > 0
        ? Math.round((totalBookedSeats / totalShowtimeCapacity) * 100)
        : 0;

    // Revenue by day
    const revenueByDay: Record<string, number> = {};
    payments
      .filter((p) => p.status === "COMPLETED")
      .forEach((payment) => {
        const date = new Date(payment.createdAt).toISOString().split("T")[0];
        revenueByDay[date] =
          (revenueByDay[date] || 0) + Number(payment.amount);
      });

    // Revenue by hall
    const revenueByHall: Record<string, number> = {};
    hallsWithShowtimes.forEach((hall: { name: string; showtimes: Array<{ bookings: Array<{ bookingStatus: string; finalAmount: unknown }> }> }) => {
      const hallRevenue = hall.showtimes.reduce((sum, st) => {
        return (
          sum +
          st.bookings
            .filter(
              (b: { bookingStatus: string }) =>
                b.bookingStatus === "CONFIRMED" || b.bookingStatus === "PENDING"
            )
            .reduce((s: number, b: { finalAmount: unknown }) => s + Number(b.finalAmount), 0)
        );
      }, 0);
      revenueByHall[hall.name] = hallRevenue;
    });

    // Top movies by revenue
    const movieRevenue = movies
      .map((movie) => {
        const revenue = movie.showtimes.reduce((sum, st) => {
          return (
            sum +
            st.bookings
              .filter(
                (b) =>
                  b.bookingStatus === "CONFIRMED" ||
                  b.bookingStatus === "PENDING"
              )
              .reduce((s, b) => s + Number(b.finalAmount), 0)
          );
        }, 0);
        const bookings = movie.showtimes.reduce(
          (sum, st) =>
            sum +
            st.bookings.filter(
              (b) =>
                b.bookingStatus === "CONFIRMED" || b.bookingStatus === "PENDING"
            ).length,
          0
        );
        return {
          id: movie.id,
          title: movie.title,
          revenue,
          bookings,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Booking trends by day
    const bookingsByDay: Record<string, number> = {};
    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt).toISOString().split("T")[0];
      bookingsByDay[date] = (bookingsByDay[date] || 0) + 1;
    });

    // Peak hours analysis
    const hourlyBookings: Record<number, number> = {};
    bookings.forEach((booking) => {
      if (
        booking.bookingStatus === "CONFIRMED" ||
        booking.bookingStatus === "PENDING"
      ) {
        const hour = new Date(booking.createdAt).getHours();
        hourlyBookings[hour] = (hourlyBookings[hour] || 0) + 1;
      }
    });
    const peakHours = Object.entries(hourlyBookings)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Cancellation rate
    const cancellationRate =
      totalBookingsResult > 0
        ? Math.round((cancelledBookingsResult / totalBookingsResult) * 100)
        : 0;

    // Format revenue by day for chart
    const revenueChartData = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    // Format bookings by day for chart
    const bookingsChartData = Object.entries(bookingsByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);

    return NextResponse.json({
      summary: {
        totalRevenue: totalRevenueResult._sum.finalAmount || 0,
        totalBookings: totalBookingsResult,
        cancelledBookings: cancelledBookingsResult,
        cancellationRate,
        occupancyRate,
        totalCapacity,
        newUsers: totalUsersResult,
      },
      revenueByHall,
      topMovies: movieRevenue,
      revenueByDay: revenueChartData,
      bookingsByDay: bookingsChartData,
      peakHours,
      range: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
