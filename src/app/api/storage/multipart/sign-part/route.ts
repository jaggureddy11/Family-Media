import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageProvider } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, uploadId, partNumber } = await request.json();
    if (!key || !uploadId || !partNumber) {
      return NextResponse.json(
        { error: "Missing key, uploadId, or partNumber" },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    const url = await storage.signPart(key, uploadId, parseInt(partNumber, 10));

    return NextResponse.json({ url, partNumber });
  } catch (err: any) {
    console.error("Failed to sign multipart chunk:", err);
    return NextResponse.json(
      { error: err.message || "Failed to sign multipart chunk" },
      { status: 500 }
    );
  }
}
