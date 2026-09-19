import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  checkRateLimit,
  verifyAdminPassphrase,
  getOrCreatePrimaryAdmin,
  createDeviceSession,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitKey = `login_${ip}`;
  const maxAttempts = process.env.NODE_ENV === "production" ? 5 : 100;
  const limit = await checkRateLimit(rateLimitKey, maxAttempts, 15 * 60 * 1000);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "tooManyAttempts" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { passphrase } = body;

    if (!passphrase) {
      return NextResponse.json(
        { error: "invalidPassphrase" },
        { status: 400 }
      );
    }

    const isValid = await verifyAdminPassphrase(passphrase);
    if (!isValid) {
      return NextResponse.json(
        { error: "invalidPassphrase" },
        { status: 401 }
      );
    }

    const admin = await getOrCreatePrimaryAdmin();
    const userAgent = request.headers.get("user-agent") || undefined;
    const { rawToken, expiresAt } = await createDeviceSession({
      userId: admin.id,
      deviceName: "Admin Browser",
      userAgent,
      ipAddress: ip,
    });

    const cookieStore = await cookies();
    setSessionCookie(cookieStore, rawToken, expiresAt, admin.role);

    return NextResponse.json({ success: true, redirect: "/admin/family" });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "somethingWentWrong" },
      { status: 500 }
    );
  }
}
