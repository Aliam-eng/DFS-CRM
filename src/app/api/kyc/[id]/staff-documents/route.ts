import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";

const ALLOWED_ROLES = ["OPERATIONS", "COMPLIANCE", "ADMIN", "SUPER_ADMIN"] as const;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user || !ALLOWED_ROLES.includes(session.user.role as (typeof ALLOWED_ROLES)[number])) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const notes = (formData.get("notes") as string | null)?.trim() || null;
    const label = (formData.get("label") as string | null)?.trim() || null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const kyc = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });

    if (!kyc) {
      return NextResponse.json({ error: "KYC not found" }, { status: 404 });
    }

    const result = await saveFile(file, "kyc-documents");

    const staffName = session.user.name || session.user.email;
    const labelPart = label ? ` — ${label}` : "";
    const taggedFileName = `[Staff Upload by ${staffName}${labelPart}] ${result.fileName}`;

    const doc = await prisma.kycDocument.create({
      data: {
        kycSubmissionId: kyc.id,
        documentType: "STAFF_UPLOAD",
        fileName: taggedFileName,
        filePath: result.filePath,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
      },
    });

    const detailParts = [
      `Staff: ${staffName}`,
      `KYC owner: ${kyc.user.email}`,
    ];
    if (label) detailParts.push(`Label: ${label}`);
    if (notes) detailParts.push(`Notes: ${notes}`);

    await logActivity({
      userId: session.user.id,
      action: "STAFF_DOC_UPLOADED",
      details: detailParts.join(" | "),
    });

    await createNotification({
      userId: kyc.userId,
      type: "GENERAL",
      title: "New document on your KYC",
      message: `${staffName} uploaded a supporting document${label ? ` (${label})` : ""} to your KYC file.`,
      link: "/client/kyc/status",
    });

    return NextResponse.json(doc);
  } catch (error: unknown) {
    console.error("Staff document upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
