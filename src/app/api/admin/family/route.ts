import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      devices: {
        where: { isRevoked: false },
        select: { id: true, deviceName: true, lastSeenAt: true },
      },
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name_en, name_te, role = Role.FAMILY } = body;

    if (!name_en || !name_te) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name_en,
        name_te,
        role: role === Role.ADMIN ? Role.ADMIN : Role.FAMILY,
        textSize: "EXTRA_LARGE",
        highContrast: false,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("Error creating family member:", error);
    return NextResponse.json(
      { error: "Failed to create family member" },
      { status: 500 }
    );
  }
}
