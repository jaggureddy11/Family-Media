import { describe, it, expect } from "vitest";
import {
  formatBilingualDate,
  formatBilingualMonthYear,
  TELUGU_MONTHS,
  ENGLISH_MONTHS,
} from "@/lib/strings";
import { prisma } from "@/lib/prisma";

describe("Milestone 5 Unit Tests: Photos, Timeline & Files", () => {
  describe("1. Telugu & English Date Formatting", () => {
    it("formats dates into friendly bilingual format without technical noise", () => {
      const d = new Date("2019-03-12T10:00:00Z");
      const formatted = formatBilingualDate(d);

      expect(formatted.en).toBe("12 March 2019");
      expect(formatted.te).toBe("2019 మార్చి 12");
    });

    it("formats Month and Year headers for timeline groups correctly", () => {
      // Month index 2 is March (0-indexed)
      const header = formatBilingualMonthYear(2024, 2);

      expect(header.en).toBe("March 2024");
      expect(header.te).toBe("2024 మార్చి");
    });

    it("has all 12 Telugu month names matching English months", () => {
      expect(TELUGU_MONTHS.length).toBe(12);
      expect(ENGLISH_MONTHS.length).toBe(12);
      expect(TELUGU_MONTHS[0]).toBe("జనవరి");
      expect(TELUGU_MONTHS[2]).toBe("మార్చి");
      expect(TELUGU_MONTHS[11]).toBe("డిసెంబర్");
    });
  });

  describe("2. Custom Albums & Media Associations", () => {
    it("creates custom bilingual album and manages album items", async () => {
      const album = await prisma.album.create({
        data: {
          title_en: "Tirupati Pilgrimage 2023",
          title_te: "తిరుపతి యాత్ర 2023",
          year: 2023,
          isAutoYearly: false,
        },
      });

      expect(album.id).toBeDefined();
      expect(album.title_en).toBe("Tirupati Pilgrimage 2023");
      expect(album.title_te).toBe("తిరుపతి యాత్ర 2023");

      // Add item to album
      const item = await prisma.albumItem.create({
        data: {
          albumId: album.id,
          mediaItemId: "media_1",
          sortOrder: 0,
        },
      });

      expect(item.albumId).toBe(album.id);

      const items = await prisma.albumItem.findMany({
        where: { albumId: album.id },
      });
      expect(items.length).toBe(1);

      // Clean up item
      const del = await prisma.albumItem.deleteMany({
        where: { albumId: album.id },
      });
      expect(del.count).toBe(1);
    });
  });

  describe("3. File Category Mapping", () => {
    it("identifies PDF, audio, and image files correctly", () => {
      const getCat = (mime: string, name: string) => {
        const ext = name.split(".").pop()?.toLowerCase() || "";
        if (mime.includes("pdf") || ext === "pdf") return "PDF";
        if (mime.startsWith("audio/") || ["mp3", "m4a", "wav"].includes(ext)) return "AUDIO";
        if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext)) return "IMAGE";
        return "OTHER";
      };

      expect(getCat("application/pdf", "blood_report.pdf")).toBe("PDF");
      expect(getCat("audio/mpeg", "annamayya_keerthanalu.mp3")).toBe("AUDIO");
      expect(getCat("image/jpeg", "family_house.jpg")).toBe("IMAGE");
      expect(getCat("application/zip", "archive.zip")).toBe("OTHER");
    });
  });
});
