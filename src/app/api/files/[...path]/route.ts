import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

export async function GET(req: Request, { params }: { params: { path: string[] } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const joined = params.path.join("/");

    // If the stored path is an external URL (e.g. UploadThing), redirect
    if (/^https?:\/\//.test(joined)) {
      return NextResponse.redirect(joined);
    }

    const filePath = path.join(process.cwd(), "uploads", ...params.path);
    const resolvedPath = path.resolve(filePath);

    // Prevent path traversal
    if (!resolvedPath.startsWith(path.resolve(process.cwd(), "uploads"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!existsSync(resolvedPath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fileBuffer = await readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(resolvedPath)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
