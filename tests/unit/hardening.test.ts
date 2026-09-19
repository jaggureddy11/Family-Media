import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  verifyAdminPassphrase,
  checkRateLimit,
  createDeviceSession,
  validateSessionToken,
  createSignedCookieValue,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { getStorageProvider, resetStorageProvider } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { POST as testSessionPost, GET as testSessionGet } from "@/app/api/auth/test-session/route";
import { GET as mockMediaGet } from "@/app/api/mock-media/route";
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";

describe("Hardening Pass & Security Guardrails", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    resetStorageProvider();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetStorageProvider();
  });

  describe("1. Production Fail-Fast (Database & Storage)", () => {
    it("fails fast in production when R2 credentials are missing", () => {
      process.env.NODE_ENV = "production";
      delete process.env.STORAGE_ACCESS_KEY_ID;
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.STORAGE_SECRET_ACCESS_KEY;
      delete process.env.R2_SECRET_ACCESS_KEY;
      delete process.env.STORAGE_ENDPOINT;
      delete process.env.R2_ENDPOINT;

      expect(() => getStorageProvider()).toThrow(/Cloudflare R2 storage credentials are required in production/);
    });

    it("allows MockStorageProvider in development/test when R2 credentials are missing", () => {
      process.env.NODE_ENV = "test";
      delete process.env.STORAGE_ACCESS_KEY_ID;
      delete process.env.R2_ACCESS_KEY_ID;

      const provider = getStorageProvider();
      expect(provider).toBeDefined();
    });
  });

  describe("2. Rate Limiting via Postgres Sliding Window", () => {
    it("records attempts in database and blocks when limit is exceeded", async () => {
      const key = `test_rate_limit_${Date.now()}`;
      const maxAttempts = 3;
      const windowMs = 5000;

      const res1 = await checkRateLimit(key, maxAttempts, windowMs);
      expect(res1.allowed).toBe(true);
      expect(res1.remainingAttempts).toBe(2);

      const res2 = await checkRateLimit(key, maxAttempts, windowMs);
      expect(res2.allowed).toBe(true);
      expect(res2.remainingAttempts).toBe(1);

      const res3 = await checkRateLimit(key, maxAttempts, windowMs);
      expect(res3.allowed).toBe(true);
      expect(res3.remainingAttempts).toBe(0);

      const res4 = await checkRateLimit(key, maxAttempts, windowMs);
      expect(res4.allowed).toBe(false);
      expect(res4.remainingAttempts).toBe(0);
    });
  });

  describe("3. Production Admin Passphrase Verification", () => {
    it("strictly requires ADMIN_PASSPHRASE_HASH in production and rejects plain ADMIN_PASSPHRASE", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.ADMIN_PASSPHRASE_HASH;
      process.env.ADMIN_PASSPHRASE = "plainpassword123";

      // Must throw/fail fast because hash is missing in production
      await expect(verifyAdminPassphrase("plainpassword123")).rejects.toThrow(
        /ADMIN_PASSPHRASE_HASH is strictly required in production/
      );
    });

    it("verifies bcrypt ADMIN_PASSPHRASE_HASH in production correctly", async () => {
      process.env.NODE_ENV = "production";
      const hash = await bcrypt.hash("secretpass456", 10);
      process.env.ADMIN_PASSPHRASE_HASH = hash;

      const isMatch = await verifyAdminPassphrase("secretpass456");
      expect(isMatch).toBe(true);

      const isWrong = await verifyAdminPassphrase("wrongpass");
      expect(isWrong).toBe(false);
    });
  });

  describe("4. Database-Backed Session Revocation", () => {
    it("rejects request if device is revoked in database even with valid HMAC signature", async () => {
      const user = await prisma.user.create({
        data: {
          name_en: "Revocation Test User",
          name_te: "పరీక్ష యూజర్",
          role: "FAMILY",
        },
      });

      const { rawToken, deviceId, expiresAt } = await createDeviceSession({
        userId: user.id,
        deviceName: "Revokable Device",
      });

      const signedCookie = createSignedCookieValue(rawToken, "FAMILY", expiresAt);

      // Valid initially
      const session1 = await validateSessionToken(signedCookie);
      expect(session1).not.toBeNull();
      expect(session1?.user.id).toBe(user.id);

      // Revoke in database
      await prisma.device.update({
        where: { id: deviceId },
        data: { isRevoked: true },
      });

      // Must be rejected on next request
      const session2 = await validateSessionToken(signedCookie);
      expect(session2).toBeNull();
    });
  });

  describe("5. Test & Mock Routes Security (404 in Production)", () => {
    it("POST /api/auth/test-session returns 404 when NODE_ENV is production", async () => {
      process.env.NODE_ENV = "production";
      process.env.TEST_MODE = "true";

      const req = new NextRequest("http://localhost:3000/api/auth/test-session", {
        method: "POST",
        body: JSON.stringify({ userId: "mom-1" }),
      });

      const res = await testSessionPost(req);
      expect(res.status).toBe(404);
    });

    it("POST /api/auth/test-session returns 404 when TEST_MODE is not set", async () => {
      process.env.NODE_ENV = "development";
      delete process.env.TEST_MODE;

      const req = new NextRequest("http://localhost:3000/api/auth/test-session", {
        method: "POST",
        body: JSON.stringify({ userId: "mom-1" }),
      });

      const res = await testSessionPost(req);
      expect(res.status).toBe(404);
    });

    it("GET /api/auth/test-session returns 404 when NODE_ENV is production", async () => {
      process.env.NODE_ENV = "production";
      process.env.TEST_MODE = "true";

      const req = new NextRequest("http://localhost:3000/api/auth/test-session?redirect=/");
      const res = await testSessionGet(req);
      expect(res.status).toBe(404);
    });

    it("GET /api/mock-media returns 404 in production when TEST_MODE is not set", async () => {
      process.env.NODE_ENV = "production";
      delete process.env.TEST_MODE;

      const req = new NextRequest("http://localhost:3000/api/mock-media?key=posters/sample.jpg");
      const res = await mockMediaGet(req);
      expect(res.status).toBe(404);
    });
  });
});
