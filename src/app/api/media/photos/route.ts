import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import { formatBilingualDate, formatBilingualMonthYear } from "@/lib/strings";

export const dynamic = "force-dynamic";

/**
 * GET /api/media/photos
 * Query params:
 * - tab: 'timeline' | 'albums' | 'favorites'
 * - albumId?: string
 * - year?: number
 * - limit?: number
 */
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab") || "timeline";
  const albumId = searchParams.get("albumId");
  const yearParam = searchParams.get("year");
  const storage = getStorageProvider();

  try {
    // 1. Fetch all favorites for current user
    const userFavorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
    });
    const favoriteMediaIds = new Set(userFavorites.map((f: any) => f.mediaItemId));

    // TAB: ALBUMS LISTING
    if (tab === "albums" && !albumId) {
      const albums = await prisma.album.findMany({
        include: {
          items: {
            include: { mediaItem: true },
          },
          _count: { select: { items: true } },
        },
        orderBy: { year: "desc" },
      });

      // Also generate auto yearly albums from photos and family videos
      const allPhotosAndVideos = await prisma.mediaItem.findMany({
        where: {
          type: { in: ["PHOTO", "FAMILY_VIDEO"] },
          status: "READY",
        },
        orderBy: { createdAt: "desc" },
      });

      // Group by year for auto yearly albums
      const yearMap = new Map<number, any[]>();
      allPhotosAndVideos.forEach((item: any) => {
        const d = item.takenAt ? new Date(item.takenAt) : new Date(item.createdAt);
        const y = item.year || d.getFullYear() || new Date().getFullYear();
        if (!yearMap.has(y)) yearMap.set(y, []);
        yearMap.get(y)!.push(item);
      });

      const yearlyAlbumsList = Array.from(yearMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([year, items]) => {
          const coverItem = items[0];
          return {
            id: `auto_year_${year}`,
            isAutoYearly: true,
            year,
            title_en: `${year} Memories`,
            title_te: `${year} జ్ఞాపకాలు`,
            count: items.length,
            coverUrl: coverItem
              ? storage.getSignedReadUrl(coverItem.thumbKey || coverItem.storageKey || coverItem.originalKey, 3600)
              : null,
          };
        });

      const customAlbumsList = albums.map((alb: any) => {
        const coverItem = alb.items?.[0]?.mediaItem;
        const coverKey = alb.coverKey || coverItem?.thumbKey || coverItem?.storageKey || coverItem?.originalKey;
        return {
          id: alb.id,
          isAutoYearly: false,
          year: alb.year,
          title_en: alb.title_en,
          title_te: alb.title_te,
          count: alb._count?.items ?? alb.items?.length ?? 0,
          coverUrl: coverKey ? storage.getSignedReadUrl(coverKey, 3600) : null,
        };
      });

      return NextResponse.json({
        yearlyAlbums: yearlyAlbumsList,
        customAlbums: customAlbumsList,
      });
    }

    // TAB: ALBUM DETAIL
    if (albumId) {
      let items: any[] = [];
      let albumTitle = { en: "Album", te: "ఆల్బమ్" };

      if (albumId.startsWith("auto_year_")) {
        const year = parseInt(albumId.replace("auto_year_", ""), 10);
        albumTitle = { en: `${year} Memories`, te: `${year} జ్ఞాపకాలు` };
        const media = await prisma.mediaItem.findMany({
          where: {
            type: { in: ["PHOTO", "FAMILY_VIDEO"] },
            status: "READY",
          },
          orderBy: { createdAt: "desc" },
        });
        items = media.filter((m: any) => {
          const d = m.takenAt ? new Date(m.takenAt) : new Date(m.createdAt);
          return (m.year || d.getFullYear()) === year;
        });
      } else {
        const alb = await prisma.album.findUnique({
          where: { id: albumId },
          include: { items: { include: { mediaItem: true } } },
        });
        if (alb) {
          albumTitle = { en: alb.title_en, te: alb.title_te };
          items = (alb.items || []).map((ai: any) => ai.mediaItem).filter(Boolean);
        }
      }

      const formatted = items.map((item: any) => {
        const d = item.takenAt ? new Date(item.takenAt) : new Date(item.createdAt);
        return {
          id: item.id,
          type: item.type,
          title_en: item.title_en || item.titleEn || "Photo",
          title_te: item.title_te || item.titleTe || "ఫోటో",
          year: item.year || d.getFullYear(),
          takenAt: d.toISOString(),
          bilingualDate: formatBilingualDate(d),
          thumbUrl: storage.getSignedReadUrl(item.thumbKey || item.posterKey || item.storageKey || item.originalKey, 3600),
          fullUrl: storage.getSignedReadUrl(item.storageKey || item.originalKey, 3600),
          durationSeconds: item.durationSeconds || item.durationSec || 0,
          isFavorite: favoriteMediaIds.has(item.id),
        };
      });

      return NextResponse.json({
        album: {
          id: albumId,
          title_en: albumTitle.en,
          title_te: albumTitle.te,
        },
        items: formatted,
      });
    }

    // TAB: FAVORITES
    if (tab === "favorites") {
      const favs = await prisma.favorite.findMany({
        where: { userId: session.user.id },
        include: { mediaItem: true },
        orderBy: { createdAt: "desc" },
      });

      const items = favs
        .map((f: any) => f.mediaItem)
        .filter((item: any): item is NonNullable<typeof item> => Boolean(item && (item.type === "PHOTO" || item.type === "FAMILY_VIDEO" || item.type === "MOVIE")))
        .map((item: any) => {
          const d = item.takenAt ? new Date(item.takenAt) : new Date(item.createdAt);
          return {
            id: item.id,
            type: item.type,
            title_en: item.title_en || item.titleEn || "Media",
            title_te: item.title_te || item.titleTe || "మీడియా",
            year: item.year || d.getFullYear(),
            takenAt: d.toISOString(),
            bilingualDate: formatBilingualDate(d),
            thumbUrl: storage.getSignedReadUrl(item.thumbKey || item.posterKey || item.storageKey || item.originalKey, 3600),
            fullUrl: storage.getSignedReadUrl(item.storageKey || item.originalKey, 3600),
            durationSeconds: item.durationSeconds || item.durationSec || 0,
            isFavorite: true,
          };
        });

      return NextResponse.json({ items });
    }

    // TAB: TIMELINE (DEFAULT)
    let whereClause: any = {
      type: { in: ["PHOTO", "FAMILY_VIDEO"] },
      status: "READY",
    };

    if (yearParam) {
      const parsedYear = parseInt(yearParam, 10);
      if (!isNaN(parsedYear)) {
        whereClause.year = parsedYear;
      }
    }

    const mediaList = await prisma.mediaItem.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    // Extract all available years for the YearJumpBar
    const availableYearsSet = new Set<number>();
    mediaList.forEach((m: any) => {
      const d = m.takenAt ? new Date(m.takenAt) : new Date(m.createdAt);
      const y = m.year || d.getFullYear();
      if (y) availableYearsSet.add(y);
    });
    const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);

    // Group items by Year -> Month
    interface TimelineGroup {
      key: string;
      year: number;
      month: number;
      title: { en: string; te: string };
      items: any[];
    }

    const groupsMap = new Map<string, TimelineGroup>();

    mediaList.forEach((item: any) => {
      const d = item.takenAt ? new Date(item.takenAt) : new Date(item.createdAt);
      const year = item.year || d.getFullYear() || new Date().getFullYear();
      const month = d.getMonth(); // 0-11
      const groupKey = `${year}-${String(month + 1).padStart(2, "0")}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          key: groupKey,
          year,
          month,
          title: formatBilingualMonthYear(year, month),
          items: [],
        });
      }

      groupsMap.get(groupKey)!.items.push({
        id: item.id,
        type: item.type,
        title_en: item.title_en || item.titleEn || "Photo",
        title_te: item.title_te || item.titleTe || "ఫోటో",
        year,
        takenAt: d.toISOString(),
        bilingualDate: formatBilingualDate(d),
        thumbUrl: storage.getSignedReadUrl(item.thumbKey || item.posterKey || item.storageKey || item.originalKey, 3600),
        fullUrl: storage.getSignedReadUrl(item.storageKey || item.originalKey, 3600),
        durationSeconds: item.durationSeconds || item.durationSec || 0,
        isFavorite: favoriteMediaIds.has(item.id),
      });
    });

    // Sort groups descending (newest first)
    const timelineGroups = Array.from(groupsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    // Flatten all items for the continuous Fullscreen Viewer
    const allFlatItems = timelineGroups.flatMap((g) => g.items);

    return NextResponse.json({
      availableYears,
      groups: timelineGroups,
      totalCount: allFlatItems.length,
    });
  } catch (error: any) {
    console.error("Photos API error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch photos" }, { status: 500 });
  }
}
