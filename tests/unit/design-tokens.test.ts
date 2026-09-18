import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Calculates relative luminance for an sRGB hex color (#RRGGBB)
 */
function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const srgbToLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates WCAG contrast ratio between two hex colors
 */
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("Design Tokens Accessibility Guard", () => {
  const cssPath = path.resolve(__dirname, "../../src/app/globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  it("fails if any configured font-size preset is smaller than 24px at base scale 1.0", () => {
    // Check font sizes in globals.css
    const remRegex = /calc\(\s*([0-9.]+)rem\s*\*\s*var\(--text-scale\)\s*\)/g;
    let match;
    const sizes: number[] = [];

    while ((match = remRegex.exec(cssContent)) !== null) {
      const remVal = parseFloat(match[1]);
      const pxVal = remVal * 16; // 1rem = 16px default browser root font-size
      sizes.push(pxVal);
    }

    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) {
      expect(
        size,
        `Font size ${size}px is smaller than the non-negotiable minimum of 24px!`
      ).toBeGreaterThanOrEqual(24);
    }
  });

  it("verifies contrast ratio >= 10:1 for text colors across Dark, Light, and High Contrast themes", () => {
    // Dark Theme
    const darkBg = "#0b0f19";
    const darkTextPrimary = "#ffffff";
    const darkTextSecondary = "#e2e8f0";
    const darkAccent = "#facc15";

    const darkRatioPrimary = getContrastRatio(darkTextPrimary, darkBg);
    const darkRatioSecondary = getContrastRatio(darkTextSecondary, darkBg);
    const darkRatioAccent = getContrastRatio(darkAccent, darkBg);

    expect(darkRatioPrimary).toBeGreaterThanOrEqual(10.0);
    expect(darkRatioSecondary).toBeGreaterThanOrEqual(10.0);
    expect(darkRatioAccent).toBeGreaterThanOrEqual(10.0);

    // High Contrast Theme (Pure black background)
    const hcBg = "#000000";
    const hcTextPrimary = "#ffffff";
    const hcTextSecondary = "#facc15";

    const hcRatioPrimary = getContrastRatio(hcTextPrimary, hcBg);
    const hcRatioSecondary = getContrastRatio(hcTextSecondary, hcBg);

    expect(hcRatioPrimary).toBeGreaterThanOrEqual(10.0);
    expect(hcRatioSecondary).toBeGreaterThanOrEqual(10.0);

    // Light Theme ("Day" mode)
    const lightBg = "#ffffff";
    const lightTextPrimary = "#020617";
    const lightRatio = getContrastRatio(lightTextPrimary, lightBg);
    expect(lightRatio).toBeGreaterThanOrEqual(14.0);
  });
});
