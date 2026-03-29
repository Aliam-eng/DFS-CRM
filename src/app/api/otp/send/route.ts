import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpSchema } from "@/lib/validators/auth";
import { createAndSendOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = sendOtpSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ message: "If the email exists, an OTP has been sent." });
    }

    // Rate limit: max 3 OTPs per 15 minutes
    const recentOtps = await prisma.otp.count({
      where: {
        userId: user.id,
        purpose: data.purpose,
        createdAt: { gt: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });

    if (recentOtps >= 3) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    await createAndSendOtp(user.id, user.email, data.purpose);

    return NextResponse.json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
