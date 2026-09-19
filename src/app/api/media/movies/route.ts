import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "ALL"; // ALL | TELUGU | FAVORITES
  const q = searchParams.get("q")?.trim();

  try {
    const where: any = {
      type: "MOVIE",
      status: "READY",
    };

    if (q) {
      where.OR = [
        { title_en: { contains: q, mode: "insensitive" } },
        { title_te: { contains: q, mode: "insensitive" } },
      ];
    }

    // Retrieve user's favorite movie IDs if user is logged in
    let userFavoriteIds = new Set<string>();
    let userWatchProgressMap = new Map<string, any>();

    if (userId) {
      const favorites = await prisma.favorite.findMany({
        where: { userId },
      });
      userFavoriteIds = new Set(favorites.map((f: any) => f.mediaItemId));

      const progressItems = await prisma.watchProgress.findMany({
        where: { userId },
      });
      progressItems.forEach((wp: any) => {
        userWatchProgressMap.set(wp.mediaItemId, wp);
      });
    }

    if (filter === "FAVORITES") {
      where.id = { in: Array.from(userFavoriteIds) };
    }

    const items = await prisma.mediaItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const storage = getStorageProvider();

    // Map items with signed URLs, progress, and favorite state
    const movies = await Promise.all(
      items.map(async (item: any) => {
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

        const wp = userWatchProgressMap.get(item.id);
        const isFavorite = userFavoriteIds.has(item.id);

        return {
          id: item.id,
          type: item.type,
          status: item.status,
          titleEn: item.title_en || item.titleEn,
          titleTe: item.title_te || item.titleTe,
          year: item.year,
          durationSeconds: item.durationSeconds || item.durationSec || 0,
          posterUrl: posterUrl || thumbUrl,
          thumbUrl,
          isFavorite,
          progress: wp
            ? {
                positionSeconds: wp.positionSeconds,
                durationSeconds: wp.durationSeconds,
                isCompleted: wp.isCompleted,
                percent:
                  wp.durationSeconds > 0
                    ? Math.round((wp.positionSeconds / wp.durationSeconds) * 100)
                    : 0,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ movies });
  } catch (err: any) {
    console.error("Failed to load movies:", err);
    return NextResponse.json({ error: err.message || "Failed to load movies", stack: err.stack }, { status: 500 });
  }
}
