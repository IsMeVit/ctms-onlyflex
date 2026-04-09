import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient, Prisma } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { validateSeatConfiguration, calculateTotalCapacity, generateOptimalGrid, assignSeatNumbers } from "@/lib/seat-logic";
import { Seat } from "@/types/seat";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/admin/halls/[id]/seats - Get all seats for a hall
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FRONT_DESK")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if hall exists
    const hall = await prisma.hall.findUnique({
      where: { id },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    const seats = await prisma.seat.findMany({
      where: { hallId: id },
      orderBy: [{ row: "asc" }, { column: "asc" }],
    });

    // Calculate capacity breakdown
    const typedSeats: Seat[] = seats.map(s => ({
      id: s.id,
      hallId: s.hallId,
      row: s.row,
      column: s.column,
      number: s.number,
      seatNumber: s.seatNumber,
      seatType: s.seatType as Seat['seatType'],
      status: s.status as Seat['status']
    }));

    const breakdown = calculateTotalCapacity(typedSeats);

    return NextResponse.json({ 
      seats: typedSeats, 
      hall,
      breakdown,
      isOverCapacity: breakdown.capacityUsed > hall.capacity
    });
  } catch (error) {
    console.error("Error fetching seats:", error);
    return NextResponse.json(
      { error: "Failed to fetch seats" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/halls/[id]/seats - Bulk update seats configuration with validation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FRONT_DESK")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if hall exists and get version for optimistic locking
    const hall = await prisma.hall.findUnique({
      where: { id },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    const body = await request.json();
    const { seats: seatsData, version } = body;

    if (!Array.isArray(seatsData)) {
      return NextResponse.json(
        { error: "Invalid seats data" },
        { status: 400 }
      );
    }

    // Optimistic locking check
    if (version !== undefined && hall.version !== version) {
      return NextResponse.json({
        error: "Conflict detected",
        message: "The configuration has been updated by another user. Please refresh to see changes.",
        currentVersion: hall.version
      }, { status: 409 });
    }

    // Convert to Seat type for validation
    const typedSeats: Seat[] = seatsData.map((s: Seat) => ({
      id: s.id || `${id}-${s.row}-${s.column}`,
      hallId: id,
      row: s.row,
      column: s.column,
      number: s.number ?? 0,
      seatNumber: s.seatNumber,
      seatType: s.seatType,
      status: s.status
    }));

    // STRICT VALIDATION
    const validation = validateSeatConfiguration(typedSeats, hall.capacity, hall.columns);

    if (!validation.isValid) {
      return NextResponse.json({
        error: "Validation failed",
        errors: validation.errors,
        capacityUsed: validation.capacityUsed,
        maxCapacity: hall.capacity,
        breakdown: validation.breakdown
      }, { status: 400 });
    }

    // Check if hall is published (block structural changes)
    if (hall.isPublished) {
      // Get current seats to compare
      const currentSeats = await prisma.seat.findMany({
        where: { hallId: id }
      });

      // Check for structural changes (not just status changes)
      const structuralChanges = detectStructuralChanges(currentSeats, typedSeats);
      
      if (structuralChanges.length > 0) {
        return NextResponse.json({
          error: "Hall is published",
          message: "Only status changes (ACTIVE, BLOCKED) are allowed for published halls.",
          blockedChanges: structuralChanges
        }, { status: 403 });
      }
    }

    // Assign seat numbers (skip inactive)
    const seatsWithNumbers = assignSeatNumbers(typedSeats);

    // Transaction to update seats
    await prisma.$transaction(async (tx) => {
      // Delete existing seats
      await tx.seat.deleteMany({
        where: { hallId: id }
      });

      // Create new seats
      await tx.seat.createMany({
        data: seatsWithNumbers.map(seat => ({
          id: seat.id.startsWith(`${id}-`) ? crypto.randomUUID() : seat.id,
          hallId: id,
          row: seat.row,
          column: seat.column,
          number: seat.number,
          seatNumber: seat.seatNumber,
          seatType: seat.seatType,
          status: seat.status
        }))
      });

      // Increment version for optimistic locking
      await tx.hall.update({
        where: { id },
        data: { 
          version: { increment: 1 },
          updatedAt: new Date()
        }
      });
    });

    // Fetch updated seats
    const updatedSeats = await prisma.seat.findMany({
      where: { hallId: id },
      orderBy: [{ row: "asc" }, { column: "asc" }]
    });

    const updatedHall = await prisma.hall.findUnique({
      where: { id }
    });

    return NextResponse.json({ 
      seats: updatedSeats,
      hall: updatedHall,
      breakdown: validation.breakdown,
      newVersion: updatedHall?.version
    });

  } catch (error) {
    console.error("Error updating seats:", error);
    return NextResponse.json(
      { error: "Failed to update seats" },
      { status: 500 }
    );
  }
}

// POST /api/admin/halls/[id]/seats - Auto-generate optimal grid for a hall
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FRONT_DESK")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if hall exists
    const hall = await prisma.hall.findUnique({
      where: { id },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Check if hall is published
    if (hall.isPublished) {
      return NextResponse.json({
        error: "Hall is published",
        message: "Cannot regenerate seats for a published hall. Unpublish first."
      }, { status: 403 });
    }

    const body = await request.json();
    const { columns, replace = true } = body;

    // Validation
    if (!columns || columns < 1 || columns > 50) {
      return NextResponse.json(
        { error: "Columns must be between 1 and 50" },
        { status: 400 }
      );
    }

    // Generate optimal grid using math-first approach
    const generatedSeats = generateOptimalGrid(hall.capacity, columns, id);

    // Validate generated configuration
    const validation = validateSeatConfiguration(generatedSeats, hall.capacity, columns);

    if (!validation.isValid) {
      return NextResponse.json({
        error: "Generated configuration is invalid",
        errors: validation.errors
      }, { status: 400 });
    }

    // Transaction to replace seats
    await prisma.$transaction(async (tx) => {
      if (replace) {
        await tx.seat.deleteMany({
          where: { hallId: id }
        });
      }

      await tx.seat.createMany({
        data: generatedSeats.map(seat => ({
          id: seat.id.startsWith(`${id}-`) ? crypto.randomUUID() : seat.id,
          hallId: id,
          row: seat.row,
          column: seat.column,
          number: seat.number,
          seatNumber: seat.seatNumber,
          seatType: seat.seatType,
          status: seat.status
        }))
      });

      // Update hall columns
      await tx.hall.update({
        where: { id },
        data: { 
          columns,
          version: { increment: 1 },
          updatedAt: new Date()
        }
      });
    });

    // Fetch and return all seats
    const seats = await prisma.seat.findMany({
      where: { hallId: id },
      orderBy: [{ row: "asc" }, { column: "asc" }],
    });

    const updatedHall = await prisma.hall.findUnique({
      where: { id }
    });

    return NextResponse.json({ 
      seats,
      hall: updatedHall,
      generated: generatedSeats.length,
      breakdown: validation.breakdown,
      message: `Generated optimal grid: ${Math.ceil(hall.capacity / columns)} rows × ${columns} columns`
    }, { status: 201 });

  } catch (error) {
    console.error("Error generating seats:", error);
    return NextResponse.json(
      { error: "Failed to generate seats" },
      { status: 500 }
    );
  }
}

/**
 * Detect structural changes between current and new seat configurations
 * Used when hall is published to block structural modifications
 */
function detectStructuralChanges(
  currentSeats: Seat[],
  newSeats: Seat[]
): string[] {
  const changes: string[] = [];
  
  // Create maps for comparison
  const currentMap = new Map(currentSeats.map(s => [`${s.row}-${s.column}`, s]));
  const newMap = new Map(newSeats.map(s => [`${s.row}-${s.column}`, s]));
  
  // Check for seat additions
  for (const [key, seat] of newMap) {
    if (!currentMap.has(key)) {
      changes.push(`Added seat at ${seat.row}-${seat.column}`);
    }
  }
  
  // Check for seat deletions
  for (const [key, seat] of currentMap) {
    if (!newMap.has(key)) {
      changes.push(`Deleted seat at ${seat.row}-${seat.column}`);
    }
  }
  
  // Check for type changes (excluding INACTIVE ↔ ACTIVE toggles)
  for (const [key, newSeat] of newMap) {
    const currentSeat = currentMap.get(key);
    if (currentSeat && currentSeat.seatType !== newSeat.seatType) {
      // Only block type changes, not status changes
      if (currentSeat.seatType !== 'REGULAR' || newSeat.seatType !== 'REGULAR') {
        changes.push(`Type change at ${newSeat.row}-${newSeat.column}: ${currentSeat.seatType} → ${newSeat.seatType}`);
      }
    }
  }
  
  return changes;
}
