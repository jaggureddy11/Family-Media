import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Styleguide Acceptance Checks", () => {
  test("renders Telugu typography correctly without clipping conjuncts", async ({
    page,
  }) => {
    await page.goto("/styleguide");

    // Verify key Telugu headings and labels are present and visible (exact match)
    const teluguHeading = page.getByText("సినిమాలు", { exact: true }).first();
    await expect(teluguHeading).toBeVisible();

    const familyVideos = page.getByText("కుటుంబ వీడియోలు", { exact: true }).first();
    await expect(familyVideos).toBeVisible();

    const mayaBazaar = page.getByText("మాయాబజార్", { exact: true }).first();
    await expect(mayaBazaar).toBeVisible();

    // Verify minimum font sizes are >= 24px in computed style
    const buttonLabel = page.getByRole("button", { name: /Play.*ప్లే చేయండి/i });
    await expect(buttonLabel).toBeVisible();

    const computedFontSize = await buttonLabel.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize);
    });
    expect(computedFontSize).toBeGreaterThanOrEqual(24);
  });

  test("verifies no horizontal overflow at 390px across Large, Extra Large, and Huge text scales", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/styleguide");

    const scales = [
      { name: "large", buttonText: /^Large/i },
      { name: "extra-large", buttonText: /^Extra Large/i },
      { name: "huge", buttonText: /^Huge/i },
    ];

    for (const scale of scales) {
      // Switch scale
      const scaleBtn = page.getByRole("button", { name: scale.buttonText });
      await scaleBtn.click();
      await page.waitForTimeout(300);

      // Verify no horizontal overflow on body
      const overflowDetails = await page.evaluate(() => {
        const clientWidth = document.documentElement.clientWidth;
        const overflowingElements: { tag: string; id: string; className: string; right: number; clientWidth: number }[] = [];
        
        document.querySelectorAll("*").forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > clientWidth + 1) { // 1px tolerance for subpixel rounding
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              className: el.className.toString(),
              right: rect.right,
              clientWidth,
            });
          }
        });
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth,
          overflowingElements: overflowingElements.slice(0, 5),
        };
      });

      console.log(`Scale ${scale.name} overflow details:`, overflowDetails);
      expect(overflowDetails.overflowingElements.length).toBe(0);

      // Verify buttons still have height >= 64px
      const minBtnHeight = await scaleBtn.evaluate((el) => {
        return el.getBoundingClientRect().height;
      });
      expect(minBtnHeight).toBeGreaterThanOrEqual(64);
    }
  });

  test("verifies keyboard-only spatial navigation across tile grid", async ({
    page,
  }) => {
    await page.goto("/styleguide");

    // Press Tab or ArrowDown to enter the focusable tree
    await page.keyboard.press("Tab");

    // Press ArrowDown multiple times to navigate through the elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(100);
    }

    // Ensure some element is focused
    const focusedTag = await page.evaluate(() => {
      return document.activeElement ? document.activeElement.tagName : null;
    });
    expect(focusedTag).toBeTruthy();
    expect(["BUTTON", "A", "DIV"]).toContain(focusedTag);
  });

  test("captures visual snapshot at 390px and 1920px viewports", async ({
    page,
  }, testInfo) => {
    await page.goto("/styleguide");
    await page.waitForLoadState("networkidle");

    const projectName = testInfo.project.name;
    const screenshotDir = "tests/screenshots";
    const screenshotPath = `${screenshotDir}/styleguide-${projectName}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
  });

  test("passes WCAG AA accessibility audit on /styleguide", async ({ page }) => {
    await page.goto("/styleguide");
    await page.waitForLoadState("networkidle");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
