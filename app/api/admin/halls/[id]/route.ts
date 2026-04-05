import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { generateSeatsFromRowConfigs, RowConfig } from "@/lib/hall-utils";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// GET /api/admin/halls/[id] - Get single hall
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

    const hall = await prisma.hall.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            showtimes: true,
            seats: true,
          },
        },
        seats: {
          orderBy: [{ row: "asc" }, { column: "asc" }],
        },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    return NextResponse.json({
      hall: {
        ...hall,
        rowConfigs: (hall as { rowConfigs?: unknown }).rowConfigs as
          | Array<{ startRow: string; endRow: string; seatType: string }>
          | undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching hall:", error);
    return NextResponse.json(
      { error: "Failed to fetch hall" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/halls/[id] - Update hall
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
    const { name, hallType, screenType, isActive, isPublished, rows, columns, rowConfigs } = body;

    // Check if hall exists
    const existingHall = await prisma.hall.findUnique({
      where: { id },
    });

    if (!existingHall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Validation
    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { error: "Hall name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name (excluding current hall)
    if (name && name !== existingHall.name) {
      const duplicateHall = await prisma.hall.findFirst({
        where: { name: { equals: name.trim(), mode: "insensitive" } },
      });

      if (duplicateHall) {
        return NextResponse.json(
          { error: "A hall with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Determine rows and columns (use existing if not provided)
    const newRows = rows || existingHall.rows;
    const newColumns = columns || existingHall.columns;
    const newCapacity = newRows * newColumns;

    // Use transaction to update hall and regenerate seats if rowConfigs provided
    const hall = await prisma.$transaction(async (tx) => {
      // Build update data with proper handling
      const updateData: Record<string, unknown> = {};

      if (name) updateData.name = name.trim();
      if (hallType) updateData.hallType = hallType;
      if (screenType) updateData.screenType = screenType;
      updateData.capacity = newCapacity;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isPublished !== undefined) updateData.isPublished = isPublished;
      if (rows) updateData.rows = rows;
      if (columns) updateData.columns = columns;
      if (rowConfigs !== undefined) {
        updateData.rowConfigs = rowConfigs;
      }

      // Update hall basic info
      const updatedHall = await tx.hall.update({
        where: { id },
        data: updateData as Prisma.HallUpdateInput,
      });

      // If rowConfigs provided, regenerate all seats
      if (rowConfigs !== undefined && Array.isArray(rowConfigs)) {
        console.log("Regenerating seats with rowConfigs:", JSON.stringify(rowConfigs));
        
        // Delete all existing seats
        await tx.seat.deleteMany({ where: { hallId: id } });

        // Generate new seats from rowConfigs
        const seatsToCreate = generateSeatsFromRowConfigs(
          newRows,
          newColumns,
          rowConfigs as RowConfig[],
          id
        );
        
        console.log("Generated seats:", seatsToCreate.length, "seats");

        // Create new seats
        await tx.seat.createMany({
          data: seatsToCreate,
        });
      }

      // Return updated hall with counts
      return tx.hall.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              showtimes: true,
              seats: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ 
      hall: {
        ...hall,
        rowConfigs: (hall as { rowConfigs?: unknown }).rowConfigs as
          | Array<{ startRow: string; endRow: string; seatType: string }>
          | undefined,
      } 
    });
  } catch (error) {
    console.error("Error updating hall:", error);
    return NextResponse.json(
      { error: "Failed to update hall" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/halls/[id] - Update hall with form data including rowConfigs
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown>;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else if (contentType.includes("application/form-data") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {};
      formData.forEach((value, key) => {
        if (key === "rowConfigs") {
          try {
            body[key] = JSON.parse(value as string);
          } catch {
            body[key] = value;
          }
        } else if (key === "capacity" || key === "rows" || key === "columns") {
          body[key] = parseInt(value as string, 10);
        } else if (key === "isActive") {
          body[key] = value === "true" || value === "1";
        } else {
          body[key] = value;
        }
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 415 }
      );
    }

    const { name, hallType, screenType, capacity, rows, columns, isActive, rowConfigs } = body;

    const existingHall = await prisma.hall.findUnique({
      where: { id },
    });

    if (!existingHall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    if (name !== undefined && typeof name === "string" && !name.trim()) {
      return NextResponse.json(
        { error: "Hall name is required" },
        { status: 400 }
      );
    }

    if (name && typeof name === "string" && name !== existingHall.name) {
      const duplicateHall = await prisma.hall.findFirst({
        where: { name: { equals: name.trim(), mode: "insensitive" } },
      });

      if (duplicateHall) {
        return NextResponse.json(
          { error: "A hall with this name already exists" },
          { status: 400 }
        );
      }
    }

    const rowsNum = typeof rows === "number" ? rows : undefined;
    const columnsNum = typeof columns === "number" ? columns : undefined;
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = (name as string).trim();
    }
    if (hallType !== undefined) {
      updateData.hallType = hallType;
    }
    if (screenType !== undefined) {
      updateData.screenType = screenType;
    }
    if (capacity !== undefined) {
      updateData.capacity = capacity;
    }
    if (rows !== undefined) {
      updateData.rows = rows;
    }
    if (columns !== undefined) {
      updateData.columns = columns;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    if (rowConfigs !== undefined) {
      updateData.rowConfigs = rowConfigs as unknown as Prisma.InputJsonValue;
      updateData.capacity = (rowsNum ?? existingHall.rows) * (columnsNum ?? existingHall.columns);
    }

    const hall = await prisma.$transaction(async (tx) => {
      const updatedHall = await tx.hall.update({
        where: { id },
        data: updateData,
      });

      // If rowConfigs provided, regenerate all seats
      if (rowConfigs !== undefined) {
        await tx.seat.deleteMany({ where: { hallId: id } });

        const seatsToCreate = generateSeatsFromRowConfigs(
          rowsNum ?? existingHall.rows,
          columnsNum ?? existingHall.columns,
          rowConfigs as RowConfig[],
          id
        );

        await tx.seat.createMany({
          data: seatsToCreate,
        });
      }

      return tx.hall.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              showtimes: true,
              seats: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ hall });
  } catch (error) {
    console.error("Error patching hall:", error);
    return NextResponse.json(
      { error: "Failed to update hall" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/halls/[id] - Delete hall
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

    // Check if hall exists
    const existingHall = await prisma.hall.findUnique({
      where: { id },
      include: {
        _count: {
          select: { showtimes: true, seats: true },
        },
      },
    });

    if (!existingHall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Check for existing showtimes
    if (existingHall._count.showtimes > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete hall with scheduled showtimes. Please remove all showtimes first." 
        },
        { status: 400 }
      );
    }

    // Delete seats first, then delete hall (in transaction)
    await prisma.$transaction([
      prisma.seat.deleteMany({ where: { hallId: id } }),
      prisma.hall.delete({ where: { id } })
    ]);

    return NextResponse.json({ 
      success: true,
      deletedSeats: existingHall._count.seats,
      message: `Hall "${existingHall.name}" and ${existingHall._count.seats} seats deleted successfully`
    });
  } catch (error) {
    console.error("Error deleting hall:", error);
    return NextResponse.json(
      { error: "Failed to delete hall" },
      { status: 500 }
    );
  }
}
