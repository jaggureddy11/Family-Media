import fs from "fs";
import path from "path";

interface ApiRouteInfo {
  routePath: string;
  methods: string[];
  accessLevel: "Public" | "Session Required" | "Admin Only" | "Non-Prod Only (404 in Prod)";
  description: string;
  sourceFile: string;
}

const API_ROOT = path.join(process.cwd(), "src", "app", "api");

function getRouteInfo(filePath: string): ApiRouteInfo | null {
  const rel = path.relative(API_ROOT, filePath);
  // Example: admin/files/route.ts -> /api/admin/files
  const dir = path.dirname(rel);
  const routePath = dir === "." ? "/api" : `/api/${dir.replace(/\\/g, "/")}`;

  const content = fs.readFileSync(filePath, "utf-8");

  // Detect HTTP methods exported
  const methods: string[] = [];
  const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = methodRegex.exec(content)) !== null) {
    methods.push(m[1]);
  }

  if (methods.length === 0) return null;

  // Determine Access Level from code analysis
  let accessLevel: ApiRouteInfo["accessLevel"] = "Session Required";
  let description = "";

  if (routePath === "/api/auth/login") {
    accessLevel = "Public";
    description = "Admin passphrase authentication (rate limited, sliding window)";
  } else if (routePath === "/api/auth/test-session") {
    accessLevel = "Non-Prod Only (404 in Prod)";
    description = "Test-only session generator for Playwright automation; returns 404 in production";
  } else if (routePath === "/api/mock-media") {
    accessLevel = "Non-Prod Only (404 in Prod)";
    description = "Local mock media streaming server for dev/test; returns 404 in production";
  } else if (routePath === "/api/health") {
    accessLevel = "Public";
    description = "Public service liveness & readiness check";
  } else if (routePath.startsWith("/api/admin")) {
    accessLevel = "Admin Only";
    if (routePath === "/api/admin/files") {
      description = "Admin file/folder mutations (create folder max 3 levels, rename, move, delete)";
    } else if (routePath === "/api/admin/albums") {
      description = "Admin album creation, renaming, cover assignment, bulk items add/remove";
    } else if (routePath === "/api/admin/library") {
      description = "Full library listing and metadata management for admin";
    } else if (routePath === "/api/admin/upload") {
      description = "Direct signed upload URL generator for browser-side upload";
    } else if (routePath === "/api/admin/family") {
      description = "Family member CRUD and accessibility profile preferences";
    } else if (routePath === "/api/admin/devices") {
      description = "Active device listing and immediate revocation";
    } else if (routePath === "/api/admin/media") {
      description = "Admin media editing, metadata update, and deletion";
    } else {
      description = "Admin administrative control route";
    }
  } else if (routePath.startsWith("/api/auth")) {
    if (routePath === "/api/auth/logout") {
      accessLevel = "Session Required";
      description = "Signs out current device session";
    } else if (routePath === "/api/auth/device-links" || routePath === "/api/auth/family" || routePath === "/api/auth/devices") {
      accessLevel = "Admin Only";
      description = "Admin device link & family management";
    }
  } else if (routePath.startsWith("/api/media")) {
    accessLevel = "Session Required";
    if (routePath === "/api/media/movies") {
      description = "Telugu & English movie catalog with search and watch progress";
    } else if (routePath === "/api/media/photos") {
      description = "Photos timeline (grouped by year/month), albums, and favorites";
    } else if (routePath === "/api/media/family-videos") {
      description = "Family videos catalog grouped by year with duration badges";
    } else if (routePath === "/api/media/files") {
      description = "Read-only file browser & signed download URLs";
    } else if (routePath.startsWith("/api/media/watch")) {
      description = "Video streaming session, watch progress saving, and signed URL refresh";
    } else if (routePath === "/api/media/favorites") {
      description = "Toggle per-user favorite status for photos and videos";
    } else if (routePath === "/api/media/error-log") {
      description = "Client-side video playback error logger";
    }
  } else if (routePath.startsWith("/api/storage")) {
    accessLevel = "Admin Only";
    description = "Admin storage and direct upload helpers (presigned URLs, multipart, duplicate check)";
  }

  return {
    routePath,
    methods,
    accessLevel,
    description,
    sourceFile: path.relative(process.cwd(), filePath),
  };
}

function walkDir(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(fullPath));
    } else if (file === "route.ts" || file === "route.js") {
      results.push(fullPath);
    }
  });
  return results;
}

export function generateSecurityRoutes(): ApiRouteInfo[] {
  const files = walkDir(API_ROOT);
  const routes = files
    .map(getRouteInfo)
    .filter((r): r is ApiRouteInfo => r !== null)
    .sort((a, b) => a.routePath.localeCompare(b.routePath));

  const mdLines = [
    "# Kutumbam · కుటుంబం — Security & API Route Access Control Matrix",
    "",
    "**Generated automatically from active source code in `src/app/api`**.",
    "",
    "## 1. Access Control Matrix",
    "",
    "| Route Path | HTTP Methods | Required Role / Access Level | Source File | Purpose & Description |",
    "|---|---|---|---|---|",
  ];

  routes.forEach((r) => {
    mdLines.push(
      `| \`${r.routePath}\` | \`${r.methods.join(", ")}\` | **${r.accessLevel}** | [\`${r.sourceFile}\`](file:///${path.join(process.cwd(), r.sourceFile)}) | ${r.description} |`
    );
  });

  mdLines.push("");
  mdLines.push("## 2. Route Separation & Design Reconciliations");
  mdLines.push("");
  mdLines.push("1. **/api/media/files vs /api/admin/files**:");
  mdLines.push("   - `/api/media/files` is strictly **read-only** (`GET`) for all family member sessions.");
  mdLines.push("   - All mutations (creating folders, renaming, moving, deleting) are strictly restricted to `/api/admin/files` (`POST`, `PUT`, `DELETE`, requiring `ADMIN` role).");
  mdLines.push("");
  mdLines.push("2. **/api/storage/* and /api/admin/upload**:");
  mdLines.push("   - All direct presigned URL generators (`/api/storage/presigned-url`, `/api/storage/multipart`, `/api/storage/check-duplicate`, `/api/admin/upload`) are **Admin Only**.");
  mdLines.push("   - Family members stream and download media only via short-lived signed URLs generated on-demand by session-verified endpoints.");
  mdLines.push("");
  mdLines.push("3. **Non-Production Test & Mock Routes**:");
  mdLines.push("   - `/api/auth/test-session` and `/api/mock-media` strictly return `404 Not Found` in production environments.");
  mdLines.push("");

  const outPath = path.join(process.cwd(), "SECURITY_ROUTES.md");
  fs.writeFileSync(outPath, mdLines.join("\n"), "utf-8");
  console.log(`✅ Generated ${routes.length} API routes into SECURITY_ROUTES.md`);

  return routes;
}

if (process.argv[1]?.includes("generate-security-routes")) {
  generateSecurityRoutes();
}
