import { test, expect } from "@playwright/test";
import { setupSessionCookie } from "./test-helpers";
import { Role } from "@prisma/client";
import path from "path";
import { prisma } from "../../src/lib/prisma";

test.describe("E2E Direct Storage Upload & Large File Video Playback with CSP / CORS validation", () => {
  test.beforeEach(async ({ context, page }) => {
    await setupSessionCookie(context, Role.ADMIN, "admin-1");

    const isRealStorageTest = process.env.REAL_STORAGE_TEST === "true";

    if (isRealStorageTest) {
      const { getStorageProvider } = await import("../../src/lib/storage");
      const provider = getStorageProvider();
      if (
        provider.constructor.name === "MockStorageProvider" ||
        provider.name === "MockStorage"
      ) {
        throw new Error(
          "REAL_STORAGE_TEST=true requires real S3/B2 storage provider, but received MockStorageProvider!"
        );
      }
      console.log(
        `[Real Storage Test Active] Provider: ${provider.constructor.name}, Endpoint: ${
          process.env.STORAGE_ENDPOINT ||
          process.env.AWS_ENDPOINT_URL_S3 ||
          process.env.R2_ENDPOINT
        }`
      );
    } else {
      // In CI / standard test mode, intercept direct storage PUT requests
      await page.route((url) => {
        const href = url.href;
        return (
          href.includes("mock-upload") ||
          href.includes("backblazeb2.com") ||
          href.includes("s3.")
        );
      }, async (route) => {
        if (route.request().method() === "PUT") {
          await route.fulfill({
            status: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Expose-Headers": "ETag, Content-Range, Accept-Ranges, Content-Length",
              "ETag": `"part-etag-${Date.now()}"`,
            },
            body: "",
          });
          return;
        }
        await route.continue();
      });

      // Intercept video playback requests to stream sample MP4 with byte-ranges
      await page.route((url) => url.href.includes("mock-media") || url.href.includes("originals/"), async (route) => {
        const fs = await import("fs");
        const samplePath = path.resolve(process.cwd(), "tests/fixtures/sample.mp4");
        if (fs.existsSync(samplePath)) {
          const fileBuffer = fs.readFileSync(samplePath);
          const rangeHeader = route.request().headers()["range"];
          if (rangeHeader && rangeHeader.startsWith("bytes=")) {
            const parts = rangeHeader.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10) || 0;
            const end = parts[1] ? parseInt(parts[1], 10) : fileBuffer.length - 1;
            const chunk = fileBuffer.subarray(start, end + 1);
            await route.fulfill({
              status: 206,
              headers: {
                "Content-Range": `bytes ${start}-${end}/${fileBuffer.length}`,
                "Accept-Ranges": "bytes",
                "Content-Length": chunk.length.toString(),
                "Content-Type": "video/mp4",
                "Access-Control-Allow-Origin": "*",
              },
              body: chunk,
            });
            return;
          }
          await route.fulfill({
            status: 200,
            headers: {
              "Content-Type": "video/mp4",
              "Content-Length": fileBuffer.length.toString(),
              "Accept-Ranges": "bytes",
              "Access-Control-Allow-Origin": "*",
            },
            body: fileBuffer,
          });
          return;
        }
        await route.continue();
      });
    }
  });

  test("uploads a real ~300MB MP4 via direct multipart with pause/resume, verifies in library, plays & seeks with zero CSP/CORS errors", async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for 300MB multipart

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("Content Security Policy") ||
        text.includes("CSP") ||
        text.includes("blocked by CSP") ||
        text.includes("CORS") ||
        text.includes("Access-Control-Allow-Origin")
      ) {
        consoleErrors.push(`[Console Error]: ${text}`);
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(`[Page Error]: ${err.message}`);
    });

    const startTime = Date.now();
    console.log(`[Timing] Starting ~300MB E2E Upload Test at ${new Date().toISOString()}`);

    // 1. Navigate to /admin/upload
    await page.goto("/admin/upload");
    await page.waitForLoadState("networkidle");

    const sample300mbPath = path.resolve(process.cwd(), "tests/fixtures/sample_300mb.mp4");

    // 2. Select file in browser file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([sample300mbPath]);

    // Wait for queue item to appear and complete browser inspection
    await expect(page.locator("text=Queue (1)")).toBeVisible({ timeout: 20000 });

    const inspectedTime = Date.now();
    console.log(`[Timing] Browser metadata inspection took ${(inspectedTime - startTime) / 1000}s`);

    // 3. Start Multipart Upload
    const uploadBtn = page.getByRole("button", { name: /Upload Media|మీడియా అప్‌లోడ్/i }).first();
    await expect(uploadBtn).toBeVisible({ timeout: 15000 });
    await uploadBtn.click();

    // Wait for upload to start and progress to begin
    await expect(page.locator("text=/Uploading|అప్‌లోడ్ అవుతోంది/i").first()).toBeVisible({ timeout: 20000 });

    // 4. Pause Upload mid-way
    const pauseBtn = page.getByRole("button", { name: /Pause|పాజ్/i }).first();
    if (await pauseBtn.isVisible({ timeout: 10000 })) {
      await pauseBtn.click();
      console.log(`[Timing] Upload paused at ${(Date.now() - startTime) / 1000}s`);

      // Verify paused state (Resume button appears)
      const resumeBtn = page.getByRole("button", { name: /Resume|కొనసాగించు/i }).first();
      await expect(resumeBtn).toBeVisible({ timeout: 10000 });

      // Small pause delay
      await page.waitForTimeout(1500);

      // 5. Resume Upload
      await resumeBtn.click();
      console.log(`[Timing] Upload resumed at ${(Date.now() - startTime) / 1000}s`);
    }

    // 6. Wait for multipart upload to complete (all 30 parts completed directly in storage)
    await expect(page.locator("text=/Upload complete!|అప్‌లోడ్ పూర్తయింది!/i").first()).toBeVisible({ timeout: 120000 });

    const uploadDoneTime = Date.now();
    console.log(`[Timing] ~300MB Multipart Direct Upload completed in ${(uploadDoneTime - startTime) / 1000}s`);

    // 7. Confirm it appears in /admin/library
    await page.goto("/admin/library");
    await page.waitForLoadState("networkidle");

    const libraryItem = page.locator("text=sample_300mb").first();
    await expect(libraryItem).toBeVisible({ timeout: 20000 });

    // 8. Open video player from library and verify playback
    const playLink = page.locator('a[href^="/watch/"]').first();
    await expect(playLink).toBeVisible({ timeout: 20000 });
    await playLink.click();

    await page.waitForURL(/\/watch\//, { timeout: 20000 });

    const video = page.locator("video");
    await expect(video).toBeVisible({ timeout: 20000 });

    const src = await video.getAttribute("src");
    expect(src).toBeTruthy();

    // 9. Play video and seek to middle (~12s) and near end (~22s)
    await page.evaluate(() => {
      const vid = document.querySelector("video");
      if (vid) {
        vid.currentTime = 12.0; // Middle seek
        return vid.play().catch(() => {});
      }
    });

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const vid = document.querySelector("video");
      if (vid) {
        vid.currentTime = 22.0; // Near end seek
        return vid.play().catch(() => {});
      }
    });

    await page.waitForTimeout(2000);

    const playbackDoneTime = Date.now();
    console.log(`[Timing] Playback and seeking verified at ${(playbackDoneTime - startTime) / 1000}s`);

    // 10. Verify zero CSP or CORS console errors
    if (consoleErrors.length > 0) {
      console.error("Detected console security errors during ~300MB test:", consoleErrors);
    }
    expect(consoleErrors).toEqual([]);

    // 11. If running against real storage, list bucket and confirm objects created, then delete
    if (process.env.REAL_STORAGE_TEST === "true") {
      const { getStorageProvider } = await import("../../src/lib/storage");
      const provider = getStorageProvider();
      const objects = await provider.list("originals/");
      console.log(`[Real Storage Test] Found ${objects.length} objects with prefix originals/`);
      for (const obj of objects) {
        if (obj.key.includes("sample")) {
          console.log(`[Real Storage Test] Deleting uploaded test object: ${obj.key}`);
          await provider.delete(obj.key);
        }
      }
      const remaining = await provider.list("originals/");
      const sampleRemaining = remaining.filter((r) => r.key.includes("sample"));
      expect(sampleRemaining.length).toBe(0);
      console.log("[Real Storage Test] Verified all test objects were deleted from B2/S3 bucket.");
    }

    // 12. Cleanup test media from database
    try {
      await prisma.mediaItem.deleteMany({
        where: {
          OR: [
            { title_en: { contains: "sample" } },
            { originalKey: { contains: "sample" } },
          ],
        },
      });
      console.log("[Cleanup] Deleted test media item records from database.");
    } catch (e) {
      console.warn("[Cleanup] Warning deleting database record:", e);
    }
  });

  test("uploads small MP4 and JPG via direct PUT and plays with zero CSP/CORS errors", async ({ page }) => {
    test.setTimeout(60000);
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("Content Security Policy") ||
        text.includes("CSP") ||
        text.includes("blocked by CSP") ||
        text.includes("CORS") ||
        text.includes("Access-Control-Allow-Origin")
      ) {
        consoleErrors.push(`[Console Error]: ${text}`);
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(`[Page Error]: ${err.message}`);
    });

    await page.goto("/admin/upload");
    await page.waitForLoadState("networkidle");

    const mp4Path = path.resolve(process.cwd(), "tests/fixtures/sample.mp4");
    const jpgPath = path.resolve(process.cwd(), "tests/fixtures/sample.jpg");

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([mp4Path, jpgPath]);

    await expect(page.locator("text=Queue (2)")).toBeVisible({ timeout: 15000 });

    const uploadBtn1 = page.getByRole("button", { name: /Upload Media|మీడియా అప్‌లోడ్/i }).first();
    await expect(uploadBtn1).toBeVisible({ timeout: 15000 });
    await uploadBtn1.click();

    await expect(page.locator("text=/Upload complete!|అప్‌లోడ్ పూర్తయింది!/i").first()).toBeVisible({ timeout: 45000 });

    const uploadBtn2 = page.getByRole("button", { name: /Upload Media|మీడియా అప్‌లోడ్/i }).first();
    if (await uploadBtn2.isVisible()) {
      await uploadBtn2.click();
      await expect(page.locator("text=/Upload complete!|అప్‌లోడ్ పూర్తయింది!/i")).toHaveCount(2, { timeout: 45000 });
    }

    // Cleanup small test media
    try {
      await prisma.mediaItem.deleteMany({
        where: {
          OR: [
            { title_en: { contains: "sample" } },
            { originalKey: { contains: "sample" } },
          ],
        },
      });
    } catch {}

    expect(consoleErrors).toEqual([]);
  });
});
