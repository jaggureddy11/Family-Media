import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = await getSession();

  if (!session) {
    // If cookie was present but invalid/revoked, clear it
    const response = NextResponse.json(
      { authenticated: false, error: "revoked_or_expired" },
      { status: 401 }
    );
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      name_en: session.user.name_en,
      name_te: session.user.name_te,
      role: session.user.role,
      textSize: session.user.textSize,
      highContrast: session.user.highContrast,
    },
    device: {
      id: session.device.id,
      deviceName: session.device.deviceName,
    },
  });
}
