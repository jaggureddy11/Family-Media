import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { checksum, filename } = await request.json();

    if (!checksum && !filename) {
      return NextResponse.json({ exists: false });
    }

    const whereClause: any = {};
    if (checksum) {
      whereClause.checksum = checksum;
    } else if (filename) {
      whereClause.originalName = filename;
    }

    const existing = await prisma.mediaItem.findFirst({
      where: whereClause,
      select: {
        id: true,
        titleEn: true,
        titleTe: true,
        year: true,
        type: true,
        createdAt: true,
      },
    });

    if (existing) {
      return NextResponse.json({
        exists: true,
        existingItem: existing,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (err: any) {
    console.error("Duplicate check error:", err);
    return NextResponse.json({ exists: false });
  }
}
