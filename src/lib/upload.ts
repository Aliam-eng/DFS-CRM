import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_BASE = path.join(process.cwd(), "uploads");

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
}

export async function saveFile(
  file: File,
  category: "kyc-documents" | "proof-of-address" | "aml-reports"
): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum size is 10MB.");
  }

  const categoryDir = path.join(UPLOAD_BASE, category);
  if (!existsSync(categoryDir)) {
    await mkdir(categoryDir, { recursive: true });
  }

  const ext = path.extname(file.name) || ".bin";
  const uniqueName = `${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(categoryDir, uniqueName);
  const relativePath = `${category}/${uniqueName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  return {
    fileName: file.name,
    filePath: relativePath,
    fileSize: file.size,
    mimeType: file.type,
  };
}
