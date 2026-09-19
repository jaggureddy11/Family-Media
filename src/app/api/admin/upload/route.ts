import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const key =
      request.headers.get("x-storage-key") ||
      request.nextUrl.searchParams.get("key");
    const contentType =
      request.headers.get("content-type") || "application/octet-stream";

    if (!key) {
      return NextResponse.json(
        { error: "Missing x-storage-key header or key param" },
        { status: 400 }
      );
    }

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const storage = getStorageProvider();
    await storage.put(key, buffer, contentType);

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    console.error("Admin proxy upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
