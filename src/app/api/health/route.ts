import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, database: "mysql" });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "mysql",
        error: error instanceof Error ? error.message : "unknown",
      },
      { status: 503 },
    );
  }
}
