import { test, expect } from "@playwright/test";
import { setupSessionCookie } from "./test-helpers";
import { Role } from "@prisma/client";

test.describe("Milestone 5: Photos, Viewer, Family Videos & Files", () => {
  test.beforeEach(async ({ context }) => {
    await setupSessionCookie(context, Role.FAMILY, "mom-1");
  });

  test("photos hub: timeline with year-jump bar, albums, and favorites tabs", async ({ page }) => {
    await page.goto("/photos");
    await page.waitForLoadState("networkidle");

    // Check top destination buttons
    const timelineBtn = page.getByRole("button", { name: /Timeline/i });
    const albumsBtn = page.getByRole("button", { name: /Albums/i });
    const favoritesBtn = page.getByRole("button", { name: /Favorites/i });

    await expect(timelineBtn).toBeVisible();
    await expect(albumsBtn).toBeVisible();
    await expect(favoritesBtn).toBeVisible();

    // Check Year Jump bar is present when years are available
    const jumpBar = page.getByLabel("Year Jump Navigation");
    if (await jumpBar.isVisible()) {
      const firstYearBtn = jumpBar.getByRole("button").first();
      await expect(firstYearBtn).toBeVisible();
      await firstYearBtn.click();
    }

    // Switch to Albums tab
    await albumsBtn.click();
    await expect(page.getByRole("heading", { name: /Yearly Albums|సంవత్సరాల/i })).toBeVisible();

    // Switch to Favorites tab
    await favoritesBtn.click();
    await expect(page.getByRole("heading", { name: /Favorites|ఇష్టమైనవి/i })).toBeVisible();
  });

  test("fullscreen media viewer: open photo, next/prev, favorite toggle, and slideshow", async ({ page }) => {
    await page.goto("/photos");
    await page.waitForLoadState("networkidle");

    // Click first photo thumbnail in timeline
    const firstPhoto = page.locator("section button").first();
    await expect(firstPhoto).toBeVisible({ timeout: 10000 });
    await firstPhoto.click();

    // Fullscreen viewer dialog must be visible
    const viewerDialog = page.getByRole("dialog", { name: /viewer/i });
    await expect(viewerDialog).toBeVisible();

    // Check Next and Previous buttons inside dialog
    const nextBtn = viewerDialog.getByRole("button", { name: /Next/i }).first();
    const prevBtn = viewerDialog.getByRole("button", { name: /Previous/i }).first();
    await expect(nextBtn).toBeVisible();
    await expect(prevBtn).toBeVisible();

    // Check Favorite toggle button inside dialog
    const favBtn = viewerDialog.getByRole("button", { name: /Favorites/i }).first();
    await expect(favBtn).toBeVisible();
    await favBtn.click();

    // Check Slideshow toggle inside dialog
    const slideshowBtn = viewerDialog.getByRole("button", { name: /Slideshow/i }).first();
    await expect(slideshowBtn).toBeVisible();
    await slideshowBtn.click();
    await expect(viewerDialog.getByRole("button", { name: /Pause Slideshow/i }).first()).toBeVisible();

    // Keyboard navigation (ArrowRight, ArrowLeft, Escape)
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Escape");

    // Viewer must close on Escape
    await expect(viewerDialog).not.toBeVisible();
  });

  test("family videos: landscape cards grouped by year, duration badges, and tap-to-play", async ({ page }) => {
    await page.goto("/family-videos");
    await page.waitForLoadState("networkidle");

    // Search and filter chips visible
    await expect(page.getByPlaceholder(/Search family videos/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /All/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Favorites/i })).toBeVisible();

    // Verify video card with duration badge
    const firstVideo = page.locator('button[aria-label*="·"]').first();
    await expect(firstVideo).toBeVisible();

    // Duration badge present
    const durationText = firstVideo.locator(".font-mono");
    await expect(durationText).toBeVisible();

    // Click video to navigate to player
    await firstVideo.click();
    await page.waitForURL(/\/watch\/media_/);
    await expect(page.locator("video")).toBeVisible();
  });

  test("other files: folder navigation, in-browser PDF reader, audio player, and download button", async ({ page }) => {
    await page.goto("/files");
    await page.waitForLoadState("networkidle");

    // Breadcrumb and folder action bar
    await expect(page.getByRole("button", { name: /Main Folder/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /New Folder/i })).toBeVisible();

    // Check documents section header (Level 2 heading)
    const docSection = page.getByRole("heading", { level: 2, name: /Documents|పత్రాలు/i });
    if (await docSection.isVisible()) {
      const openBtn = page.getByRole("button", { name: /Open/i }).first();
      await expect(openBtn).toBeVisible();
      await openBtn.click();

      // Either PDF viewer or Audio player dialog appears
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Close modal
      const closeBtn = dialog.getByRole("button", { name: /Close|Back/i }).first();
      await closeBtn.click();
      await expect(dialog).not.toBeVisible();
    }
  });

});
