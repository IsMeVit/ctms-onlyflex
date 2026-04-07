import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return NextResponse.json({
      status: "error",
      error: "DATABASE_URL is not set",
    });
  }

  const hidden = dbUrl.replace(/:[^:@]+@/, ":****@");
  
  return NextResponse.json({
    status: "ok",
    databaseUrl: hidden,
    hasPrismaGenerate: !!process.env.PRISMAGENERATE,
  });
}
