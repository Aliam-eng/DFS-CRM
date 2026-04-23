import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveFile } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { DocumentType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as "kyc-documents" | "proof-of-address" | "aml-reports";
    const kycSubmissionId = formData.get("kycSubmissionId") as string | null;
    const documentType = formData.get("documentType") as string | null;
    const side = formData.get("side") as string | null;

    if (!file || !category) {
      return NextResponse.json({ error: "File and category are required" }, { status: 400 });
    }

    const result = await saveFile(file, category);

    // Create KycDocument record if kycSubmissionId provided
    if (kycSubmissionId && documentType) {
      const doc = await prisma.kycDocument.create({
        data: {
          kycSubmissionId,
          documentType: documentType as DocumentType,
          fileName: result.fileName,
          filePath: result.filePath,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          side: side || null,
        },
      });
      return NextResponse.json({ ...result, documentId: doc.id });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
