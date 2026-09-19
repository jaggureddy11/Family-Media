import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import { formatBilingualDate } from "@/lib/strings";

export const dynamic = "force-dynamic";

/**
 * GET /api/media/family-videos
 * Returns all family videos grouped by Year, with watch progress and signed URLs.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") || "").toLowerCase().trim();
  const filter = searchParams.get("filter") || "all";
  const storage = getStorageProvider();

  try {
    const videos = await prisma.mediaItem.findMany({
      where: {
        type: "FAMILY_VIDEO",
        status: "READY",
      },
      orderBy: { createdAt: "desc" },
    });

    const userFavorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
    });
    const favoriteSet = new Set(userFavorites.map((f) => f.mediaItemId));

    const userProgress = await prisma.watchProgress.findMany({
      where: { userId: session.user.id },
    });
    const progressMap = new Map(
      userProgress.map((p) => [
        p.mediaItemId,
        {
          positionSeconds: p.positionSeconds,
          durationSeconds: p.durationSeconds,
          isCompleted: p.isCompleted,
        },
      ])
    );

    let filtered = videos.map((v) => {
      const d = v.takenAt ? new Date(v.takenAt) : new Date(v.createdAt);
      const year = v.year || d.getFullYear() || new Date().getFullYear();
      const progress = progressMap.get(v.id) || null;
      const isFav = favoriteSet.has(v.id);

      return {
        id: v.id,
        type: v.type,
        title_en: v.title_en || v.titleEn || "Family Video",
        title_te: v.title_te || v.titleTe || "కుటుంబ వీడియో",
        year,
        takenAt: d.toISOString(),
        bilingualDate: formatBilingualDate(d),
        durationSeconds: v.durationSeconds || v.durationSec || 0,
        posterUrl: storage.getSignedReadUrl(
          v.posterKey || v.thumbKey || v.storageKey || v.originalKey,
          3600
        ),
        videoUrl: storage.getSignedReadUrl(v.storageKey || v.originalKey, 3600),
        progress,
        isFavorite: isFav,
      };
    });

    // Apply search query
    if (query) {
      filtered = filtered.filter(
        (v) =>
          v.title_en.toLowerCase().includes(query) ||
          v.title_te.toLowerCase().includes(query)
      );
    }

    // Apply favorites filter
    if (filter === "favorites") {
      filtered = filtered.filter((v) => v.isFavorite);
    }

    // Group by Year
    const yearGroupsMap = new Map<number, any[]>();
    filtered.forEach((v) => {
      const y = v.year;
      if (!yearGroupsMap.has(y)) yearGroupsMap.set(y, []);
      yearGroupsMap.get(y)!.push(v);
    });

    const groups = Array.from(yearGroupsMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, items]) => ({
        year,
        title: {
          en: `${year} Videos`,
          te: `${year} వీడియోలు`,
        },
        items,
      }));

    return NextResponse.json({
      groups,
      totalCount: filtered.length,
    });
  } catch (error: any) {
    console.error("Family videos API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch family videos" },
      { status: 500 }
    );
  }
}
