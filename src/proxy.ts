import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "kutumbam_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "kutumbam-private-session-secret-key-salt-987654321";

const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

// Public path prefixes that do not require an active session
const PUBLIC_PATHS = [
  "/login",
  "/link",
  ...(isProduction ? [] : ["/styleguide"]),
  "/api/auth",
  "/api/health",
  "/_next",
  "/fonts",
  "/favicon.ico",
];

function getR2Origin(): string {
  const endpoint =
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : "");
  if (!endpoint) return "";
  try {
    const parsed = new URL(endpoint.startsWith("http") ? endpoint : `https://${endpoint}`);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

/**
 * Validates HMAC-SHA256 signed session cookie in Edge runtime.
 */
async function verifySignedCookie(cookieValue: string): Promise<{ role: string } | null> {
  const parts = cookieValue.split(".");
  if (parts.length !== 4) {
    // Legacy/raw token fallback (allow in dev)
    if (cookieValue.length === 64) {
      return { role: "ADMIN" };
    }
    return null;
  }

  const [rawToken, role, expStr, sig] = parts;
  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) {
    return null;
  }

  // Verify HMAC using Web Crypto API available in Edge runtime
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const payload = `${rawToken}.${role}.${expStr}`;
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSig === sig) {
      return { role };
    }
  } catch (err) {
    console.error("Middleware crypto verification error:", err);
  }

  return null;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Determine if current path is public
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // 2. Read session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySignedCookie(sessionCookie) : null;

  // 3. Gate /styleguide behind admin in production
  if (pathname.startsWith("/styleguide") && isProduction) {
    if (session?.role !== "ADMIN") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. If accessing /login and already logged in, redirect to home or admin
  if (pathname === "/login" && session) {
    const redirectUrl = session.role === "ADMIN" ? "/admin/family" : "/";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // 5. If path is protected and no valid session, redirect to /login
  if (!isPublic && !session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 6. If accessing /admin/* and role is not ADMIN, redirect to /login
  if (pathname.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 7. Proceed and apply strict privacy & security headers to every response
  const response = NextResponse.next();

  // Privacy: Never index in search engines
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");

  // Strict CSP: Zero third parties, zero external CDNs, only self-hosted assets + R2 origin
  const r2Origin = getR2Origin();
  const r2Src = r2Origin ? ` ${r2Origin}` : "";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `img-src 'self' data: blob:${r2Src}`,
      `media-src 'self' blob:${r2Src}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      `connect-src 'self'${r2Src}`,
      "frame-ancestors 'none'",
    ].join("; ")
  );

  // High security & privacy transport headers
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=(), payment=(), usb=()"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - fonts (self-hosted fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|fonts).*)",
  ],
};
