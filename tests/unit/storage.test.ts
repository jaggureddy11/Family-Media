import { describe, it, expect, beforeEach } from "vitest";
import { MockStorageProvider } from "@/lib/storage/mock-provider";
import { getStorageProvider, resetStorageProvider } from "@/lib/storage";

describe("StorageProvider Abstraction", () => {
  let storage: MockStorageProvider;

  beforeEach(() => {
    storage = new MockStorageProvider();
  });

  it("should get fallback storage provider instance", () => {
    const provider = getStorageProvider();
    expect(provider).toBeDefined();
    expect(typeof provider.getSignedReadUrl).toBe("function");
    expect(typeof provider.getSignedUploadUrl).toBe("function");
    expect(typeof provider.put).toBe("function");
  });

  it("should put and verify existence of file in storage", async () => {
    const key = "originals/MOVIE/2024/test/test.mp4";
    const data = Buffer.from("fake-video-content");
    
    expect(await storage.exists(key)).toBe(false);
    
    await storage.put(key, data, "video/mp4");
    
    expect(await storage.exists(key)).toBe(true);
  });

  it("should generate signed read URLs with expiration", async () => {
    const key = "posters/media_1.jpg";
    const url = await storage.getSignedReadUrl(key, 3600);
    
    expect(url).toContain(encodeURIComponent(key));
    expect(url).toContain("exp=");
  });

  it("should support multipart upload emulation", async () => {
    const key = "originals/MOVIE/1957/media_mayabazaar/Maya_Bazaar.mp4";
    const { uploadId } = await storage.createMultipartUpload(key, "video/mp4");
    
    expect(uploadId).toBeTruthy();
    
    const partUrl = await storage.signPart(key, uploadId, 1);
    expect(partUrl).toContain(`partNumber=1`);
    expect(partUrl).toContain(`uploadId=${uploadId}`);
    
    const result = await storage.completeMultipart(key, uploadId, [
      { partNumber: 1, etag: '"etag-1"' },
    ]);
    
    expect(result.key).toBe(key);
  });

  it("should delete files from storage", async () => {
    const key = "thumbs/temp.webp";
    await storage.put(key, Buffer.from("temp"), "image/webp");
    expect(await storage.exists(key)).toBe(true);
    
    await storage.delete(key);
    expect(await storage.exists(key)).toBe(false);
  });

  it("strictly disables MockStorageProvider in production when R2 credentials are missing", () => {
    const origNodeEnv = process.env.NODE_ENV;
    try {
      resetStorageProvider();
      process.env.NODE_ENV = "production";
      delete process.env.STORAGE_ACCESS_KEY_ID;
      delete process.env.R2_ACCESS_KEY_ID;

      expect(() => getStorageProvider()).toThrow(
        /Cloudflare R2 storage credentials are required in production/
      );
    } finally {
      process.env.NODE_ENV = origNodeEnv;
      resetStorageProvider();
    }
  });
});
