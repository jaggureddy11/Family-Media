import { describe, it, expect, beforeEach } from "vitest";
import {
  hashToken,
  generateRandomToken,
  createSignedCookieValue,
  parseSignedCookieValue,
  verifyAdminPassphrase,
  checkRateLimit,
  createDeviceSession,
  validateSessionToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

describe("Auth & Token Security Utilities", () => {
  beforeEach(async () => {
    await prisma.user.upsert({
      where: { id: "mom-1" },
      update: {},
      create: {
        id: "mom-1",
        name_en: "Amma",
        name_te: "అమ్మ",
        role: "FAMILY",
      },
    });
  });
  it("generates 64-character random hexadecimal tokens", () => {
    const token1 = generateRandomToken(32);
    const token2 = generateRandomToken(32);

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it("hashes tokens deterministically with SHA-256", () => {
    const raw = "test-token-123";
    const hash1 = hashToken(raw);
    const hash2 = hashToken(raw);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
  });

  it("signs and verifies session cookies, rejecting tampered signatures", () => {
    const rawToken = generateRandomToken(32);
    const role = "ADMIN";
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    const signed = createSignedCookieValue(rawToken, role, expiresAt);
    expect(signed).toBeTruthy();

    const verified = parseSignedCookieValue(signed);
    expect(verified).not.toBeNull();
    expect(verified?.rawToken).toBe(rawToken);
    expect(verified?.role).toBe(role);

    // Tampered token test
    const tampered = signed.replace("ADMIN", "FAMILY");
    const tamperedVerified = parseSignedCookieValue(tampered);
    expect(tamperedVerified).toBeNull();

    // Expired token test
    const expiredDate = new Date(Date.now() - 10000);
    const expiredSigned = createSignedCookieValue(rawToken, role, expiredDate);
    expect(parseSignedCookieValue(expiredSigned)).toBeNull();
  });

  it("verifies admin passphrase correctly against plain text and bcrypt hash", async () => {
    process.env.ADMIN_PASSPHRASE = "secretPass123";
    delete process.env.ADMIN_PASSPHRASE_HASH;

    expect(await verifyAdminPassphrase("secretPass123")).toBe(true);
    expect(await verifyAdminPassphrase("wrongPassword")).toBe(false);

    // Bcrypt test
    const salt = await bcrypt.genSalt(10);
    process.env.ADMIN_PASSPHRASE_HASH = await bcrypt.hash("bcryptPass456", salt);

    expect(await verifyAdminPassphrase("bcryptPass456")).toBe(true);
    expect(await verifyAdminPassphrase("wrongPassword")).toBe(false);
  });

  it("enforces sliding-window rate limits backed by attempt records", async () => {
    const testIp = `test-ip-${Date.now()}`;

    // First 3 attempts should be allowed
    expect((await checkRateLimit(testIp, 3, 60000)).allowed).toBe(true);
    expect((await checkRateLimit(testIp, 3, 60000)).allowed).toBe(true);
    expect((await checkRateLimit(testIp, 3, 60000)).allowed).toBe(true);

    // 4th attempt should be blocked
    const fourth = await checkRateLimit(testIp, 3, 60000);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remainingAttempts).toBe(0);
  });

  it("creates a 12-month persistent session and validates it", async () => {
    const { rawToken } = await createDeviceSession({
      userId: "mom-1",
      deviceName: "Amma's iPad",
    });

    const session = await validateSessionToken(rawToken);
    expect(session).not.toBeNull();
    expect(session?.user.name_en).toBe("Amma");
    expect(session?.device.deviceName).toBe("Amma's iPad");
    expect(session?.device.isRevoked).toBe(false);
  });

  it("proves that a revoked device is immediately signed out on its next request", async () => {
    const { rawToken, deviceId } = await createDeviceSession({
      userId: "mom-1",
      deviceName: "Amma's Old Phone",
    });

    // 1. Initially valid
    const validSession = await validateSessionToken(rawToken);
    expect(validSession).not.toBeNull();

    // 2. Admin revokes device in database
    await prisma.device.update({
      where: { id: deviceId },
      data: { isRevoked: true },
    });

    // 3. Next request re-checks against database and is rejected
    const revokedSession = await validateSessionToken(rawToken);
    expect(revokedSession).toBeNull();
  });

  it("enforces production ADMIN_PASSPHRASE_HASH requirement and rejects plaintext", async () => {
    const origNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "production";
      delete process.env.ADMIN_PASSPHRASE_HASH;
      process.env.ADMIN_PASSPHRASE = "plaintextPass";

      // Must throw an error requiring ADMIN_PASSPHRASE_HASH
      await expect(verifyAdminPassphrase("plaintextPass")).rejects.toThrow(
        /ADMIN_PASSPHRASE_HASH is strictly required in production/
      );
    } finally {
      process.env.NODE_ENV = origNodeEnv;
    }
  });
});
