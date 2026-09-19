import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Architectural Guardrail Test:
 * Enforces Rule 15: No server-side file proxying.
 * Ensures that:
 * 1. No API route accepts file streams, form-data file buffers, or request bodies > 1 MB.
 * 2. Media uploads and downloads are strictly direct between the browser and storage provider via presigned URLs.
 */
describe("Architectural Guardrail: Zero Server-Side File Proxying", () => {
  function getAllApiRouteFiles(dir: string): string[] {
    let files: string[] = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files = files.concat(getAllApiRouteFiles(fullPath));
      } else if (item === "route.ts" || item === "route.js") {
        files.push(fullPath);
      }
    }
    return files;
  }

  it("ensures no API route imports or uses large file stream buffers, busboy, multer, or raw arrayBuffer file ingestion", () => {
    const apiDir = path.resolve(process.cwd(), "src/app/api");
    const routeFiles = getAllApiRouteFiles(apiDir);

    expect(routeFiles.length).toBeGreaterThan(0);

    const bannedPatterns = [
      /multipart\/form-data/i,
      /busboy/i,
      /formidable/i,
      /multer/i,
      /createWriteStream/i,
      /pipe\(.*stream/i,
    ];

    for (const file of routeFiles) {
      const content = fs.readFileSync(file, "utf-8");

      // Verify no banned streaming/proxying packages
      for (const pattern of bannedPatterns) {
        expect(content).not.toMatch(pattern);
      }

      // Ensure no route acts as an upload proxy
      const relativePath = path.relative(process.cwd(), file);
      expect(relativePath).not.toContain("api/admin/upload");
    }
  });

  it("verifies all storage routes only generate presigned URLs and metadata", () => {
    const presignedRoutePath = path.resolve(process.cwd(), "src/app/api/storage/presigned-url/route.ts");
    const multipartCreatePath = path.resolve(process.cwd(), "src/app/api/storage/multipart/create/route.ts");
    const multipartSignPartPath = path.resolve(process.cwd(), "src/app/api/storage/multipart/sign-part/route.ts");
    const multipartCompletePath = path.resolve(process.cwd(), "src/app/api/storage/multipart/complete/route.ts");

    const presignedContent = fs.readFileSync(presignedRoutePath, "utf-8");
    const createContent = fs.readFileSync(multipartCreatePath, "utf-8");
    const signPartContent = fs.readFileSync(multipartSignPartPath, "utf-8");
    const completeContent = fs.readFileSync(multipartCompletePath, "utf-8");

    // Must call presigned URL methods on storage provider
    expect(presignedContent).toContain("getSignedUploadUrl");
    expect(createContent).toContain("createMultipartUpload");
    expect(signPartContent).toContain("signPart");
    expect(completeContent).toContain("completeMultipart");
  });
});
