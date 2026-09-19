import { chromium } from "playwright";
import * as path from "path";

async function capture() {
  const browser = await chromium.launch({ channel: "chrome" });
  const artifactDir = "/Users/apple/.gemini/antigravity-ide/brain/abc9c76c-b004-4153-80b0-2a2a2ba419c8";

  // 1. Setup Mom's session via device link
  const adminPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await adminPage.goto("http://localhost:3000/login");
  await adminPage.fill("#passphrase-input", "family123");
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL("**/admin/family");

  const createBtn = adminPage.getByRole("button", { name: /Create device link.*లింక్ సృష్టించండి/i }).first();
  await createBtn.click();
  await adminPage.waitForSelector("div.font-mono");
  const linkUrl = (await adminPage.locator("div.font-mono").textContent())?.trim();
  await adminPage.close();

  // 2. Mobile (390x844) Extra Large Text (Default)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(linkUrl!);
  await mobilePage.waitForURL("http://localhost:3000/");
  await mobilePage.waitForSelector("text=నమస్తే, అమ్మా");
  await mobilePage.screenshot({ path: path.join(artifactDir, "m4-home-mobile-xl.png") });

  // Mobile Movies
  await mobilePage.goto("http://localhost:3000/movies");
  await mobilePage.waitForSelector("text=Maya Bazaar");
  await mobilePage.screenshot({ path: path.join(artifactDir, "m4-movies-mobile-xl.png") });

  // Mobile Search Modal
  const searchBtn = mobilePage.getByRole("button", { name: /Search.*వెతకండి/i });
  await searchBtn.click();
  await mobilePage.waitForSelector('input[type="search"]');
  await mobilePage.screenshot({ path: path.join(artifactDir, "m4-search-mobile-xl.png") });
  await mobilePage.getByRole("button", { name: /Close.*మూసివేయండి/i }).click();

  // Mobile Resume Modal
  await mobilePage.evaluate(async () => {
    await fetch("/api/media/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaItemId: "media_1",
        positionSeconds: 2450,
        durationSeconds: 11100,
      }),
    });
  });
  await mobilePage.goto("http://localhost:3000/movies");
  await mobilePage.waitForSelector("text=Maya Bazaar");
  const resumeCard = mobilePage.locator('div[data-nav-item="true"]').filter({ hasText: "Maya Bazaar" }).first();
  await resumeCard.click();
  await mobilePage.waitForSelector("text=Resume from");
  await mobilePage.screenshot({ path: path.join(artifactDir, "m4-resume-modal-mobile-xl.png") });

  // Mobile Player
  await mobilePage.goto("http://localhost:3000/watch/media_1?resume=true");
  await mobilePage.waitForSelector("video");
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(artifactDir, "m4-player-mobile-xl.png") });

  // 3. Mobile (390x844) HUGE Text (1 per row)
  const hugePage = await mobileContext.newPage();
  await hugePage.goto("http://localhost:3000/movies");
  await hugePage.evaluate(() => {
    document.documentElement.setAttribute("data-text-scale", "huge");
    document.documentElement.style.setProperty("--text-scale", "1.5");
  });
  await hugePage.waitForTimeout(400);
  await hugePage.screenshot({ path: path.join(artifactDir, "m4-movies-mobile-huge.png") });

  // 4. TV Viewport (1920x1080) Extra Large Text
  const tvContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const tvPage = await tvContext.newPage();
  // We can pass session cookies from mobileContext to tvContext
  const cookies = await mobileContext.cookies();
  await tvContext.addCookies(cookies);

  // TV Home
  await tvPage.goto("http://localhost:3000/");
  await tvPage.waitForSelector("text=నమస్తే, అమ్మా");
  await tvPage.screenshot({ path: path.join(artifactDir, "m4-home-tv-1920px.png") });

  // TV Movies
  await tvPage.goto("http://localhost:3000/movies");
  await tvPage.waitForSelector("text=Maya Bazaar");
  await tvPage.screenshot({ path: path.join(artifactDir, "m4-movies-tv-1920px.png") });

  // TV Player
  await tvPage.goto("http://localhost:3000/watch/media_1");
  await tvPage.waitForSelector("video");
  await tvPage.waitForTimeout(500);
  await tvPage.screenshot({ path: path.join(artifactDir, "m4-player-tv-1920px.png") });

  await browser.close();
  console.log("Milestone 4 screenshots captured successfully!");
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
