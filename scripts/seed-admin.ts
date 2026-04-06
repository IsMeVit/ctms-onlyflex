import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const dbUrl = process.env.DATABASE_URL?.replace("db:5432", "localhost:5432") 
  ?? "postgresql://postgres:admin123@localhost:5432/moviedb";
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error("❌ Missing required environment variables:");
  if (!adminEmail) console.error("   ADMIN_EMAIL is not set");
  if (!adminPassword) console.error("   ADMIN_PASSWORD is not set");
  console.error("\nPlease set these in your .env file.");
  process.exit(1);
}

async function seedAdmin() {
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log("Admin user already exists");
      console.log(`Email: ${adminEmail}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        name: "System Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        membershipTier: "NONE",
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(`Email: ${adminEmail}`);
    console.log(`User ID: ${admin.id}`);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
