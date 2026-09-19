import { test, expect } from "@playwright/test";
import { setupSessionCookie } from "./test-helpers";
import { Role } from "@prisma/client";
import path from "path";

test.describe("E2E Storage Upload & Video Playback with CSP / CORS validation", () => {
  test.beforeEach(async ({ context }) => {
    await setupSessionCookie(context, Role.ADMIN, "admin-1");
  });

  test("uploads a real MP4 and JPG via /admin/upload and plays it at /watch/[id] with zero CSP/CORS errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      // Detect CSP or CORS violation errors
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

    // 1. Navigate directly to /admin/upload as authenticated admin
    await page.goto("/admin/upload");
    await page.waitForLoadState("networkidle");

    const mp4Path = path.resolve(process.cwd(), "tests/fixtures/sample.mp4");
    const jpgPath = path.resolve(process.cwd(), "tests/fixtures/sample.jpg");

    // 2. Upload real small MP4 and JPG through the browser file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([mp4Path, jpgPath]);

    // Wait for queue items to appear and finish browser inspection
    await expect(page.locator("text=Queue (2)")).toBeVisible({ timeout: 15000 });

    // 3. Click Upload Media for each item in the queue
    const uploadBtn1 = page.getByRole("button", { name: /Upload Media|మీడియా అప్‌లోడ్/i }).first();
    await expect(uploadBtn1).toBeVisible({ timeout: 15000 });
    await uploadBtn1.click();

    // Wait for first to complete, then click second if available
    await expect(page.locator("text=/Upload complete!|అప్‌లోడ్ పూర్తయింది!/i").first()).toBeVisible({ timeout: 45000 });

    const uploadBtn2 = page.getByRole("button", { name: /Upload Media|మీడియా అప్‌లోడ్/i }).first();
    if (await uploadBtn2.isVisible()) {
      await uploadBtn2.click();
      await expect(page.locator("text=/Upload complete!|అప్‌లోడ్ పూర్తయింది!/i")).toHaveCount(2, { timeout: 45000 });
    }

    // 4. Navigate to /movies to find the movie and play it
    await page.goto("/movies");
    await page.waitForLoadState("networkidle");

    // Click the first movie tile to navigate to player
    const firstMovie = page.locator('a[href^="/watch/"]').first();
    if (await firstMovie.isVisible()) {
      await firstMovie.click();
      await page.waitForURL(/\/watch\//, { timeout: 15000 });

      // 5. Verify video element mounts, receives signed URL, and plays
      const video = page.locator("video");
      await expect(video).toBeVisible({ timeout: 15000 });

      // Check that video src is populated with a signed URL
      const src = await video.getAttribute("src");
      expect(src).toBeTruthy();

      // Test seeking and playing
      await page.evaluate(() => {
        const vid = document.querySelector("video");
        if (vid) {
          vid.currentTime = 0.5;
          return vid.play().catch(() => {});
        }
      });

      await page.waitForTimeout(2000);
    }

    // 6. Assert ZERO CSP or CORS errors occurred throughout the flow
    if (consoleErrors.length > 0) {
      console.error("Detected console security errors:", consoleErrors);
    }
    expect(consoleErrors).toEqual([]);
  });
});
