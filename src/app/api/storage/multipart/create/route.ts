import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, contentType } = await request.json();
    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const storage = getStorageProvider();
    const result = await storage.createMultipartUpload(
      key,
      contentType || "application/octet-stream"
    );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Failed to create multipart upload:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create multipart upload" },
      { status: 500 }
    );
  }
}
