import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const normalizePhone = (value: string) => value.replace(/\D/g, "");

const isEmailLike = (value: string) => value.includes("@");

const buildSyntheticEmail = (phone: string) => `phone-${phone}@onlyflex.local`;

export async function POST(req: NextRequest) {
  try {
    const { name, contact, email, password } = await req.json();
    const rawContact = (contact || email || "").trim();

    if (!name || !rawContact || !password) {
      return NextResponse.json(
        { error: "Name, contact, and password are required" },
        { status: 400 }
      );
    }

    const contactIsEmail = isEmailLike(rawContact);
    const normalizedPhone = normalizePhone(rawContact);
    const resolvedEmail = contactIsEmail ? rawContact.toLowerCase() : buildSyntheticEmail(normalizedPhone);
    const resolvedPhone = contactIsEmail ? null : normalizedPhone;

    if (!contactIsEmail && normalizedPhone.length < 7) {
      return NextResponse.json(
        { error: "Enter a valid email address or phone number" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: resolvedEmail },
          ...(resolvedPhone ? [{ phone: resolvedPhone }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Create user - always start with NONE membership tier
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email: resolvedEmail,
        phone: resolvedPhone,
        password: hashedPassword,
        membershipTier: "NONE",
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
