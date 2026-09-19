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
    const { mediaItemId } = await request.json();

    if (!mediaItemId) {
      return NextResponse.json({ error: "Missing mediaItemId" }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_mediaItemId: {
          userId,
          mediaItemId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: {
          userId_mediaItemId: {
            userId,
            mediaItemId,
          },
        },
      });
      return NextResponse.json({ isFavorite: false, mediaItemId });
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          mediaItemId,
        },
      });
      return NextResponse.json({ isFavorite: true, mediaItemId });
    }
  } catch (err: any) {
    console.error("Failed to toggle favorite:", err);
    return NextResponse.json({ error: "Failed to toggle favorite" }, { status: 500 });
  }
}
