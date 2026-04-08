import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function POST(req: NextRequest) {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@movietickets.com" },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { 
          message: "Admin user already exists",
          email: process.env.ADMIN_EMAIL || "admin@movietickets.com",
          password: process.env.ADMIN_PASSWORD || "admin123"
        },
        { status: 200 }
      );
    }

    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        name: "System Administrator",
        email: "admin@movietickets.com",
        password: hashedPassword,
        role: "ADMIN",
        membershipTier: "NONE",
      },
    });

    return NextResponse.json(
      { 
        message: "Admin user created successfully",
        email: process.env.ADMIN_EMAIL || "admin@movietickets.com",
        password: adminPassword,
        userId: admin.id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}
