import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/**
 * Kutumbam Secret Scanner
 * Scans git staged files and workspace files (excluding .env and node_modules)
 * for exposed secrets, API keys, database credentials, or real application keys.
 */

const SECRET_PATTERNS: { name: string; regex: RegExp }[] = [
  { name: "Backblaze B2 Application Key", regex: /K00[0-9a-zA-Z]{28,}/ },
  { name: "Backblaze B2 Master Key ID", regex: /005[0-9a-fA-F]{21}/ },
  { name: "Neon Live API Key", regex: /nak_live_[0-9a-fA-F]{32}/ },
  { name: "Neon Live Secret Key", regex: /nsk_live_[0-9a-fA-F]{64}/ },
  { name: "AWS Access Key ID", regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/ },
  { name: "Generic Secret Key Assignment", regex: /(?:SECRET_ACCESS_KEY|AWS_SECRET_ACCESS_KEY|APPLICATION_KEY)\s*[:=]\s*["'][a-zA-Z0-9\/+]{20,}["']/i },
  { name: "PostgreSQL Database URL with Password", regex: /postgresql:\/\/[^:]+:[^@]+@ep-[a-z0-9-]+\.[a-z0-9-]+\.aws\.neon\.tech/i },
  { name: "Private RSA / EC Key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

const IGNORED_PATHS = [
  ".env",
  ".env.local",
  ".env.production",
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "scripts/secret-scan.ts",
];

function isIgnored(filePath: string): boolean {
  return IGNORED_PATHS.some((ignored) => filePath === ignored || filePath.startsWith(`${ignored}/`));
}

function scanFile(filePath: string): { line: number; pattern: string; snippet: string }[] {
  if (isIgnored(filePath)) return [];
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) return [];
  try {
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) return [];
  } catch {
    return [];
  }

  const findings: { line: number; pattern: string; snippet: string }[] = [];
  const content = fs.readFileSync(resolved, "utf-8");
  const lines = content.split("\n");

  lines.forEach((lineText, idx) => {
    // Ignore markdown code comment explanations or placeholder lines
    if (lineText.includes("<YOUR_") || lineText.includes("example") || lineText.includes("placeholder")) {
      return;
    }

    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(lineText)) {
        findings.push({
          line: idx + 1,
          pattern: pattern.name,
          snippet: lineText.trim().slice(0, 80),
        });
      }
    }
  });

  return findings;
}

export function runScan() {
  console.log("🔒 Running Kutumbam Pre-Commit Secret Scanner...");

  let filesToScan: string[] = [];
  try {
    const gitStaged = execSync("git diff --cached --name-only", { encoding: "utf-8" }).trim();
    if (gitStaged) {
      filesToScan = gitStaged.split("\n").filter((f) => f.length > 0);
    }
  } catch {
    // fallback if not in git
  }

  // If no staged files, scan all tracked files in git
  if (filesToScan.length === 0) {
    try {
      const gitTracked = execSync("git ls-files", { encoding: "utf-8" }).trim();
      filesToScan = gitTracked.split("\n").filter((f) => f.length > 0);
    } catch {
      filesToScan = [];
    }
  }

  let totalFindings = 0;

  for (const file of filesToScan) {
    if (isIgnored(file)) continue;
    const findings = scanFile(file);
    if (findings.length > 0) {
      console.error(`\n❌ Secret detected in ${file}:`);
      for (const finding of findings) {
        console.error(`   [Line ${finding.line}] ${finding.pattern}: "${finding.snippet}"`);
        totalFindings++;
      }
    }
  }

  if (totalFindings > 0) {
    console.error(`\n🚨 SCAN FAILED: Found ${totalFindings} exposed secret(s) in tracked/staged files.`);
    console.error("Please remove the hardcoded secrets and read them from .env instead.\n");
    process.exit(1);
  } else {
    console.log(`✅ SCAN PASSED: Checked ${filesToScan.length} files. Zero secrets found.\n`);
  }
}

runScan();
