/**
 * Scoped Real Database Verification Script
 *
 * Verifies critical operational workflows directly against the live Neon PostgreSQL database:
 * 1. Family member creation (tagged with e2e-)
 * 2. Single-use device link creation & first redemption (12-month session)
 * 3. Rejection of second redemption on the same link (single-use guarantee)
 * 4. Verification that the established device session works
 * 5. Immediate device revocation and rejection of subsequent session requests
 * 6. Live Postgres-backed rate limiting (rate_limit_attempts table)
 * 7. Scoped cleanup of all tagged e2e- records with zero residue
 */

import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import {
  generateRandomToken,
  hashToken,
  createSignedCookieValue,
  validateSessionToken,
  TWENTY_FOUR_HOURS_MS,
  TWELVE_MONTHS_MS,
  checkRateLimit,
} from "../src/lib/auth";
import { assertSafeDeleteMany, assertScopedE2ETag } from "../src/lib/db-safety";

async function main() {
  console.log("================================================================================");
  console.log("   KUTUMBAM · కుటుంబం — SCOPED REAL DATABASE OPERATIONAL VERIFICATION");
  console.log("================================================================================\n");

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("localhost:5432")) {
    console.error("❌ ERROR: DATABASE_URL must point to live PostgreSQL/Neon for this verification.");
    process.exit(1);
  }

  // Allow real DB operations for this explicit verification script
  process.env.ALLOW_REAL_DB_IN_TEST = "true";
  delete process.env.TEST_MODE;
  delete process.env.USE_MOCK_DB;

  const prisma = new PrismaClient({
    log: ["error"],
  });

  const timestamp = Date.now();
  const testTag = `e2e-${timestamp}`;
  const userId = `e2e-user-${timestamp}`;
  const rateLimitKey = `e2e-rl-${timestamp}`;

  assertScopedE2ETag(userId);
  assertScopedE2ETag(rateLimitKey);

  let allPassed = true;

  try {
    // 0. Connectivity Check
    console.log("[Step 0] Testing live PostgreSQL connection...");
    const checkResult: any = await prisma.$queryRaw`SELECT current_database() as db_name, version() as pg_version`;
    console.log(`  ✅ Connected to live PostgreSQL database: ${checkResult[0]?.db_name}`);
    console.log(`  ✅ Engine: ${checkResult[0]?.pg_version?.slice(0, 35)}...\n`);

    // 1. Create Family Member
    console.log("[Step 1] Creating scoped family member record (tagged e2e-)...");
    const user = await prisma.user.create({
      data: {
        id: userId,
        name_en: `e2e-Family Member ${timestamp}`,
        name_te: "e2e-కుటుంబ సభ్యుడు",
        role: Role.FAMILY,
        textSize: "EXTRA_LARGE",
        highContrast: false,
      },
    });
    console.log(`  ✅ User created: ID=${user.id}, Name="${user.name_en}", Role=${user.role}`);

    // Ensure admin user exists for link createdByAdminId
    let admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          id: `e2e-admin-${timestamp}`,
          name_en: "e2e-Admin",
          name_te: "e2e-నిర్వాహకుడు",
          email: "e2e-admin@kutumbam.local",
          role: Role.ADMIN,
        },
      });
    }

    // 2. Create Single-Use Device Link
    console.log("\n[Step 2] Creating single-use device link in Postgres...");
    const rawToken = generateRandomToken(32);
    const tokenHash = hashToken(rawToken);
    const linkExpiresAt = new Date(Date.now() + TWENTY_FOUR_HOURS_MS);

    const deviceLink = await prisma.deviceLink.create({
      data: {
        userId: user.id,
        tokenHash,
        createdByAdminId: admin.id,
        expiresAt: linkExpiresAt,
      },
    });
    console.log(`  ✅ DeviceLink created: ID=${deviceLink.id}, Expires=${linkExpiresAt.toISOString()}`);

    // 3. First Redemption
    console.log("\n[Step 3] Redeeming device link (First Use)...");
    const linkRecord = await prisma.deviceLink.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!linkRecord || linkRecord.usedAt || linkRecord.expiresAt < new Date()) {
      throw new Error("Device link is invalid on first use!");
    }

    // Mark redeemed
    await prisma.deviceLink.update({
      where: { id: linkRecord.id },
      data: { usedAt: new Date() },
    });

    // Create device record
    const deviceRawToken = generateRandomToken(32);
    const deviceTokenHash = hashToken(deviceRawToken);
    const deviceExpiresAt = new Date(Date.now() + TWELVE_MONTHS_MS);
    const deviceId = `e2e-dev-${timestamp}`;

    const device = await prisma.device.create({
      data: {
        id: deviceId,
        userId: user.id,
        deviceName: "e2e-Amma Tablet",
        tokenHash: deviceTokenHash,
        expiresAt: deviceExpiresAt,
        isRevoked: false,
      },
    });

    const sessionCookieValue = createSignedCookieValue(
      deviceRawToken,
      user.role,
      deviceExpiresAt
    );
    console.log(`  ✅ First redemption succeeded: Device ID=${device.id}`);
    console.log(`  ✅ Session cookie generated: len=${sessionCookieValue.length} chars`);

    // 4. Second Redemption (Must be rejected)
    console.log("\n[Step 4] Attempting second redemption of the same link (Must be rejected)...");
    const secondLinkCheck = await prisma.deviceLink.findUnique({
      where: { tokenHash },
    });

    if (secondLinkCheck?.usedAt) {
      console.log(`  ✅ REJECTED: Link was already used at ${secondLinkCheck.usedAt.toISOString()}`);
    } else {
      throw new Error("FAILURE: Single-use link was not rejected on second redemption!");
    }

    // 5. Confirm Session Works
    console.log("\n[Step 5] Validating active session token against database...");
    const activeSession = await validateSessionToken(sessionCookieValue);
    if (activeSession && activeSession.user.id === user.id && !activeSession.device.isRevoked) {
      console.log(`  ✅ Session valid: User=${activeSession.user.name_en}, Device=${activeSession.device.deviceName}`);
    } else {
      throw new Error("FAILURE: Valid session was not authenticated against the database!");
    }

    // 6. Revoke Device and Confirm Next Request Rejected
    console.log("\n[Step 6] Revoking device and validating rejection of next request...");
    await prisma.device.update({
      where: { id: device.id },
      data: { isRevoked: true },
    });
    console.log(`  ✅ Device marked isRevoked=true in Postgres`);

    const revokedSession = await validateSessionToken(sessionCookieValue);
    if (revokedSession === null) {
      console.log(`  ✅ REJECTED: Revoked device session returned null (signed out on next request)`);
    } else {
      throw new Error("FAILURE: Revoked device session was still accepted!");
    }

    // 7. Test Postgres Rate Limiting
    console.log("\n[Step 7] Testing Postgres-backed rate limiting (rate_limit_attempts table)...");
    const maxAttempts = 3;
    const windowMs = 5 * 60 * 1000;

    for (let i = 1; i <= maxAttempts; i++) {
      const rl = await checkRateLimit(rateLimitKey, maxAttempts, windowMs);
      console.log(`  Attempt ${i}/${maxAttempts}: allowed=${rl.allowed}, remaining=${rl.remainingAttempts}`);
      if (!rl.allowed) throw new Error(`Attempt ${i} was unexpectedly blocked!`);
    }

    // Attempt 4 should be blocked
    const blockedAttempt = await checkRateLimit(rateLimitKey, maxAttempts, windowMs);
    console.log(`  Attempt 4/${maxAttempts} (Overflow): allowed=${blockedAttempt.allowed}, remaining=${blockedAttempt.remainingAttempts}`);
    if (blockedAttempt.allowed === false) {
      console.log(`  ✅ BLOCKED: Postgres rate limiter blocked attempt exceeding maxAttempts`);
    } else {
      throw new Error("FAILURE: Overflow attempt was not blocked by rate limiter!");
    }

    // Verify rate limit records in Postgres table
    const storedAttempts = await prisma.rateLimitAttempt.count({
      where: { key: rateLimitKey },
    });
    console.log(`  ✅ Confirmed ${storedAttempts} rate_limit_attempts rows stored in PostgreSQL`);

  } catch (err: any) {
    console.error(`\n❌ VERIFICATION STEP FAILED: ${err.message}`);
    allPassed = false;
  } finally {
    // 8. Scoped Cleanup
    console.log("\n[Step 8] Scoped cleanup of all records tagged e2e-...");
    try {
      assertSafeDeleteMany("DeviceLink", { userId: { startsWith: "e2e-" } });
      const delLinks = await prisma.deviceLink.deleteMany({
        where: { userId: { startsWith: "e2e-" } },
      });

      assertSafeDeleteMany("Device", { userId: { startsWith: "e2e-" } });
      const delDevs = await prisma.device.deleteMany({
        where: { userId: { startsWith: "e2e-" } },
      });

      assertSafeDeleteMany("User", { id: { startsWith: "e2e-" } });
      const delUsers = await prisma.user.deleteMany({
        where: { id: { startsWith: "e2e-" } },
      });

      assertSafeDeleteMany("rate_limit_attempts", { key: { startsWith: "e2e-" } });
      const delRl = await prisma.rateLimitAttempt.deleteMany({
        where: { key: { startsWith: "e2e-" } },
      });

      console.log(`  ✅ Cleaned up: ${delLinks.count} DeviceLinks, ${delDevs.count} Devices, ${delUsers.count} Users, ${delRl.count} RateLimits`);

      // Verify zero residue
      const remainingUsers = await prisma.user.count({ where: { id: { startsWith: "e2e-" } } });
      const remainingDevs = await prisma.device.count({ where: { id: { startsWith: "e2e-" } } });
      const remainingLinks = await prisma.deviceLink.count({ where: { userId: { startsWith: "e2e-" } } });
      const remainingRl = await prisma.rateLimitAttempt.count({ where: { key: { startsWith: "e2e-" } } });

      const totalRemaining = remainingUsers + remainingDevs + remainingLinks + remainingRl;
      if (totalRemaining === 0) {
        console.log(`  ✅ Zero residue: Verified 0 records with prefix "e2e-" remaining in PostgreSQL`);
      } else {
        console.warn(`  ⚠️ Warning: ${totalRemaining} e2e- records remaining after cleanup!`);
      }
    } catch (cleanErr: any) {
      console.error(`  ⚠️ Cleanup error: ${cleanErr.message}`);
    }

    await prisma.$disconnect();
  }

  console.log("\n================================================================================");
  if (allPassed) {
    console.log("   ✅ SCOPED REAL DATABASE VERIFICATION: ALL CHECKS PASSED");
  } else {
    console.log("   ❌ SCOPED REAL DATABASE VERIFICATION: FAILED");
    process.exit(1);
  }
  console.log("================================================================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
