import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let mediaItemId: string | undefined;
    let positionSeconds: number = 0;
    let durationSeconds: number = 0;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      mediaItemId = body.mediaItemId;
      positionSeconds = parseFloat(body.positionSeconds || "0");
      durationSeconds = parseFloat(body.durationSeconds || "0");
    } else {
      // Beacon or raw text
      const text = await request.text();
      try {
        const parsed = JSON.parse(text);
        mediaItemId = parsed.mediaItemId;
        positionSeconds = parseFloat(parsed.positionSeconds || "0");
        durationSeconds = parseFloat(parsed.durationSeconds || "0");
      } catch {
        // Parse URL-encoded if beacon was sent as form data
        const params = new URLSearchParams(text);
        mediaItemId = params.get("mediaItemId") || undefined;
        positionSeconds = parseFloat(params.get("positionSeconds") || "0");
        durationSeconds = parseFloat(params.get("durationSeconds") || "0");
      }
    }

    if (!mediaItemId) {
      return NextResponse.json({ error: "Missing mediaItemId" }, { status: 400 });
    }

    const isCompleted =
      durationSeconds > 0 && positionSeconds / durationSeconds >= 0.95;

    await prisma.watchProgress.upsert({
      where: {
        userId_mediaItemId: {
          userId,
          mediaItemId,
        },
      },
      create: {
        userId,
        mediaItemId,
        positionSeconds,
        durationSeconds,
        isCompleted,
        lastWatchedAt: new Date(),
      },
      update: {
        positionSeconds,
        durationSeconds,
        isCompleted,
        lastWatchedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      mediaItemId,
      positionSeconds,
      isCompleted,
    });
  } catch (err: any) {
    console.error("Failed to update watch progress:", err);
    return NextResponse.json(
      { error: "Failed to update watch progress" },
      { status: 500 }
    );
  }
}
