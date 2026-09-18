import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devices = await prisma.device.findMany({
    orderBy: { lastSeenAt: "desc" },
    include: {
      user: {
        select: { id: true, name_en: true, name_te: true, role: true },
      },
    },
  });

  return NextResponse.json({ devices });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { deviceId } = body;

    if (!deviceId) {
      return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
    }

    const updated = await prisma.device.update({
      where: { id: deviceId },
      data: { isRevoked: true },
    });

    return NextResponse.json({ success: true, device: updated });
  } catch (error) {
    console.error("Error revoking device:", error);
    return NextResponse.json(
      { error: "Failed to revoke device" },
      { status: 500 }
    );
  }
}
