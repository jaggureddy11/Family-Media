import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

export const dynamic = "force-dynamic";

function getFileCategory(mimeType: string, filename: string): "PDF" | "AUDIO" | "IMAGE" | "OTHER" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (mimeType.includes("pdf") || ext === "pdf") return "PDF";
  if (mimeType.startsWith("audio/") || ["mp3", "m4a", "wav", "aac", "ogg", "flac"].includes(ext)) return "AUDIO";
  if (mimeType.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return "IMAGE";
  return "OTHER";
}

/**
 * GET /api/media/files?folder=/
 * Lists folders and files at the specified folder path.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const currentPath = searchParams.get("folder") || "/";
  const normalizedCurrent = currentPath.endsWith("/") ? currentPath : `${currentPath}/`;
  const storage = getStorageProvider();

  try {
    const allFiles = await prisma.mediaItem.findMany({
      where: {
        type: "FILE",
        status: "READY",
      },
      orderBy: { createdAt: "desc" },
    });

    // Determine subfolders and files in this folderPath
    const subfoldersSet = new Set<string>();
    const filesInFolder: any[] = [];

    allFiles.forEach((item) => {
      const itemFolder = item.folderPath ? (item.folderPath.endsWith("/") ? item.folderPath : `${item.folderPath}/`) : "/";
      
      if (itemFolder === normalizedCurrent) {
        filesInFolder.push(item);
      } else if (itemFolder.startsWith(normalizedCurrent)) {
        // There is a subfolder
        const relative = itemFolder.slice(normalizedCurrent.length);
        const nextSlash = relative.indexOf("/");
        if (nextSlash !== -1) {
          const subfolderName = relative.slice(0, nextSlash);
          subfoldersSet.add(subfolderName);
        }
      }
    });

    const folders = Array.from(subfoldersSet).map((name) => ({
      name,
      path: `${normalizedCurrent}${name}/`,
    }));

    const files = filesInFolder.map((item) => {
      const cat = getFileCategory(item.mimeType, item.originalKey || item.title_en);
      return {
        id: item.id,
        title_en: item.title_en || item.titleEn || "File",
        title_te: item.title_te || item.titleTe || "ఫైల్",
        category: cat,
        mimeType: item.mimeType,
        sizeBytes: Number(item.sizeBytes || 0),
        folderPath: normalizedCurrent,
        downloadUrl: storage.getSignedReadUrl(item.storageKey || item.originalKey, 3600),
        viewUrl: storage.getSignedReadUrl(item.storageKey || item.originalKey, 3600),
        createdAt: item.createdAt,
      };
    });

    return NextResponse.json({
      currentPath: normalizedCurrent,
      folders,
      files,
      totalCount: allFiles.length,
    });
  } catch (error: any) {
    console.error("Files API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch files" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/media/files
 * Admin creates a new folder.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
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

    // Create a placeholder .keep file to instantiate the folder in zero-ops database
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
        storageKey: `folders${fullPath}.keep`,
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
