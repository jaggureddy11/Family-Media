import crypto from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { Role, User } from "@prisma/client";

export const SESSION_COOKIE_NAME = "kutumbam_session";
export const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;
export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Rate limiting in-memory store (serverless-resilient fallback)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Checks sliding-window rate limit using Postgres (RateLimitAttempt table).
 * Falls back to in-memory map if database is not reachable.
 */
export async function checkRateLimit(
  key: string,
  maxAttempts = 5,
  windowMs = 15 * 60 * 1000
): Promise<{ allowed: boolean; remainingAttempts: number; resetAt: number }> {
  const now = Date.now();
  const windowStart = new Date(now - windowMs);

  try {
    // Delete expired attempts
    await prisma.rateLimitAttempt.deleteMany({
      where: {
        createdAt: { lt: windowStart },
      },
    });

    // Count attempts within active sliding window
    const currentAttempts = await prisma.rateLimitAttempt.count({
      where: {
        key,
        createdAt: { gte: windowStart },
      },
    });

    if (currentAttempts >= maxAttempts) {
      return { allowed: false, remainingAttempts: 0, resetAt: now + windowMs };
    }

    // Record new attempt
    await prisma.rateLimitAttempt.create({
      data: {
        key,
      },
    });

    return {
      allowed: true,
      remainingAttempts: maxAttempts - (currentAttempts + 1),
      resetAt: now + windowMs,
    };
  } catch {
    // In-memory fallback
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remainingAttempts: maxAttempts - 1, resetAt: now + windowMs };
    }

    if (entry.count >= maxAttempts) {
      return { allowed: false, remainingAttempts: 0, resetAt: entry.resetAt };
    }

    entry.count += 1;
    return { allowed: true, remainingAttempts: maxAttempts - entry.count, resetAt: entry.resetAt };
  }
}

/**
 * Computes a SHA-256 hash of a raw secret token.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a cryptographically strong random token.
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Verifies admin passphrase against environment configuration.
 * In production (NODE_ENV=production or on Vercel), ADMIN_PASSPHRASE_HASH (bcrypt/argon2/sha256)
 * is strictly required; plain ADMIN_PASSPHRASE is accepted only in development.
 */
export async function verifyAdminPassphrase(passphrase: string): Promise<boolean> {
  if (!passphrase) return false;

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const envHash = process.env.ADMIN_PASSPHRASE_HASH;
  const envPlain = process.env.ADMIN_PASSPHRASE;

  if (isProduction) {
    if (!envHash) {
      throw new Error(
        "ADMIN_PASSPHRASE_HASH is strictly required in production. Plaintext ADMIN_PASSPHRASE is disabled."
      );
    }
    // If bcrypt format ($2a$, $2b$, $2y$)
    if (envHash.startsWith("$2")) {
      return bcrypt.compare(passphrase, envHash);
    }
    // If SHA-256 hash
    return hashToken(passphrase) === envHash;
  }

  // Development/test
  if (envHash) {
    if (envHash.startsWith("$2")) {
      return bcrypt.compare(passphrase, envHash);
    }
    return hashToken(passphrase) === envHash;
  }

  // Plain passphrase allowed ONLY in development/test
  if (envPlain) {
    return passphrase === envPlain;
  }

  return false;
}

/**
 * Ensures a primary admin user exists in the database.
 */
export async function getOrCreatePrimaryAdmin(): Promise<User> {
  let admin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name_en: "Family Admin",
        name_te: "కుటుంబ నిర్వాహకుడు",
        email: process.env.ADMIN_EMAIL || "admin@kutumbam.local",
        role: Role.ADMIN,
        textSize: "EXTRA_LARGE",
        highContrast: false,
      },
    });
  }

  return admin;
}

/**
 * Establishes a 12-month persistent session for a user on a given device.
 */
export async function createDeviceSession({
  userId,
  deviceName,
  userAgent,
  ipAddress,
}: {
  userId: string;
  deviceName: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<{ rawToken: string; deviceId: string; expiresAt: Date }> {
  const rawToken = generateRandomToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TWELVE_MONTHS_MS);

  const device = await prisma.device.create({
    data: {
      userId,
      deviceName,
      tokenHash,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt,
      isRevoked: false,
    },
  });

  return { rawToken, deviceId: device.id, expiresAt };
}

export interface AuthenticatedSession {
  user: User;
  device: {
    id: string;
    deviceName: string;
    lastSeenAt: Date;
    expiresAt: Date;
    isRevoked: boolean;
  };
}

export const SESSION_SECRET =
  process.env.SESSION_SECRET || "kutumbam-private-session-secret-key-salt-987654321";

/**
 * Creates a signed cookie string: rawToken.role.expiresTimestamp.signature
 */
export function createSignedCookieValue(
  rawToken: string,
  role: string,
  expiresAt: Date
): string {
  const payload = `${rawToken}.${role}.${expiresAt.getTime()}`;
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${signature}`;
}

/**
 * Parses and verifies a signed cookie string using HMAC-SHA256.
 */
export function parseSignedCookieValue(
  cookieValue: string | undefined
): { rawToken: string; role: string; expiresAt: Date } | null {
  if (!cookieValue) return null;
  const parts = cookieValue.split(".");
  if (parts.length !== 4) {
    // If raw 64-char token without signature, allow for backward compatibility
    if (cookieValue.length === 64) {
      return { rawToken: cookieValue, role: "FAMILY", expiresAt: new Date(Date.now() + TWELVE_MONTHS_MS) };
    }
    return null;
  }

  const [rawToken, role, expStr, sig] = parts;
  const payload = `${rawToken}.${role}.${expStr}`;
  const expectedSig = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  if (expectedSig !== sig) return null;

  const exp = parseInt(expStr, 10);
  if (isNaN(exp) || Date.now() > exp) return null;

  return { rawToken, role, expiresAt: new Date(exp) };
}

/**
 * Validates the raw session token from cookie against the database.
 */
export async function validateSessionToken(
  cookieValue: string | undefined
): Promise<AuthenticatedSession | null> {
  if (!cookieValue) return null;

  const parsed = parseSignedCookieValue(cookieValue);
  const rawToken = parsed ? parsed.rawToken : cookieValue;
  const tokenHash = hashToken(rawToken);

  const device = await prisma.device.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!device) return null;
  if (device.isRevoked) return null;
  if (device.expiresAt < new Date()) return null;

  // Touch lastSeenAt asynchronously
  prisma.device
    .update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    })
    .catch(() => {});

  return {
    user: device.user,
    device: {
      id: device.id,
      deviceName: device.deviceName,
      lastSeenAt: device.lastSeenAt,
      expiresAt: device.expiresAt,
      isRevoked: device.isRevoked,
    },
  };
}

/**
 * Helper to get current authenticated user and device from incoming request cookies.
 */
export async function getSession(
  request?: NextRequest | Headers | string
): Promise<AuthenticatedSession | null> {
  let token: string | undefined;

  if (typeof request === "string") {
    token = request;
  } else if (request && "cookies" in request && typeof (request as any).cookies?.get === "function") {
    token = (request as any).cookies.get(SESSION_COOKIE_NAME)?.value;
  } else if (request && "headers" in request && (request as any).headers?.get) {
    const cookieHeader = (request as any).headers.get("cookie");
    const match = cookieHeader?.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    token = match ? decodeURIComponent(match[1]) : undefined;
  } else if (request && typeof (request as any).get === "function") {
    const cookieHeader = (request as any).get("cookie");
    const match = cookieHeader?.match(new RegExp(`(?:^|; )${SESSION_COOKIE_NAME}=([^;]*)`));
    token = match ? decodeURIComponent(match[1]) : undefined;
  }

  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // In test context or outside Next.js request store
    }
  }

  return validateSessionToken(token);
}

/**
 * Helper to set session cookie on response.
 */
export function setSessionCookie(
  cookieStore: any,
  rawToken: string,
  expiresAt: Date,
  role = "FAMILY"
) {
  const signedValue = createSignedCookieValue(rawToken, role, expiresAt);
  cookieStore.set(SESSION_COOKIE_NAME, signedValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}
