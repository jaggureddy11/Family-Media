import { describe, it, expect } from "vitest";
import { STRINGS, BilingualText } from "@/lib/strings";

describe("STRINGS catalog", () => {
  const requiredGlossaryKeys = [
    "movies",
    "photos",
    "familyVideos",
    "otherFiles",
    "continueWatching",
    "play",
    "resume",
    "startOver",
    "favorites",
    "albums",
    "timeline",
    "home",
    "back",
    "search",
    "somethingWentWrong",
    "tryAgain",
    "askForHelp",
  ] as const;

  it("contains all exact required glossary entries", () => {
    for (const key of requiredGlossaryKeys) {
      expect(STRINGS).toHaveProperty(key);
      const entry = STRINGS[key as keyof typeof STRINGS] as BilingualText;
      expect(entry.en).toBeTruthy();
      expect(entry.te).toBeTruthy();
      expect(typeof entry.en).toBe("string");
      expect(typeof entry.te).toBe("string");
      expect(entry.en.trim().length).toBeGreaterThan(0);
      expect(entry.te.trim().length).toBeGreaterThan(0);
    }
  });

  it("ensures all Telugu strings contain valid non-empty Telugu Unicode characters", () => {
    // Telugu Unicode block is \u0C00-\u0C7F
    const teluguRegex = /[\u0C00-\u0C7F]/;

    for (const [key, val] of Object.entries(STRINGS)) {
      expect(
        teluguRegex.test(val.te),
        `String key "${key}" has invalid or missing Telugu characters: "${val.te}"`
      ).toBe(true);
    }
  });
});
