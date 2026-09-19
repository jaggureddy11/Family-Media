import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/files
 * Admin creates a new folder (max 3 levels deep).
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
    const { folderName, parentPath = "/" } = body;

    if (!folderName || typeof folderName !== "string") {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const cleanName = folderName.trim().replace(/[/\\?%*:|"<>]/g, "");
    const normalizedParent = parentPath.endsWith("/") ? parentPath : `${parentPath}/`;
    const fullPath = `${normalizedParent}${cleanName}/`;

    // Verify depth <= 3
    const depth = fullPath.split("/").filter(Boolean).length;
    if (depth > 3) {
      return NextResponse.json(
        { error: "Maximum folder depth (3 levels) reached" },
        { status: 400 }
      );
    }

    // Create a placeholder directory record
    await prisma.mediaItem.create({
      data: {
        type: "FILE",
        status: "READY",
        title_en: `${cleanName} Folder`,
        title_te: `${cleanName} ఫోల్డర్`,
        folderPath: fullPath,
        sizeBytes: BigInt(0),
        checksumSha256: "0".repeat(64),
        mimeType: "application/x-directory",
        originalKey: `folders${fullPath}.keep`,
      },
    });

    return NextResponse.json({ success: true, folderPath: fullPath });
  } catch (error: any) {
    console.error("Create folder error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create folder" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/files
 * Admin renames or moves a folder or file.
 */
export async function PUT(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, title_en, title_te, targetFolderPath } = body;

    if (!id) {
      return NextResponse.json({ error: "Media item ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (title_en) updateData.title_en = title_en;
    if (title_te) updateData.title_te = title_te;
    if (targetFolderPath) {
      const normalizedTarget = targetFolderPath.endsWith("/")
        ? targetFolderPath
        : `${targetFolderPath}/`;
      updateData.folderPath = normalizedTarget;
    }

    const updated = await prisma.mediaItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Update file error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/files
 * Admin deletes a folder or file with confirmation.
 */
export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const folderPath = searchParams.get("folderPath");

    if (id) {
      // Delete single file
      await prisma.mediaItem.delete({ where: { id } });
      return NextResponse.json({ success: true, deletedId: id });
    }

    if (folderPath) {
      // Delete all files in this folder path
      const normalizedFolder = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;
      const allFiles = await prisma.mediaItem.findMany({
        where: { type: "FILE" },
      });

      const toDelete = allFiles.filter((f: any) =>
        f.folderPath && (f.folderPath === normalizedFolder || f.folderPath.startsWith(normalizedFolder))
      );

      for (const item of toDelete) {
        await prisma.mediaItem.delete({ where: { id: item.id } });
      }

      return NextResponse.json({ success: true, deletedFolder: normalizedFolder, count: toDelete.length });
    }

    return NextResponse.json({ error: "id or folderPath is required" }, { status: 400 });
  } catch (error: any) {
    console.error("Delete file/folder error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete file or folder" },
      { status: 500 }
    );
  }
}
