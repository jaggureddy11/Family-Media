import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();

  const where: any = {};
  if (type && type !== "ALL") {
    where.type = type;
  }
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (q) {
    where.OR = [
      { title_en: { contains: q, mode: "insensitive" } },
      { title_te: { contains: q, mode: "insensitive" } },
      { originalKey: { contains: q, mode: "insensitive" } },
    ];
  }

  try {
    const items = await prisma.mediaItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        albumItems: {
          include: { album: true },
        },
      },
      take: 100,
    });

    const storage = getStorageProvider();

    // Map BigInt sizeBytes to string/number for JSON serialization and resolve poster/thumb URLs
    const serializedItems = await Promise.all(
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

        return {
          ...item,
          titleEn: item.title_en || item.titleEn,
          titleTe: item.title_te || item.titleTe,
          originalName: item.originalKey ? item.originalKey.split("/").pop() : item.title_en,
          durationSec: item.durationSeconds ? Math.round(item.durationSeconds) : item.durationSec,
          sizeBytes: item.sizeBytes ? item.sizeBytes.toString() : "0",
          posterUrl,
          thumbUrl,
        };
      })
    );

    return NextResponse.json({ items: serializedItems });
  } catch (err: any) {
    console.error("Failed to fetch media library:", err);
    return NextResponse.json({ error: "Failed to fetch media library" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      type,
      titleEn,
      titleTe,
      originalName,
      year,
      durationSec,
      width,
      height,
      sizeBytes,
      mimeType,
      storageKey,
      posterKey,
      thumbKey,
      subtitleKey,
      checksum,
      takenAt,
    } = body;

    const title_en = titleEn || body.title_en || originalName;
    const title_te = titleTe || body.title_te || title_en;
    const originalKey = storageKey || body.originalKey;
    const checksumSha256 = checksum || body.checksumSha256 || `sha256_${Date.now()}`;

    // Direct Zero-Ops creation: status is READY because all processing occurred in browser
    const item = await prisma.mediaItem.create({
      data: {
        type,
        status: "READY",
        title_en,
        title_te,
        year: year ? parseInt(year, 10) : undefined,
        durationSeconds: durationSec ? parseFloat(durationSec) : undefined,
        sizeBytes: sizeBytes ? BigInt(sizeBytes) : BigInt(0),
        mimeType: mimeType || "application/octet-stream",
        originalKey,
        checksumSha256,
        posterKey: posterKey || undefined,
        thumbKey: thumbKey || undefined,
        subtitleKey: subtitleKey || undefined,
        takenAt: takenAt ? new Date(takenAt) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        titleEn: item.title_en,
        titleTe: item.title_te,
        originalName: item.originalKey.split("/").pop() || item.title_en,
        sizeBytes: item.sizeBytes.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create media item" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, titleEn, titleTe, year, type, albumId } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (titleEn !== undefined) {
      updateData.title_en = titleEn;
      updateData.titleEn = titleEn;
    }
    if (titleTe !== undefined) {
      updateData.title_te = titleTe;
      updateData.titleTe = titleTe;
    }
    if (year !== undefined) updateData.year = year ? parseInt(year, 10) : null;
    if (type !== undefined) updateData.type = type;

    const updated = await prisma.mediaItem.update({
      where: { id },
      data: updateData,
    });

    // Handle album assignment if provided
    if (albumId) {
      await prisma.albumItem.upsert({
        where: {
          albumId_mediaItemId: {
            albumId,
            mediaItemId: id,
          },
        },
        create: {
          albumId,
          mediaItemId: id,
        },
        update: {},
      });
    }

    return NextResponse.json({
      success: true,
      item: {
        ...updated,
        sizeBytes: updated.sizeBytes.toString(),
      },
    });
  } catch (err: any) {
    console.error("Failed to update media item:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update media item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing item ID" }, { status: 400 });
    }

    const item = await prisma.mediaItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Delete keys from storage bucket
    const storage = getStorageProvider();
    try {
      if (item.storageKey) await storage.delete(item.storageKey);
      if (item.posterKey) await storage.delete(item.posterKey);
      if (item.thumbKey) await storage.delete(item.thumbKey);
      if (item.subtitleKey) await storage.delete(item.subtitleKey);
    } catch (storageErr) {
      console.warn("Storage deletion warning:", storageErr);
    }

    // Delete record from database
    await prisma.mediaItem.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("Failed to delete media item:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete media item" },
      { status: 500 }
    );
  }
}
