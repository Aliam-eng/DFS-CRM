import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["OPERATIONS", "COMPLIANCE", "ADMIN", "SUPER_ADMIN"];

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${date.getFullYear()}`;
}

function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${fmtDate(date)} ${hh}:${min}`;
}

async function loadClients(params: {
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
}) {
  const where: Prisma.UserWhereInput = { role: "CLIENT" };

  if (params.dateFrom || params.dateTo) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (params.dateFrom) {
      const d = new Date(params.dateFrom);
      if (!isNaN(d.getTime())) createdAt.gte = d;
    }
    if (params.dateTo) {
      const d = new Date(params.dateTo);
      if (!isNaN(d.getTime())) {
        d.setHours(23, 59, 59, 999);
        createdAt.lte = d;
      }
    }
    if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;
  }

  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { phone: { contains: params.search, mode: "insensitive" } },
    ];
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      status: true,
      emailVerified: true,
      createdAt: true,
      kycSubmission: {
        select: { status: true, submittedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// JSON preview list — used by the Reports page to show what will be exported
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");

    const clients = await loadClients({ dateFrom, dateTo, search });

    if (format === "csv") {
      const headers = [
        "Name",
        "Email",
        "Phone",
        "User Status",
        "Email Verified",
        "KYC Status",
        "Registered At",
        "KYC Submitted At",
      ];

      const lines: string[] = [headers.map(escapeCsv).join(",")];
      for (const c of clients) {
        const name = `${c.firstName} ${c.lastName}`.trim();
        const row = [
          name,
          c.email,
          c.phone ?? "",
          c.status,
          c.emailVerified ? "Yes" : "No",
          c.kycSubmission?.status ?? "NO_KYC",
          fmtDateTime(c.createdAt),
          fmtDateTime(c.kycSubmission?.submittedAt),
        ];
        lines.push(row.map(escapeCsv).join(","));
      }
      const csv = "﻿" + lines.join("\r\n");
      const today = new Date().toISOString().split("T")[0];
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="clients-report-${today}.csv"`,
        },
      });
    }

    // JSON preview
    return NextResponse.json({
      total: clients.length,
      clients: clients.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`.trim(),
        email: c.email,
        phone: c.phone,
        userStatus: c.status,
        emailVerified: c.emailVerified,
        kycStatus: c.kycSubmission?.status ?? "NO_KYC",
        createdAt: c.createdAt,
        submittedAt: c.kycSubmission?.submittedAt ?? null,
      })),
    });
  } catch (error) {
    console.error("Clients report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
