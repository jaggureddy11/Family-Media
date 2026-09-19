import { describe, it, expect, beforeEach } from "vitest";
import {
  ALLOWED_TEST_PREFIX,
  assertSafeTestKey,
  assertSafeTestPrefix,
  safeDeleteTestPrefix,
  safeDeleteTestObject,
  MockStorageProvider,
} from "@/lib/storage";

describe("Storage Safety Rule 16: Scoped Test Prefix Enforcement", () => {
  let mockProvider: MockStorageProvider;

  beforeEach(() => {
    mockProvider = new MockStorageProvider();
  });

  describe("1. Key Validation (assertSafeTestKey)", () => {
    it("permits keys starting strictly with e2e-tmp/", () => {
      expect(() => assertSafeTestKey("e2e-tmp/run-1/sample.mp4")).not.toThrow();
      expect(() => assertSafeTestKey("e2e-tmp/session-abc/photo.jpg")).not.toThrow();
    });

    it("strictly rejects keys outside e2e-tmp/ (production paths, root, or pattern matches)", () => {
      expect(() => assertSafeTestKey("originals/movie.mp4")).toThrow(/SAFETY VIOLATION/);
      expect(() => assertSafeTestKey("posters/poster.jpg")).toThrow(/SAFETY VIOLATION/);
      expect(() => assertSafeTestKey("thumbs/thumb.webp")).toThrow(/SAFETY VIOLATION/);
      expect(() => assertSafeTestKey("sample.mp4")).toThrow(/SAFETY VIOLATION/);
      expect(() => assertSafeTestKey("test-file.mp4")).toThrow(/SAFETY VIOLATION/);
      expect(() => assertSafeTestKey("")).toThrow(/SAFETY VIOLATION/);
    });
  });

  describe("2. Prefix Validation (assertSafeTestPrefix)", () => {
    it("permits scoped sub-prefixes under e2e-tmp/", () => {
      expect(() => assertSafeTestPrefix("e2e-tmp/run-456/")).not.toThrow();
    });

    it("strictly rejects unscoped, root, or empty prefixes", () => {
      expect(() => assertSafeTestPrefix("")).toThrow(/SAFETY VIOLATION/);
      expect(() => assertSafeTestPrefix("e2e-tmp/")).toThrow(/SAFETY VIOLATION/);
      expect(() => assertSafeTestPrefix("originals/")).toThrow(/SAFETY VIOLATION/);
      expect(() => assertSafeTestPrefix("test")).toThrow(/SAFETY VIOLATION/);
      expect(() => assertSafeTestPrefix("sample")).toThrow(/SAFETY VIOLATION/);
    });
  });

  describe("3. Safe Prefix Deletion (safeDeleteTestPrefix)", () => {
    it("only deletes objects within the scoped test prefix and verifies clean state", async () => {
      const runPrefix = "e2e-tmp/test-run-123/";
      await mockProvider.put(`${runPrefix}video.mp4`, Buffer.from("video"), "video/mp4");
      await mockProvider.put(`${runPrefix}poster.jpg`, Buffer.from("poster"), "image/jpeg");
      await mockProvider.put("originals/real-family-movie.mp4", Buffer.from("real"), "video/mp4");

      const result = await safeDeleteTestPrefix(mockProvider, runPrefix);
      expect(result.deletedCount).toBe(2);

      // Verify real object was NOT touched
      const realObjExists = await mockProvider.exists("originals/real-family-movie.mp4");
      expect(realObjExists).toBe(true);

      // Verify test prefix is clean
      const remaining = await mockProvider.list(runPrefix);
      expect(remaining.length).toBe(0);
    });

    it("refuses to run if prefix is outside e2e-tmp/", async () => {
      await expect(
        safeDeleteTestPrefix(mockProvider, "originals/")
      ).rejects.toThrow(/SAFETY VIOLATION/);

      await expect(
        safeDeleteTestPrefix(mockProvider, "test")
      ).rejects.toThrow(/SAFETY VIOLATION/);
    });
  });

  describe("4. Safe Single Object Deletion (safeDeleteTestObject)", () => {
    it("deletes object under e2e-tmp/ and rejects outside", async () => {
      await mockProvider.put("e2e-tmp/run-1/item.txt", Buffer.from("test"), "text/plain");
      await safeDeleteTestObject(mockProvider, "e2e-tmp/run-1/item.txt");
      expect(await mockProvider.exists("e2e-tmp/run-1/item.txt")).toBe(false);

      await expect(
        safeDeleteTestObject(mockProvider, "originals/important.mp4")
      ).rejects.toThrow(/SAFETY VIOLATION/);
    });
  });
});
