import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (!user) {
      return NextResponse.json({ message: "If the email exists, a reset code has been sent." });
    }

    await createAndSendOtp(user.id, user.email, "PASSWORD_RESET");

    return NextResponse.json({ message: "If the email exists, a reset code has been sent." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
