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
    const { key, contentType, action = "put" } = await request.json();

    if (!key) {
      return NextResponse.json({ error: "Missing storage key" }, { status: 400 });
    }

    const storage = getStorageProvider();

    if (action === "put") {
      const uploadUrl = await storage.getSignedUploadUrl(
        key,
        contentType || "application/octet-stream",
        1800 // 30 minutes
      );
      return NextResponse.json({ uploadUrl, key });
    } else {
      const readUrl = await storage.getSignedReadUrl(key, 7200);
      return NextResponse.json({ readUrl, key });
    }
  } catch (err: any) {
    console.error("Storage presigned URL error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
