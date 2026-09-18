import { chromium } from "playwright";
import * as path from "path";

async function capture() {
  const browser = await chromium.launch({ channel: "chrome" });
  const artifactDir = "/Users/apple/.gemini/antigravity-ide/brain/abc9c76c-b004-4153-80b0-2a2a2ba419c8";

  // 1. Mobile Login Screen
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await mobilePage.goto("http://localhost:3000/login");
  await mobilePage.waitForSelector("#passphrase-input");
  await mobilePage.screenshot({ path: path.join(artifactDir, "auth-login-mobile.png") });

  // 2. Admin Login -> Family management
  await mobilePage.fill("#passphrase-input", "family123");
  await mobilePage.click('button[type="submit"]');
  await mobilePage.waitForURL("**/admin/family");
  await mobilePage.waitForSelector("text=Amma");
  await mobilePage.screenshot({ path: path.join(artifactDir, "admin-family-mobile.png") });

  // Open modal for link & QR
  const createBtn = mobilePage.getByRole("button", { name: /Create device link.*లింక్ సృష్టించండి/i }).first();
  await createBtn.click();
  await mobilePage.waitForSelector('img[alt="Device link QR code"]');
  await mobilePage.screenshot({ path: path.join(artifactDir, "admin-device-link-modal-mobile.png") });

  // 3. Admin Devices Screen
  await mobilePage.goto("http://localhost:3000/admin/devices");
  await mobilePage.waitForSelector("h1");
  await mobilePage.screenshot({ path: path.join(artifactDir, "admin-devices-mobile.png") });

  // 4. Used Link Error Screen
  await mobilePage.goto("http://localhost:3000/link/error?type=already_used");
  await mobilePage.waitForSelector("text=ఈ లింక్ ఇప్పటికే ఉపయోగించబడింది");
  await mobilePage.screenshot({ path: path.join(artifactDir, "link-already-used-mobile.png") });

  // 5. TV Viewport (1920x1080) for Admin Family
  const tvPage = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await tvPage.goto("http://localhost:3000/login");
  await tvPage.fill("#passphrase-input", "family123");
  await tvPage.click('button[type="submit"]');
  await tvPage.waitForURL("**/admin/family");
  await tvPage.screenshot({ path: path.join(artifactDir, "admin-family-tv.png") });

  await browser.close();
  console.log("Screenshots captured successfully!");
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
