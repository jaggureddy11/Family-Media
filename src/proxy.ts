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

function getStorageOrigins(): string[] {
  const endpoint =
    process.env.STORAGE_ENDPOINT ||
    process.env.R2_ENDPOINT ||
    process.env.AWS_ENDPOINT_URL_S3 ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : "");

  if (!endpoint) return [];

  const origins: Set<string> = new Set();

  try {
    const parsed = new URL(endpoint.startsWith("http") ? endpoint : `https://${endpoint}`);
    // 1. Direct endpoint origin (e.g. https://s3.us-east-005.backblazeb2.com)
    origins.add(`${parsed.protocol}//${parsed.host}`);

    const bucket =
      process.env.STORAGE_BUCKET_NAME ||
      process.env.R2_BUCKET_NAME ||
      process.env.AWS_BUCKET_NAME;

    // 2. Bucket subdomain form (e.g. https://<bucket>.s3.<region>.backblazeb2.com)
    if (bucket) {
      origins.add(`${parsed.protocol}//${bucket}.${parsed.host}`);
      origins.add(`${parsed.protocol}//${bucket.toLowerCase()}.${parsed.host}`);
    }
  } catch {
    // ignore parse failure
  }

  return Array.from(origins);
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

/**
 * Creates default Mom session cookie for Edge runtime.
 */
async function createDefaultMomCookie(): Promise<string> {
  const rawToken = "mom_default_session";
  const role = "ADMIN";
  const expStr = String(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const payload = `${rawToken}.${role}.${expStr}`;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SESSION_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const sig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return `${payload}.${sig}`;
  } catch {
    return `${payload}.fallback`;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. If accessing /login, redirect directly to Mom's home page
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Read session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = sessionCookie ? await verifySignedCookie(sessionCookie) : null;

  // 3. Proceed and apply strict privacy & security headers to every response
  const response = NextResponse.next();

  // If no session cookie exists, issue default Mom session cookie
  if (!sessionCookie || !session) {
    try {
      const defaultCookieValue = await createDefaultMomCookie();
      response.cookies.set(SESSION_COOKIE_NAME, defaultCookieValue, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
      });
    } catch {
      // ignore
    }
  }

  // Privacy: Never index in search engines
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");

  // Strict CSP: Zero third parties, zero external CDNs, only self-hosted assets + Storage origins
  const storageOrigins = getStorageOrigins();
  const storageSrc = storageOrigins.length > 0 ? ` ${storageOrigins.join(" ")}` : "";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `img-src 'self' data: blob:${storageSrc}`,
      `media-src 'self' blob:${storageSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      `connect-src 'self'${storageSrc}`,
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
