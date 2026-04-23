import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import { UTApi } from "uploadthing/server";

const UPLOAD_BASE = path.join(process.cwd(), "uploads");
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type StorageProvider = "LOCAL" | "UPLOADTHING";
export type FileCategory = "kyc-documents" | "proof-of-address" | "aml-reports";

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  provider: StorageProvider;
}

function getProvider(): StorageProvider {
  const p = (process.env.STORAGE_PROVIDER || "LOCAL").toUpperCase();
  return p === "UPLOADTHING" ? "UPLOADTHING" : "LOCAL";
}

function validate(file: File) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large. Maximum size is 10MB.");
  }
}

async function saveLocal(file: File, category: FileCategory): Promise<UploadResult> {
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
    provider: "LOCAL",
  };
}

async function saveUploadThing(file: File, category: FileCategory): Promise<UploadResult> {
  if (!process.env.UPLOADTHING_TOKEN) {
    throw new Error("UPLOADTHING_TOKEN not configured");
  }

  const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN });
  const ext = path.extname(file.name) || ".bin";
  const uniqueName = `${category}-${crypto.randomUUID()}${ext}`;

  const uploadFile = new File([await file.arrayBuffer()], uniqueName, { type: file.type });
  const res = await utapi.uploadFiles(uploadFile);

  if (res.error || !res.data) {
    throw new Error(res.error?.message || "UploadThing upload failed");
  }

  return {
    fileName: file.name,
    filePath: res.data.ufsUrl || res.data.url,
    fileSize: file.size,
    mimeType: file.type,
    provider: "UPLOADTHING",
  };
}

export async function saveFile(file: File, category: FileCategory): Promise<UploadResult> {
  validate(file);
  const provider = getProvider();
  return provider === "UPLOADTHING" ? saveUploadThing(file, category) : saveLocal(file, category);
}

export function isExternalUrl(filePath: string): boolean {
  return /^https?:\/\//.test(filePath);
}

export function getActiveProvider(): StorageProvider {
  return getProvider();
}
