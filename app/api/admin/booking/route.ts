import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { revalidatePath } from "next/cache";

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

// GET /api/admin/booking - List bookings
export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FRONT_DESK")) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId") || "";
		const showtimeId = searchParams.get("showtimeId") || "";
		const status = searchParams.get("status") || "";
		const search = searchParams.get("search") || "";
		const dateFrom = searchParams.get("dateFrom") || "";
		const dateTo = searchParams.get("dateTo") || "";
		const movieId = searchParams.get("movieId") || "";
		const hallId = searchParams.get("hallId") || "";
		
		const sortBy = searchParams.get("sortBy") || "createdAt";
		const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
		const format = searchParams.get("format");
		const isExport = format === "csv";
		
		const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
		const limit = Math.max(parseInt(searchParams.get("limit") || "10", 10), 1);

		const where: Prisma.BookingWhereInput = {};

		if (userId) {
			where.userId = userId;
		}

		if (showtimeId) {
			where.showtimeId = showtimeId;
		}

		if (status) {
			if (!isValidBookingStatus(status)) {
				return NextResponse.json(
					{ error: "Invalid booking status" },
					{ status: 400 }
				);
			}

			where.bookingStatus = status;
		}

		if (search) {
			where.OR = [
				{ id: { contains: search, mode: "insensitive" } },
				{ user: { name: { contains: search, mode: "insensitive" } } },
				{ user: { email: { contains: search, mode: "insensitive" } } },
				{ showtime: { movie: { title: { contains: search, mode: "insensitive" } } } },
			];
		}

		if (movieId) {
			where.showtime = { ...where.showtime as object, movieId };
		}

		if (hallId) {
			where.showtime = { ...where.showtime as object, hallId };
		}

		if (dateFrom || dateTo) {
			const dateFilter: Prisma.DateTimeFilter = {};
			if (dateFrom) dateFilter.gte = new Date(dateFrom);
			if (dateTo) dateFilter.lte = new Date(dateTo);
			where.showtime = { ...where.showtime as object, startTime: dateFilter };
		}

		const allowedSortFields = new Set([
			"createdAt",
			"updatedAt",
			"finalAmount",
			"subtotal",
			"totalDiscount",
			"bookingStatus",
		]);
		const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : "createdAt";
		const skip = (page - 1) * limit;

		const [bookings, totalCount] = await Promise.all([
			prisma.booking.findMany({
				where,
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
						select: {
							id: true,
							startTime: true,
							endTime: true,
							movie: {
								select: {
									id: true,
									title: true,
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
					payment: {
						select: {
							id: true,
							paymentMethod: true,
							status: true,
						},
					},
					tickets: {
						select: {
							id: true,
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
					_count: {
						select: {
							tickets: true,
						},
					},
				},
				orderBy: { [safeSortBy]: sortOrder },
				...(isExport ? {} : { skip, take: limit }),
			}),
			prisma.booking.count({ where }),
		]);

		if (isExport) {
			const headers = [
				"Booking ID",
				"Customer Name",
				"Customer Email",
				"Movie",
				"Hall",
				"Showtime",
				"Seats",
				"Subtotal",
				"Discount",
				"Final Amount",
				"Status",
				"Payment Method",
				"Created At"
			];

			const rows = bookings.map(b => {
				const seats = b.tickets.map(t => `${t.seat.row}${t.seat.seatNumber ?? t.seat.column}`).join("; ");
				return [
					b.id,
					b.user.name || "N/A",
					b.user.email,
					b.showtime.movie.title,
					b.showtime.hall.name,
					new Date(b.showtime.startTime).toLocaleString(),
					seats,
					b.subtotal.toString(),
					b.totalDiscount.toString(),
					b.finalAmount.toString(),
					b.bookingStatus,
					b.payment?.paymentMethod || "N/A",
					b.createdAt.toISOString()
				];
			});

			const csvContent = [
				headers.join(","),
				...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
			].join("\n");

			return new NextResponse(csvContent, {
				headers: {
					"Content-Type": "text/csv",
					"Content-Disposition": `attachment; filename="bookings-export-${new Date().toISOString().split('T')[0]}.csv"`
				}
			});
		}

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

// POST /api/admin/booking - Create booking
export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FRONT_DESK")) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			userId,
			showtimeId,
			subtotal,
			totalDiscount,
			finalAmount,
			bookingStatus,
			seatIds,
			paymentMethod,
		} = body;

		if (!userId || !showtimeId || subtotal === undefined || totalDiscount === undefined || finalAmount === undefined) {
			return NextResponse.json(
				{
					error:
						"userId, showtimeId, subtotal, totalDiscount, and finalAmount are required",
				},
				{ status: 400 }
			);
		}

		if (seatIds && !Array.isArray(seatIds)) {
			return NextResponse.json(
				{ error: "seatIds must be an array" },
				{ status: 400 }
			);
		}

		if (bookingStatus && !isValidBookingStatus(bookingStatus)) {
			return NextResponse.json(
				{ error: "Invalid bookingStatus value" },
				{ status: 400 }
			);
		}

		const parsedSubtotal = parseDecimal(subtotal);
		const parsedTotalDiscount = parseDecimal(totalDiscount);
		const parsedFinalAmount = parseDecimal(finalAmount);

		if (!parsedSubtotal || !parsedTotalDiscount || !parsedFinalAmount) {
			return NextResponse.json(
				{ error: "subtotal, totalDiscount, and finalAmount must be valid numbers" },
				{ status: 400 }
			);
		}

		const [existingUser, existingShowtime] = await Promise.all([
			prisma.user.findUnique({ where: { id: userId }, select: { id: true, membershipTier: true } }),
			prisma.showtime.findUnique({ where: { id: showtimeId }, select: { id: true, basePrice: true, vipMultiplier: true, twinseatMultiplier: true } }),
		]);

		if (!existingUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		if (!existingShowtime) {
			return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
		}

		// Check if seats are already booked
		if (seatIds && seatIds.length > 0) {
			const existingTickets = await prisma.ticket.findMany({
				where: {
					showtimeId,
					seatId: { in: seatIds },
				},
			});

			if (existingTickets.length > 0) {
				return NextResponse.json(
					{ error: "One or more seats are already booked" },
					{ status: 400 }
				);
			}
		}

		const booking = await prisma.$transaction(async (tx) => {
			const newBooking = await tx.booking.create({
				data: {
					userId,
					showtimeId,
					subtotal: parsedSubtotal,
					totalDiscount: parsedTotalDiscount,
					finalAmount: parsedFinalAmount,
					bookingStatus: bookingStatus || "PENDING",
				},
			});

			if (seatIds && seatIds.length > 0) {
				const seats = await tx.seat.findMany({
					where: { id: { in: seatIds } },
				});

				const ticketData = seats.map((seat) => {
					let price = Number(existingShowtime.basePrice);
					if (seat.seatType === "VIP") price *= Number(existingShowtime.vipMultiplier);
					if (seat.seatType === "TWINSEAT") price *= Number(existingShowtime.twinseatMultiplier);
					
					let discount = 0;
					if (existingUser.membershipTier === "MEMBER") {
						discount = price * 0.3; // 30% membership discount
					}

					return {
						bookingId: newBooking.id,
						showtimeId,
						seatId: seat.id,
						originalPrice: price,
						discountAmount: discount,
						finalPrice: price - discount,
						status: "CONFIRMED" as const,
					};
				});

				await tx.ticket.createMany({
					data: ticketData,
				});
			}

			if (paymentMethod && (bookingStatus === "CONFIRMED" || !bookingStatus)) {
				await tx.payment.create({
					data: {
						bookingId: newBooking.id,
						amount: parsedFinalAmount,
						paymentMethod: paymentMethod,
						status: "COMPLETED",
						paidAt: new Date(),
					},
				});
			}

			return newBooking;
		});

		const fullBooking = await prisma.booking.findUnique({
			where: { id: booking.id },
			include: {
				user: {
					select: { id: true, name: true, email: true },
				},
				showtime: {
					select: { id: true, startTime: true, endTime: true },
				},
				payment: true,
				tickets: true,
			},
		});

		revalidatePath("/admin/bookings", "page");

		return NextResponse.json(fullBooking, { status: 201 });
	} catch (error) {
		console.error("Error creating booking:", error);
		return NextResponse.json(
			{ error: "Failed to create booking" },
			{ status: 500 }
		);
	}
}
