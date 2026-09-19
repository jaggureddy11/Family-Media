import { NextRequest, NextResponse } from "next/server";
import {
  hashToken,
  createDeviceSession,
  createSignedCookieValue,
  SESSION_COOKIE_NAME,
  checkRateLimit,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || undefined;

  // Rate limit redemption attempts
  const maxAttempts = process.env.NODE_ENV === "production" ? 15 : 100;
  const rateLimit = await checkRateLimit(`redeem_${ip}`, maxAttempts, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.redirect(new URL("/link/error?type=rate_limit", request.url));
  }

  const tokenHash = hashToken(token);

  const link = await prisma.deviceLink.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  // State 1: Invalid / Not found
  if (!link) {
    return NextResponse.redirect(new URL("/link/error?type=not_found", request.url));
  }

  // State 2: Already used
  if (link.usedAt) {
    return NextResponse.redirect(new URL("/link/error?type=already_used", request.url));
  }

  // State 3: Expired
  if (link.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/link/error?type=expired", request.url));
  }

  // Valid Single-Use Device Link!
  // 1. Mark link as redeemed
  await prisma.deviceLink.update({
    where: { id: link.id },
    data: { usedAt: new Date() },
  });

  // 2. Create 12-month persistent session
  const deviceName = `${link.user.name_en}'s Device`;
  const { rawToken, expiresAt } = await createDeviceSession({
    userId: link.user.id,
    deviceName,
    userAgent,
    ipAddress: ip,
  });

  // 3. Create signed cookie value
  const signedValue = createSignedCookieValue(rawToken, link.user.role, expiresAt);

  // 4. Instant redirect to Home! Mom does not need to type anything!
  const response = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE_NAME, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return response;
}
