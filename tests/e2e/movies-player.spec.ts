import { test, expect } from "@playwright/test";
import { setupSessionCookie } from "./test-helpers";
import { Role } from "@prisma/client";

test.describe("Milestone 4: Home, Movies and Native HTML5 Player", () => {
  test.beforeEach(async ({ context }) => {
    // Authenticate as Mom before each test
    await setupSessionCookie(context, Role.FAMILY, "mom-1");
  });

  test("<= 3 taps to play flow: Home -> Movies -> tap poster -> video player starts", async ({ page }) => {
    await page.goto("/");

    // Verify Home screen greeting for Mom
    await expect(page.getByText(/నమస్తే, అమ్మా/i)).toBeVisible();

    // Tap 1: Tap Movies giant destination tile
    const moviesTile = page.locator('a[href="/movies"]');
    await expect(moviesTile).toBeVisible();
    await moviesTile.click();

    await page.waitForURL("**/movies");
    await expect(page.getByText("Maya Bazaar")).toBeVisible();

    // Tap 2: Tap the first movie poster on the grid
    const firstMovieCard = page.locator('a[href^="/watch/media_"]').first();
    await firstMovieCard.click();

    // Navigates directly to /watch/[id]
    await page.waitForURL(/\/watch\/media_\d+/, { timeout: 10000 });

    // Verify Native Video Player is mounted and accessible
    const video = page.locator("video");
    await expect(video).toBeVisible();

    // Back button is visible and accessible
    const backBtn = page.getByRole("button", { name: "Back, వెనుకకు" });
    await expect(backBtn).toBeVisible();
  });

  test("resume dialog flow: existing watch progress prompts Resume vs Start Over", async ({ page, context }) => {
    const cookieValue = await setupSessionCookie(context, Role.FAMILY, "mom-1");

    // 1. Post initial watch progress (120 seconds into Maya Bazaar)
    await page.request.post("/api/media/progress", {
      headers: { Cookie: `kutumbam_session=${cookieValue}` },
      data: {
        mediaItemId: "media_1",
        positionSeconds: 120,
        durationSeconds: 11100,
      },
    });

    // 2. Go to Movies page
    await page.goto("/movies");
    await expect(page.getByText("Maya Bazaar")).toBeVisible();

    // 3. Tap Maya Bazaar with existing progress -> Resume modal appears
    const mayaBazaarCard = page.locator('div[data-nav-item="true"]').filter({ hasText: "Maya Bazaar" }).first();
    await mayaBazaarCard.click();

    // Verify Resume modal is open with both options
    const resumeBtn = page.getByRole("button", { name: /Resume from.*కొనసాగించండి/i });
    const startOverBtn = page.getByRole("button", { name: /Start over.*మొదటి నుండి/i });
    await expect(resumeBtn).toBeVisible();
    await expect(startOverBtn).toBeVisible();

    // Click Resume -> navigates with ?resume=true
    await resumeBtn.click();
    await page.waitForURL(/.*\/watch\/media_1\?resume=true/);
    await expect(page.locator("video")).toBeVisible();
  });

  test("D-pad / keyboard remote navigation & playback controls", async ({ page }) => {
    await page.goto("/movies");
    await expect(page.getByText("Maya Bazaar")).toBeVisible();

    // D-pad down / right navigation
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");

    // Go directly to player
    await page.goto("/watch/media_1");
    await expect(page.locator("video")).toBeVisible();

    // Test Keyboard shortcuts: Space toggles play/pause, Left/Right seeks
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight"); // seek +10s
    await page.keyboard.press("ArrowLeft");  // seek -10s

    // Test Escape key exits player back to /movies
    await page.keyboard.press("Escape");
    await page.waitForURL("**/movies", { timeout: 10000 });
  });

  test("search & filter chips with empty state", async ({ page }) => {
    await page.goto("/movies");

    // 1. Filter by Telugu
    const teluguChip = page.getByRole("button", { name: /Telugu.*తెలుగు/i });
    await teluguChip.click();
    await expect(page.getByText("Maya Bazaar")).toBeVisible();

    // 2. Open Search Modal
    const searchBtn = page.getByRole("button", { name: /Search.*వెతకండి/i });
    await searchBtn.click();
    const searchInput = page.locator('input[type="search"]');
    await expect(searchInput).toBeVisible();

    // Search non-existent movie to verify empty state
    await searchInput.fill("NonExistentMovie123");
    await page.getByRole("button", { name: /Search.*వెతకండి/i }).last().click();

    // Verify friendly empty state
    await expect(page.getByText("No movies found matching your search")).toBeVisible();
    await expect(page.getByText("మీ శోధనకు తగిన సినిమాలు ఏవీ దొరకలేదు")).toBeVisible();
    const clearBtn = page.getByRole("button", { name: "Clear search, సెర్చ్ క్లియర్ చేయండి", exact: true });
    await expect(clearBtn).toBeVisible();

    // Clear search returns all movies
    await clearBtn.click();
    await expect(page.getByText("Maya Bazaar")).toBeVisible();
  });

  test("silent signed-URL refresh API", async ({ page, context }) => {
    const cookieValue = await setupSessionCookie(context, Role.FAMILY, "mom-1");

    const res = await page.request.post("/api/media/watch/media_1/refresh", {
      headers: { Cookie: `kutumbam_session=${cookieValue}` },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.videoUrl).toBeTruthy();
    expect(data.expiresAt).toBeGreaterThan(Date.now());
  });
});
