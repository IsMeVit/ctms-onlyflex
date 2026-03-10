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

// GET /api/admin/booking - List bookings
export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session || session.user.role !== "ADMIN") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId") || "";
		const showtimeId = searchParams.get("showtimeId") || "";
		const status = searchParams.get("status") || "";
		const sortBy = searchParams.get("sortBy") || "createdAt";
		const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
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
									row: true,
									seatNumber: true,
									column: true,
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

// POST /api/admin/booking - Create booking
export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session || session.user.role !== "ADMIN") {
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
			prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
			prisma.showtime.findUnique({ where: { id: showtimeId }, select: { id: true } }),
		]);

		if (!existingUser) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		if (!existingShowtime) {
			return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
		}

		const booking = await prisma.booking.create({
			data: {
				userId,
				showtimeId,
				subtotal: parsedSubtotal,
				totalDiscount: parsedTotalDiscount,
				finalAmount: parsedFinalAmount,
				bookingStatus: bookingStatus || "PENDING",
			},
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

		return NextResponse.json(booking, { status: 201 });
	} catch (error) {
		console.error("Error creating booking:", error);
		return NextResponse.json(
			{ error: "Failed to create booking" },
			{ status: 500 }
		);
	}
}
