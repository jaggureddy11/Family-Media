import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, uploadId, parts } = await request.json();
    if (!key || !uploadId || !Array.isArray(parts)) {
      return NextResponse.json(
        { error: "Missing key, uploadId, or parts array" },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    const result = await storage.completeMultipart(key, uploadId, parts);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Failed to complete multipart upload:", err);
    return NextResponse.json(
      { error: err.message || "Failed to complete multipart upload" },
      { status: 500 }
    );
  }
}
