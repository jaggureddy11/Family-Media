import { test, expect } from "@playwright/test";

test.describe("Authentication & Device Links Flow", () => {
  test("full flow: unauthenticated redirect -> admin passphrase login -> create device link -> new browser context redeems link with zero typing -> lands on Home", async ({
    page,
    browser,
  }) => {
    // 1. Verify unauthenticated visit redirects to /login
    await page.goto("/");
    await expect(page).toHaveURL(/.*\/login/);

    // 2. Admin logs in with passphrase on /login
    const passphraseInput = page.locator("#passphrase-input");
    await expect(passphraseInput).toBeVisible();

    await passphraseInput.fill("family123");
    const loginButton = page.getByRole("button", { name: /Log in.*లాగిన్ అవ్వండి/i });
    await loginButton.click();

    // Verify redirected to admin family management
    await expect(page).toHaveURL(/.*\/admin\/family/, { timeout: 10000 });
    await expect(page.getByText("Amma", { exact: true })).toBeVisible();

    // 3. Admin creates a single-use device link for "Amma"
    const createLinkBtn = page
      .getByRole("button", { name: /Create device link.*లింక్ సృష్టించండి/i })
      .first();
    await createLinkBtn.click();

    // Wait for the modal/card with the generated link
    const linkCard = page.getByText(/Device link created!.*పరికరం లింక్ సృష్టించబడింది!/i);
    await expect(linkCard).toBeVisible({ timeout: 5000 });

    // Verify QR code is rendered
    const qrImg = page.locator('img[alt="Device link QR code"]');
    await expect(qrImg).toBeVisible();

    // Extract the generated link URL from the display box
    const linkUrlBox = page.locator("div.font-mono");
    await expect(linkUrlBox).toBeVisible();
    const linkUrl = (await linkUrlBox.textContent())?.trim();
    expect(linkUrl).toBeTruthy();
    expect(linkUrl).toContain("/link/");

    // 4. Open a completely new, clean browser context representing Mom's device with video recording
    const momContext = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 12 viewport
      recordVideo: { dir: "test-results/videos/" },
    });
    const momPage = await momContext.newPage();

    // Mom taps the WhatsApp link (visits the linkUrl)
    await momPage.goto(linkUrl!);

    // Mom lands on Home immediately with ZERO typing!
    await expect(momPage).toHaveURL(/\/$/, { timeout: 10000 });

    // Verify Home screen greetings and giant destination tiles are visible for Mom
    await expect(momPage.getByText("నమస్తే, అమ్మా")).toBeVisible();
    await expect(momPage.getByText("సినిమాలు")).toBeVisible();
    await expect(momPage.getByText("ఫోటోలు")).toBeVisible();

    // 5. Verify redeeming the link a second time shows the friendly error
    const momSecondPage = await momContext.newPage();
    await momSecondPage.goto(linkUrl!);
    await expect(
      momSecondPage.getByText(/This link has already been used.*ఈ లింక్ ఇప్పటికే ఉపయోగించబడింది/i)
    ).toBeVisible();
    await expect(
      momSecondPage.getByRole("button", { name: /Ask for help.*సహాయం కోసం అడగండి/i })
    ).toBeVisible();

    // Close contexts cleanly to finalize video recording
    await momContext.close();
  });
});
