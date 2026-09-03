import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications";

const STAFF_ROLES = ["OPERATIONS", "COMPLIANCE", "ADMIN", "SUPER_ADMIN"];

// Ops/Compliance/Admin can touch KYC documents while a KYC is under
// review or has been rejected — but NOT while it's a client-owned
// draft, and NOT after it's been finally approved.
const MUTABLE_STATUSES = new Set([
  "SUBMITTED",
  "OPERATIONS_APPROVED",
  "OPERATIONS_REJECTED",
  "COMPLIANCE_REJECTED",
]);

interface RouteParams {
  params: { id: string; docId: string };
}

// PATCH — replace an existing document with a fresh upload from staff.
// Same documentType + side as the original so the review page slot is
// preserved. Old DB record is removed; a KycHistory entry captures the
// old and new filenames for audit.
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || !STAFF_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await prisma.kycDocument.findUnique({
      where: { id: params.docId },
      include: {
        kycSubmission: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });
    if (!doc || doc.kycSubmissionId !== params.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!MUTABLE_STATUSES.has(doc.kycSubmission.status)) {
      return NextResponse.json(
        { error: `Cannot edit documents while KYC is ${doc.kycSubmission.status}` },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Persist new file, create replacement record, drop old record.
    // File on disk from the old upload is intentionally left in place —
    // KYC audit trail favors keeping the original bytes even after the
    // DB reference is dropped.
    const saved = await saveFile(file, "kyc-documents");
    const newDoc = await prisma.$transaction(async (tx) => {
      await tx.kycDocument.delete({ where: { id: doc.id } });
      return tx.kycDocument.create({
        data: {
          kycSubmissionId: params.id,
          documentType: doc.documentType,
          side: doc.side,
          fileName: saved.fileName,
          filePath: saved.filePath,
          fileSize: saved.fileSize,
          mimeType: saved.mimeType,
        },
      });
    });

    await prisma.kycHistory.create({
      data: {
        kycSubmissionId: params.id,
        action: "DOCUMENT_REPLACED",
        performedBy: session.user.id,
        changes: {
          documentType: doc.documentType,
          side: doc.side ?? null,
          oldFileName: doc.fileName,
          oldPath: doc.filePath,
          newFileName: saved.fileName,
          newPath: saved.filePath,
        },
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "STAFF_DOC_REPLACED",
      details: `Replaced ${doc.documentType}${doc.side ? ` (${doc.side})` : ""} for KYC ${params.id} — ${doc.fileName} → ${saved.fileName}`,
    });

    await createNotification({
      userId: doc.kycSubmission.user.id,
      type: "GENERAL",
      title: "A document on your KYC was updated",
      message: `Staff replaced your ${doc.documentType.replace(/_/g, " ")}${doc.side ? ` (${doc.side})` : ""}.`,
      link: "/client/kyc/status",
    }).catch((e) => console.error("Notify client of doc replace failed:", e));

    return NextResponse.json({ document: newDoc });
  } catch (error: unknown) {
    console.error("Replace document error:", error);
    const message = error instanceof Error ? error.message : "Replace failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — remove a document. File left on disk (audit); DB record dropped.
export async function DELETE(_req: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user || !STAFF_ROLES.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doc = await prisma.kycDocument.findUnique({
      where: { id: params.docId },
      include: { kycSubmission: { select: { status: true, userId: true } } },
    });
    if (!doc || doc.kycSubmissionId !== params.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!MUTABLE_STATUSES.has(doc.kycSubmission.status)) {
      return NextResponse.json(
        { error: `Cannot edit documents while KYC is ${doc.kycSubmission.status}` },
        { status: 400 },
      );
    }

    await prisma.kycDocument.delete({ where: { id: doc.id } });

    await prisma.kycHistory.create({
      data: {
        kycSubmissionId: params.id,
        action: "DOCUMENT_REMOVED_BY_STAFF",
        performedBy: session.user.id,
        changes: {
          documentType: doc.documentType,
          side: doc.side ?? null,
          fileName: doc.fileName,
          path: doc.filePath,
        },
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "STAFF_DOC_REMOVED",
      details: `Removed ${doc.documentType}${doc.side ? ` (${doc.side})` : ""} for KYC ${params.id} — ${doc.fileName}`,
    });

    await createNotification({
      userId: doc.kycSubmission.userId,
      type: "GENERAL",
      title: "A document was removed from your KYC",
      message: `Staff removed your ${doc.documentType.replace(/_/g, " ")}${doc.side ? ` (${doc.side})` : ""}.`,
      link: "/client/kyc/status",
    }).catch((e) => console.error("Notify client of doc remove failed:", e));

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("Delete document error:", error);
    const message = error instanceof Error ? error.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
