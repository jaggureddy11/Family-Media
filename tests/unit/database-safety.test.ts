import { describe, it, expect } from "vitest";
import {
  assertTestDatabaseSafety,
  assertSafeDeleteMany,
  assertScopedE2ETag,
  assertNoTableDropOrTruncate,
  E2E_TAG_PREFIX,
} from "@/lib/db-safety";

describe("Database Safety Rules & Guardrails", () => {
  const remoteNeonUrl = () =>
    "postgresql://test_admin:test_secret@remote-production.neon.tech/neondb?sslmode=require";

  describe("1. Test Isolation Guardrail (assertTestDatabaseSafety)", () => {
    it("fails if a real remote DATABASE_URL is used while TEST_MODE is true", () => {
      const dangerousEnv: NodeJS.ProcessEnv = {
        TEST_MODE: "true",
        DATABASE_URL: remoteNeonUrl(),
        USE_MOCK_DB: "false",
      };

      expect(() => assertTestDatabaseSafety(dangerousEnv)).toThrow(
        /DATABASE SAFETY VIOLATION: Real remote DATABASE_URL cannot be used while TEST_MODE is true/
      );
    });

    it("allows test runs when USE_MOCK_DB is true or using local/mock database URL", () => {
      const safeMockEnv: NodeJS.ProcessEnv = {
        TEST_MODE: "true",
        DATABASE_URL: remoteNeonUrl(),
        USE_MOCK_DB: "true",
      };
      expect(() => assertTestDatabaseSafety(safeMockEnv)).not.toThrow();

      const safeLocalEnv: NodeJS.ProcessEnv = {
        TEST_MODE: "true",
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/test_db",
      };
      expect(() => assertTestDatabaseSafety(safeLocalEnv)).not.toThrow();
    });

    it("allows real remote DATABASE_URL when TEST_MODE is not active (e.g. production/dev server)", () => {
      const prodEnv: NodeJS.ProcessEnv = {
        TEST_MODE: "false",
        DATABASE_URL: remoteNeonUrl(),
      };
      expect(() => assertTestDatabaseSafety(prodEnv)).not.toThrow();
    });
  });

  describe("2. Unconditional deleteMany Prevention (assertSafeDeleteMany)", () => {
    it("strictly forbids deleteMany without a where clause or with empty where {}", () => {
      expect(() => assertSafeDeleteMany("User", undefined)).toThrow(/DATABASE SAFETY VIOLATION/);
      expect(() => assertSafeDeleteMany("MediaItem", null)).toThrow(/DATABASE SAFETY VIOLATION/);
      expect(() => assertSafeDeleteMany("Device", {})).toThrow(/DATABASE SAFETY VIOLATION/);
    });

    it("allows deleteMany when a valid where clause is provided", () => {
      expect(() =>
        assertSafeDeleteMany("User", { id: { startsWith: "e2e-" } })
      ).not.toThrow();
      expect(() =>
        assertSafeDeleteMany("MediaItem", { id: "item-123" })
      ).not.toThrow();
    });
  });

  describe("3. Scoped E2E Row Tagging (assertScopedE2ETag)", () => {
    it("permits values starting with e2e- prefix", () => {
      expect(() => assertScopedE2ETag("e2e-user-123")).not.toThrow();
      expect(() => assertScopedE2ETag("e2e-device-test")).not.toThrow();
      expect(E2E_TAG_PREFIX).toBe("e2e-");
    });

    it("rejects untagged values to prevent operating on real production records", () => {
      expect(() => assertScopedE2ETag("user-123")).toThrow(/must start with "e2e-"/);
      expect(() => assertScopedE2ETag("admin")).toThrow(/must start with "e2e-"/);
      expect(() => assertScopedE2ETag("test")).toThrow(/must start with "e2e-"/);
      expect(() => assertScopedE2ETag("")).toThrow(/must start with "e2e-"/);
    });
  });

  describe("4. DDL Drop & Truncate Guardrail (assertNoTableDropOrTruncate)", () => {
    it("rejects destructive SQL statements", () => {
      expect(() => assertNoTableDropOrTruncate("DROP TABLE User CASCADE;")).toThrow(
        /Destructive DDL command/
      );
      expect(() => assertNoTableDropOrTruncate("truncate table media_items;")).toThrow(
        /Destructive DDL command/
      );
      expect(() => assertNoTableDropOrTruncate("DROP DATABASE neondb;")).toThrow(
        /Destructive DDL command/
      );
    });

    it("allows safe queries", () => {
      expect(() => assertNoTableDropOrTruncate("SELECT 1;")).not.toThrow();
      expect(() =>
        assertNoTableDropOrTruncate("SELECT * FROM \"User\" WHERE id = 'e2e-1';")
      ).not.toThrow();
    });
  });
});
