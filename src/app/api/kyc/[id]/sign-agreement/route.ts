import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp, verifyOtp } from "@/lib/otp";
import { logActivity } from "@/lib/activity-log";

/**
 * POST /api/kyc/[id]/sign-agreement
 * Two modes:
 *   - { action: "send" }                                  -> sends a fresh OTP to the client's email
 *   - { action: "verify", code, fullName }                -> verifies OTP and stamps signature
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kyc = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
      include: { user: true },
    });
    if (!kyc || kyc.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (kyc.status !== "DRAFT") {
      return NextResponse.json({ error: "Agreement can only be signed while KYC is in draft" }, { status: 400 });
    }

    const body = await req.json();
    const action = body.action as "send" | "verify";

    if (action === "send") {
      await createAndSendOtp(kyc.userId, kyc.user.email, "AGREEMENT_SIGNATURE");
      return NextResponse.json({ message: "Verification code sent to your email" });
    }

    if (action === "verify") {
      const code = String(body.code || "").trim();
      const fullName = String(body.fullName || "").trim();
      if (!code || code.length !== 6) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }
      if (!fullName) {
        return NextResponse.json({ error: "Full name is required" }, { status: 400 });
      }

      const ok = await verifyOtp(kyc.user.email, code, "AGREEMENT_SIGNATURE");
      if (!ok) {
        return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
      }

      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                 req.headers.get("x-real-ip") || "";

      const updated = await prisma.kycSubmission.update({
        where: { id: kyc.id },
        data: {
          agreementAccepted: true,
          agreementFullName: fullName,
          agreementSignedAt: new Date(),
          agreementOtpVerifiedAt: new Date(),
          agreementSignatureIp: ip,
        },
      });

      await logActivity({
        userId: session.user.id,
        action: "KYC_AGREEMENT_SIGNED",
        details: `Client agreement signed for KYC ${kyc.id} by ${fullName}`,
      });

      return NextResponse.json({
        message: "Agreement signed successfully",
        agreementSignedAt: updated.agreementSignedAt,
        agreementOtpVerifiedAt: updated.agreementOtpVerifiedAt,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Sign agreement error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
