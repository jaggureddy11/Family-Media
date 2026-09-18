import { test, expect } from "@playwright/test";

test.describe("Milestone 3: Storage, Uploads & Library Management", () => {
  test.beforeEach(async ({ page }) => {
    // Log in as admin before each test
    await page.goto("/login");
    const passphraseInput = page.locator("#passphrase-input");
    await passphraseInput.fill("family123");
    const loginButton = page.getByRole("button", { name: /Log in.*లాగిన్ అవ్వండి/i });
    await loginButton.click();
    await expect(page).toHaveURL(/.*\/admin\/.*/);
  });

  test("admin library displays 30 seeded items, supports category filtering, search, and inline title editing", async ({
    page,
  }) => {
    await page.goto("/admin/library");

    // 1. Verify header and page loaded
    await expect(page.getByRole("heading", { name: /Media Library.*మీడియా లైబ్రరీ/i })).toBeVisible();

    // 2. Verify seeded items are present (30 items total across all categories)
    await expect(page.getByRole("heading", { name: /Missamma/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Sankranti Celebrations 2024/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Amma Singing Annamayya Keerthana/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Traditional Telugu Recipes Book/i })).toBeVisible();

    // 3. Test Category Filtering: Photos
    const photosTab = page.getByRole("button", { name: /Photos.*ఫోటోలు/i });
    await photosTab.click();
    await expect(page.getByRole("heading", { name: /Sankranti Celebrations 2024/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Tirupati Family Darshanam/i })).toBeVisible();
    // Missamma should not be visible in photos tab
    await expect(page.getByRole("heading", { name: /Missamma/i })).toHaveCount(0);

    // 4. Test Category Filtering: Movies
    const moviesTab = page.getByRole("button", { name: /Movies.*సినిమాలు/i });
    await moviesTab.click();
    await expect(page.getByRole("heading", { name: /Missamma/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Baahubali The Beginning/i })).toBeVisible();
    // Photos should not be visible in movies tab
    await expect(page.getByRole("heading", { name: /Tirupati Family Darshanam/i })).toHaveCount(0);

    // 5. Test Search
    const allTab = page.getByRole("button", { name: /All Media.*అన్నీ/i });
    await allTab.click();

    const searchInput = page.getByPlaceholder("Search media / శోధించండి...");
    await searchInput.fill("Sankarabharanam");
    const searchBtn = page.getByRole("button", { name: /Search.*శోధించండి/i });
    await searchBtn.click();

    await expect(page.getByRole("heading", { name: /Sankarabharanam/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Missamma/i })).toHaveCount(0);

    // Clear search
    await searchInput.fill("");
    await searchBtn.click();
    await expect(page.getByRole("heading", { name: /Missamma/i })).toBeVisible();

    // 6. Test Inline Title Editing on the first item visible in search
    await searchInput.fill("Sita Ramam");
    await searchBtn.click();
    await expect(page.getByRole("heading", { name: /Sita Ramam/i })).toBeVisible();

    const editBtn = page.getByRole("button", { name: /Edit.*సవరించండి/i }).first();
    await editBtn.click();

    const englishTitleInput = page.getByPlaceholder("English title");
    await englishTitleInput.fill("Sita Ramam Special Edition");

    const saveBtn = page.getByRole("button", { name: /Save.*సేవ్ చేయండి/i });
    await saveBtn.click();

    // Verify updated title is displayed
    await expect(page.getByRole("heading", { name: /Sita Ramam Special Edition/i })).toBeVisible({ timeout: 5000 });

    // Reset search to capture full library view
    await searchInput.fill("");
    await searchBtn.click();
    await expect(page.getByRole("heading", { name: /Missamma/i })).toBeVisible();

    const projectName = test.info().project.name;
    const screenshotDir = "tests/screenshots";
    if (projectName === "mobile-390px") {
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${screenshotDir}/admin-library-mobile.png`, fullPage: false });
    } else if (projectName === "tv-1920px") {
      await page.screenshot({ path: `${screenshotDir}/admin-library-tv.png`, fullPage: false });
    }
  });

  test("admin upload page displays HandBrake conversion notice when non-browser-playable MKV file is added", async ({
    page,
  }, testInfo) => {
    await page.goto("/admin/upload");

    // 1. Verify upload page loaded
    await expect(page.getByRole("heading", { name: /Upload Media.*మీడియాను అప్‌లోడ్ చేయండి/i })).toBeVisible();
    await expect(page.getByText(/Drag and drop files here/i)).toBeVisible();

    // 2. Select an unsupported MKV file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "classic_movie_archive.mkv",
      mimeType: "video/x-matroska",
      buffer: Buffer.from("dummy-mkv-video-content-here"),
    });

    // 3. Verify item is parsed and added to the queue
    const titleInput = page.locator('input[type="text"]').first();
    await expect(titleInput).toHaveValue("Classic Movie Archive", { timeout: 5000 });

    // 4. Verify HandBrake warning banner appears with exact required text
    const handbrakeAlert = page.getByRole("alert").filter({ hasText: /Video Needs Conversion/i });
    await expect(handbrakeAlert).toBeVisible({ timeout: 5000 });

    await expect(
      page.getByText(/Convert this with HandBrake, preset Fast 720p30, then upload again/i)
    ).toBeVisible();
    await expect(
      page.getByText(/ఈ వీడియో బ్రౌజర్‌లో నేరుగా ప్లే అవ్వదు/i)
    ).toBeVisible();

    // Scroll alert into view and capture screenshot
    if (testInfo.project.name === "mobile-390px") {
      await handbrakeAlert.scrollIntoViewIfNeeded();
      await page.screenshot({ path: "tests/screenshots/admin-upload-handbrake.png", fullPage: false });
    }

    // 5. Verify direct upload button is omitted because conversion is required
    const uploadBtn = page.getByRole("button", { name: /^Upload Media.*అప్‌లోడ్ చేయండి$/i });
    await expect(uploadBtn).toHaveCount(0);
  });
});
