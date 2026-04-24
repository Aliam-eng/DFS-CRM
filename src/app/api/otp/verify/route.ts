import { NextResponse } from "next/server";
import { otpSchema } from "@/lib/validators/auth";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = otpSchema.parse(body);

    let isValid = false;
    try {
      isValid = await verifyOtp(data.email, data.code, data.purpose);
    } catch (err) {
      console.error("verifyOtp threw:", err);
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 500 }
      );
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Email verified successfully." });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
