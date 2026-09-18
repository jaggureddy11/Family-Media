import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSession, generateRandomToken, hashToken, TWENTY_FOUR_HOURS_MS } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate single-use token
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS);

    await prisma.deviceLink.create({
      data: {
        userId: user.id,
        tokenHash,
        createdByAdminId: session.user.id,
        expiresAt,
      },
    });

    // Derive host from request headers
    const host = request.headers.get("host") || "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const linkUrl = `${proto}://${host}/link/${rawToken}`;

    // Generate QR code data URL
    const qrDataUrl = await QRCode.toDataURL(linkUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return NextResponse.json({
      success: true,
      rawToken,
      linkUrl,
      qrDataUrl,
      expiresAt: expiresAt.toISOString(),
      userNameEn: user.name_en,
      userNameTe: user.name_te,
    });
  } catch (error) {
    console.error("Error creating device link:", error);
    return NextResponse.json(
      { error: "Failed to create device link" },
      { status: 500 }
    );
  }
}
