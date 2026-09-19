import { NextRequest, NextResponse } from "next/server";
import {
  createDeviceSession,
  createSignedCookieValue,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Test session provisioning endpoint for automated testing in non-production environments.
 * Strictly disabled in production.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    return NextResponse.json({ error: "Disabled in production" }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || "mom-1";
    const role = body.role || Role.FAMILY;

    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          name_en: "Amma",
          name_te: "అమ్మా",
          role,
          textSize: "EXTRA_LARGE",
          highContrast: false,
        },
      });
    }

    const { rawToken, expiresAt } = await createDeviceSession({
      userId: user.id,
      deviceName: `${user.name_en}'s Test Device`,
    });

    const signedValue = createSignedCookieValue(rawToken, user.role, expiresAt);

    const response = NextResponse.json({
      success: true,
      cookieValue: signedValue,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        name_en: user.name_en,
        name_te: user.name_te,
        role: user.role,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, signedValue, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return response;
  } catch (err: any) {
    console.error("Test session provisioning error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to provision test session" },
      { status: 500 }
    );
  }
}
