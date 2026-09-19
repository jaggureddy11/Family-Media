import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/albums
 * Lists all custom albums with item counts.
 */
export async function GET(request?: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const albums = await prisma.album.findMany({
      include: {
        items: { include: { mediaItem: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ albums });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/albums
 * Creates a new custom album.
 */
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title_en, title_te, year, coverKey, mediaItemIds } = body;

    if (!title_en || !title_te) {
      return NextResponse.json(
        { error: "Bilingual titles (English and Telugu) are required" },
        { status: 400 }
      );
    }

    const album = await prisma.album.create({
      data: {
        title_en,
        title_te,
        year: year ? parseInt(year, 10) : null,
        coverKey: coverKey || null,
        isAutoYearly: false,
      },
    });

    if (Array.isArray(mediaItemIds) && mediaItemIds.length > 0) {
      for (let i = 0; i < mediaItemIds.length; i++) {
        await prisma.albumItem.create({
          data: {
            albumId: album.id,
            mediaItemId: mediaItemIds[i],
            sortOrder: i,
          },
        });
      }
    }

    return NextResponse.json({ success: true, album });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/albums
 * Updates album titles, cover, or adds/removes items.
 */
export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { albumId, title_en, title_te, coverKey, addMediaItemIds, removeMediaItemIds } = body;

    if (!albumId) {
      return NextResponse.json({ error: "albumId is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (title_en) updateData.title_en = title_en;
    if (title_te) updateData.title_te = title_te;
    if (coverKey !== undefined) updateData.coverKey = coverKey;

    const album = await prisma.album.update({
      where: { id: albumId },
      data: updateData,
    });

    if (Array.isArray(addMediaItemIds)) {
      for (const mediaId of addMediaItemIds) {
        await prisma.albumItem.upsert({
          where: {
            albumId_mediaItemId: {
              albumId,
              mediaItemId: mediaId,
            },
          },
          create: {
            albumId,
            mediaItemId: mediaId,
          },
          update: {},
        });
      }
    }

    if (Array.isArray(removeMediaItemIds)) {
      for (const mediaId of removeMediaItemIds) {
        await prisma.albumItem.deleteMany({
          where: {
            albumId,
            mediaItemId: mediaId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, album });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/albums?id=...
 */
export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    await prisma.album.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
