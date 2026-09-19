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

    // Derive origin from SITE_URL env var or real request headers (never hardcode localhost)
    const configuredSiteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    let origin = configuredSiteUrl?.replace(/\/+$/, "");

    if (!origin) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const host = forwardedHost || request.headers.get("host") || request.nextUrl.host;
      const proto =
        request.headers.get("x-forwarded-proto") ||
        (host && (host.startsWith("localhost") || host.startsWith("127.0.0.1")) ? "http" : "https");
      origin = `${proto}://${host}`;
    }

    const linkUrl = `${origin}/link/${rawToken}`;

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
