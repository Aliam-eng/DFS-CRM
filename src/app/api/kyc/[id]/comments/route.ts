import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyByRole } from "@/lib/notifications";

const STAFF_ROLES = ["OPERATIONS", "COMPLIANCE", "ADMIN", "SUPER_ADMIN"];
const MAX_BODY_LENGTH = 4000;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || !STAFF_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kyc = await prisma.kycSubmission.findUnique({ where: { id: params.id } });
    if (!kyc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const comments = await prisma.kycComment.findMany({
      where: { kycSubmissionId: params.id },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("List KYC comments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || !STAFF_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const raw = typeof body?.body === "string" ? body.body.trim() : "";
    if (!raw) return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
    if (raw.length > MAX_BODY_LENGTH) {
      return NextResponse.json({ error: `Comment too long (max ${MAX_BODY_LENGTH} chars)` }, { status: 400 });
    }

    const kyc = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!kyc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const comment = await prisma.kycComment.create({
      data: {
        kycSubmissionId: params.id,
        authorUserId: session.user.id,
        body: raw,
      },
      include: {
        author: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    // Cross-team notification (fire and forget — a notification failure
    // must NOT prevent the comment from being stored).
    const authorName = `${comment.author.firstName} ${comment.author.lastName}`.trim();
    const clientName = `${kyc.user.firstName} ${kyc.user.lastName}`.trim();
    const preview = raw.length > 120 ? raw.slice(0, 117) + "..." : raw;
    const authorRole = session.user.role;
    const notifyTargets: Array<"OPERATIONS" | "COMPLIANCE"> = [];
    if (authorRole === "OPERATIONS") notifyTargets.push("COMPLIANCE");
    else if (authorRole === "COMPLIANCE") notifyTargets.push("OPERATIONS");
    else {
      // ADMIN / SUPER_ADMIN → notify both teams
      notifyTargets.push("OPERATIONS", "COMPLIANCE");
    }
    Promise.all(
      notifyTargets.map((role) =>
        notifyByRole(
          role,
          "KYC_COMMENT",
          `New comment on ${clientName}'s KYC`,
          `${authorName} (${authorRole}): ${preview}`,
          `/${role.toLowerCase()}/reviews/${params.id}`,
        ),
      ),
    ).catch((e) => console.error("Failed to send KYC_COMMENT notifications:", e));

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Post KYC comment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
