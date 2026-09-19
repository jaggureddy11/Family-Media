import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ items: [] });
  }

  try {
    const progressList = await prisma.watchProgress.findMany({
      where: {
        userId,
        isCompleted: false,
      },
      orderBy: { lastWatchedAt: "desc" },
      take: 10,
    });

    const storage = getStorageProvider();
    const continueItems: any[] = [];

    for (const wp of progressList) {
      if (!wp.mediaItem) {
        // Fetch media item if not pre-included
        const media = await prisma.mediaItem.findUnique({
          where: { id: wp.mediaItemId },
        });
        if (!media || media.status !== "READY") continue;
        wp.mediaItem = media;
      }

      const item = wp.mediaItem;
      if (item.status !== "READY") continue;

      // Filter out items watched less than 10 seconds or more than 95%
      const duration = wp.durationSeconds || item.durationSeconds || item.durationSec || 0;
      if (wp.positionSeconds < 10) continue;
      if (duration > 0 && wp.positionSeconds / duration >= 0.95) continue;

      let posterUrl: string | undefined;
      let thumbUrl: string | undefined;

      if (item.posterKey) {
        try {
          posterUrl = await storage.getSignedReadUrl(item.posterKey, 7200);
        } catch {}
      }
      if (item.thumbKey) {
        try {
          thumbUrl = await storage.getSignedReadUrl(item.thumbKey, 7200);
        } catch {}
      }

      const percent =
        duration > 0 ? Math.round((wp.positionSeconds / duration) * 100) : 0;

      continueItems.push({
        id: item.id,
        type: item.type,
        titleEn: item.title_en || item.titleEn,
        titleTe: item.title_te || item.titleTe,
        year: item.year,
        durationSeconds: duration,
        positionSeconds: wp.positionSeconds,
        percent,
        posterUrl: posterUrl || thumbUrl,
        thumbUrl,
        lastWatchedAt: wp.lastWatchedAt,
      });

      if (continueItems.length >= 4) break;
    }

    return NextResponse.json({ items: continueItems });
  } catch (err: any) {
    console.error("Failed to load continue watching list:", err);
    return NextResponse.json({ items: [] });
  }
}
