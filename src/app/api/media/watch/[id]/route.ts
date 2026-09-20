import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

async function withDbRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return withDbRetry(fn, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await getSession();
  const userId = session?.user?.id;

  try {
    const item: any = await withDbRetry(() =>
      prisma.mediaItem.findUnique({
        where: { id },
      })
    );

    if (!item) {
      return NextResponse.json({ error: "Media item not found" }, { status: 404 });
    }

    if (item.status !== "READY") {
      return NextResponse.json(
        { error: "Media item is not ready for playback", status: item.status },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    const expiresInSec = 7200; // 2 hours

    // Signed URLs for video, poster, and sidecar subtitles
    const videoUrl = await storage.getSignedReadUrl(item.originalKey, expiresInSec);

    let posterUrl: string | null = null;
    if (item.posterKey) {
      try {
        posterUrl = await storage.getSignedReadUrl(item.posterKey, expiresInSec);
      } catch {}
    }

    let subtitleUrl: string | null = null;
    if (item.subtitleKey) {
      try {
        subtitleUrl = await storage.getSignedReadUrl(item.subtitleKey, expiresInSec);
      } catch {}
    }

    // Retrieve watch progress for current user
    let progress = null;
    if (userId) {
      try {
        const wp: any = await withDbRetry(() =>
          prisma.watchProgress.findUnique({
            where: {
              userId_mediaItemId: {
                userId,
                mediaItemId: id,
              },
            },
          })
        );
        if (wp) {
          progress = {
            positionSeconds: wp.positionSeconds,
            durationSeconds: wp.durationSeconds,
            isCompleted: wp.isCompleted,
          };
        }
      } catch (e) {
        console.warn("Watch progress lookup non-fatal error:", e);
      }
    }

    return NextResponse.json({
      media: {
        id: item.id,
        type: item.type,
        titleEn: item.title_en || item.titleEn,
        titleTe: item.title_te || item.titleTe,
        year: item.year,
        durationSeconds: item.durationSeconds || item.durationSec || 0,
      },
      urls: {
        videoUrl,
        posterUrl,
        subtitleUrl,
        expiresAt: Date.now() + expiresInSec * 1000,
      },
      progress,
    });
  } catch (err: any) {
    console.error("Failed to load media for watch:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load media" },
      { status: 500 }
    );
  }
}
