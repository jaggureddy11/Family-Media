import { test } from "@playwright/test";
import path from "path";
import { setupSessionCookie } from "./test-helpers";
import { Role } from "@prisma/client";

const ARTIFACT_DIR = "/Users/apple/.gemini/antigravity-ide/brain/abc9c76c-b004-4153-80b0-2a2a2ba419c8";

test.describe("Capture Milestone 5 visual artifacts", () => {
  test("capture mobile and tv views", async ({ page }, testInfo) => {
    await setupSessionCookie(page.context(), Role.FAMILY, "mom-1");
    const isMobile = testInfo.project.name === "mobile-390px";
    const suffix = isMobile ? "mobile-390px" : "tv-1920px";

    // 1. Photos Timeline
    await page.goto("/photos");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `m5-photos-timeline-${suffix}.png`),
    });

    // 2. Fullscreen Viewer with Slideshow
    const firstPhoto = page.locator("section button").first();
    if (await firstPhoto.isVisible()) {
      await firstPhoto.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `m5-viewer-slideshow-${suffix}.png`),
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }

    // 3. Family Videos
    await page.goto("/family-videos");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `m5-family-videos-${suffix}.png`),
    });

    // 4. Other Files Browser
    await page.goto("/files");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `m5-files-browser-${suffix}.png`),
    });

    // 5. In-browser PDF Viewer modal (if document exists)
    const openPdfBtn = page.getByRole("button", { name: /Open/i }).first();
    if (await openPdfBtn.isVisible()) {
      await openPdfBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, `m5-pdf-viewer-${suffix}.png`),
      });
      const dialog = page.getByRole("dialog");
      const closeBtn = dialog.getByRole("button", { name: /Close|Back/i }).first();
      await closeBtn.click();
    }
  });
});
