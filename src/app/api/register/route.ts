import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators/auth";
import { createAndSendOtp } from "@/lib/otp";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        role: "CLIENT",
        status: "PENDING_VERIFICATION",
      },
    });

    await createAndSendOtp(user.id, user.email, "EMAIL_VERIFICATION");

    await logActivity({ userId: user.id, action: "USER_REGISTERED", details: `New client registered: ${data.email}` });

    return NextResponse.json(
      { message: "Registration successful. Please verify your email.", email: user.email },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Validation failed", details: (error as { issues: unknown }).issues }, { status: 400 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
