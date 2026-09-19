import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getSession();

  try {
    const item = await prisma.mediaItem.findUnique({
      where: { id },
    });

    if (!item || item.status !== "READY") {
      return NextResponse.json({ error: "Media item not found or not ready" }, { status: 404 });
    }

    const storage = getStorageProvider();
    const expiresInSec = 7200; // 2 hours

    const videoUrl = await storage.getSignedReadUrl(item.originalKey, expiresInSec);

    return NextResponse.json({
      videoUrl,
      expiresAt: Date.now() + expiresInSec * 1000,
    });
  } catch (err: any) {
    console.error("Failed to refresh signed URL:", err);
    return NextResponse.json(
      { error: "Failed to refresh signed URL" },
      { status: 500 }
    );
  }
}
