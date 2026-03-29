import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  let dbStatus = "ok";

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = "error";
  }

  return NextResponse.json({
    status: dbStatus === "ok" ? "healthy" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbStatus,
    responseTime: Date.now() - start,
  }, { status: dbStatus === "ok" ? 200 : 503 });
}
