import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("No Hardcoded UI Text Rule", () => {
  function getTsxFiles(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    for (const file of list) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getTsxFiles(fullPath));
      } else if (file.endsWith(".tsx")) {
        results.push(fullPath);
      }
    }
    return results;
  }

  it("ensures no UI component files have raw hardcoded user-visible text in JSX without <Bi> or strings catalog", () => {
    const componentFiles = getTsxFiles(path.resolve(__dirname, "../../src/components"));
    const appFiles = getTsxFiles(path.resolve(__dirname, "../../src/app"));
    const allFiles = [...componentFiles, ...appFiles];

    // Banned common English standalone words that developers accidentally hardcode in raw JSX tags
    const bannedEnglishPhrases = [
      />\s*Movies\s*</i,
      />\s*Photos\s*</i,
      />\s*Videos\s*</i,
      />\s*Family Videos\s*</i,
      />\s*Other Files\s*</i,
      />\s*Continue Watching\s*</i,
      />\s*Play\s*</i,
      />\s*Pause\s*</i,
      />\s*Resume\s*</i,
      />\s*Favorites\s*</i,
      />\s*Albums\s*</i,
      />\s*Home\s*</i,
      />\s*Back\s*</i,
      />\s*Search\s*</i,
      />\s*Something went wrong\s*</i,
      />\s*Try again\s*</i,
      />\s*Ask for help\s*</i,
    ];

    const violations: { file: string; match: string }[] = [];

    for (const filePath of allFiles) {
      // Allow Bi.tsx itself as it handles raw text rendering
      if (filePath.endsWith("Bi.tsx")) continue;

      const content = fs.readFileSync(filePath, "utf-8");

      for (const pattern of bannedEnglishPhrases) {
        if (pattern.test(content)) {
          violations.push({
            file: path.relative(path.resolve(__dirname, "../.."), filePath),
            match: pattern.source,
          });
        }
      }
    }

    expect(
      violations,
      `Found hardcoded UI English text without <Bi>:\n${JSON.stringify(violations, null, 2)}`
    ).toEqual([]);
  });
});
