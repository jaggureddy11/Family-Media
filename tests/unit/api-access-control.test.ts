import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createDeviceSession, createSignedCookieValue, SESSION_COOKIE_NAME } from "@/lib/auth";
import { Role } from "@prisma/client";

// Import Route Handlers
import { GET as getMovies } from "@/app/api/media/movies/route";
import { GET as getPhotos } from "@/app/api/media/photos/route";
import { GET as getFamilyVideos } from "@/app/api/media/family-videos/route";
import { GET as getFiles } from "@/app/api/media/files/route";
import { POST as createFolderAdmin } from "@/app/api/admin/files/route";
import { GET as getAdminDevices } from "@/app/api/admin/devices/route";
import { GET as getAdminAlbums } from "@/app/api/admin/albums/route";
import { POST as createPresignedUrl } from "@/app/api/storage/presigned-url/route";

describe("API Access Control & Immediate Session Revocation Tests", () => {
  let adminCookie: string;
  let familyCookie: string;
  let revokedCookie: string;
  let revokedDeviceId: string;

  beforeEach(async () => {
    // 0. Ensure users exist
    await prisma.user.upsert({
      where: { id: "admin-1" },
      update: {},
      create: {
        id: "admin-1",
        name_en: "Admin",
        name_te: "అడ్మిన్",
        role: Role.ADMIN,
      },
    });

    await prisma.user.upsert({
      where: { id: "mom-1" },
      update: {},
      create: {
        id: "mom-1",
        name_en: "Amma",
        name_te: "అమ్మ",
        role: Role.FAMILY,
      },
    });

    // 1. Setup Admin session
    const adminSession = await createDeviceSession({
      userId: "admin-1",
      deviceName: "Admin MacBook",
    });
    adminCookie = createSignedCookieValue(adminSession.rawToken, Role.ADMIN, adminSession.expiresAt);

    // 2. Setup Family session (Mom)
    const familySession = await createDeviceSession({
      userId: "mom-1",
      deviceName: "Amma iPhone",
    });
    familyCookie = createSignedCookieValue(familySession.rawToken, Role.FAMILY, familySession.expiresAt);

    // 3. Setup Revoked session
    const revokedSession = await createDeviceSession({
      userId: "mom-1",
      deviceName: "Stolen iPad",
    });
    revokedCookie = createSignedCookieValue(revokedSession.rawToken, Role.FAMILY, revokedSession.expiresAt);

    // Revoke the device directly in DB
    await prisma.device.update({
      where: { id: revokedSession.deviceId },
      data: { isRevoked: true },
    });
  });

  function createReq(url: string, cookieValue?: string, method = "GET", body?: any): NextRequest {
    const req = new NextRequest(url, {
      method,
      headers: {
        ...(cookieValue ? { cookie: `${SESSION_COOKIE_NAME}=${cookieValue}` } : {}),
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return req;
  }

  describe("1. Unauthenticated Requests (No Session)", () => {
    it("returns 401 Unauthorized for media routes", async () => {
      const req = createReq("http://localhost:3000/api/media/movies");
      const res = await getMovies(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 Unauthorized for admin routes", async () => {
      const req = createReq("http://localhost:3000/api/admin/devices");
      const res = await getAdminDevices(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 Unauthorized for storage routes", async () => {
      const req = createReq("http://localhost:3000/api/storage/presigned-url", undefined, "POST", { filename: "test.mp4", mediaType: "MOVIE" });
      const res = await createPresignedUrl(req);
      expect(res.status).toBe(401);
    });
  });

  describe("2. Family Member Session (Mom)", () => {
    it("allows GET on /api/media/movies", async () => {
      const req = createReq("http://localhost:3000/api/media/movies", familyCookie);
      const res = await getMovies(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("movies");
    });

    it("allows GET on /api/media/photos", async () => {
      const req = createReq("http://localhost:3000/api/media/photos?tab=timeline", familyCookie);
      const res = await getPhotos(req);
      expect(res.status).toBe(200);
    });

    it("allows GET on /api/media/family-videos", async () => {
      const req = createReq("http://localhost:3000/api/media/family-videos", familyCookie);
      const res = await getFamilyVideos(req);
      expect(res.status).toBe(200);
    });

    it("allows GET on /api/media/files (read-only)", async () => {
      const req = createReq("http://localhost:3000/api/media/files?folder=/", familyCookie);
      const res = await getFiles(req);
      expect(res.status).toBe(200);
    });

    it("strictly blocks POST to /api/admin/files with 403 Forbidden", async () => {
      const req = createReq("http://localhost:3000/api/admin/files", familyCookie, "POST", { folderName: "Secret" });
      const res = await createFolderAdmin(req);
      expect(res.status).toBe(403);
    });

    it("strictly blocks /api/admin/devices with 403 Forbidden", async () => {
      const req = createReq("http://localhost:3000/api/admin/devices", familyCookie);
      const res = await getAdminDevices(req);
      expect(res.status).toBe(403);
    });

    it("strictly blocks /api/storage/presigned-url with 403 Forbidden", async () => {
      const req = createReq("http://localhost:3000/api/storage/presigned-url", familyCookie, "POST", { filename: "test.mp4", mediaType: "MOVIE" });
      const res = await createPresignedUrl(req);
      expect(res.status).toBe(403);
    });
  });

  describe("3. Admin Session", () => {
    it("allows full access to /api/admin/devices", async () => {
      const req = createReq("http://localhost:3000/api/admin/devices", adminCookie);
      const res = await getAdminDevices(req);
      expect(res.status).toBe(200);
    });

    it("allows full access to /api/admin/albums", async () => {
      const req = createReq("http://localhost:3000/api/admin/albums", adminCookie);
      const res = await getAdminAlbums(req);
      expect(res.status).toBe(200);
    });

    it("allows folder mutations on /api/admin/files", async () => {
      const req = createReq("http://localhost:3000/api/admin/files", adminCookie, "POST", { folderName: "Certificates" });
      const res = await createFolderAdmin(req);
      expect(res.status).toBe(200);
    });
  });

  describe("4. Immediate Revocation Check against Database", () => {
    it("signs out and rejects requests from a revoked device on /api/media/movies", async () => {
      const req = createReq("http://localhost:3000/api/media/movies", revokedCookie);
      const res = await getMovies(req);
      // Database check must identify isRevoked=true and reject
      expect(res.status).toBe(401);
    });

    it("signs out and rejects requests from a revoked device on /api/media/photos", async () => {
      const req = createReq("http://localhost:3000/api/media/photos?tab=timeline", revokedCookie);
      const res = await getPhotos(req);
      expect(res.status).toBe(401);
    });
  });
});
