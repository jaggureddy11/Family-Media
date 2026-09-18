import { describe, it, expect } from "vitest";
import { parseMediaFilename } from "@/lib/filename-parser";

describe("Filename Parser (15+ Real-world Movie Patterns & Classification)", () => {
  const testCases = [
    {
      filename: "Maya.Bazaar.1957.1080p.NF.WEB-DL.DDP2.0.x264.mp4",
      expectedTitle: "Maya Bazaar",
      expectedYear: 1957,
      expectedType: "MOVIE",
    },
    {
      filename: "RRR.2022.2160p.UHD.HDR.Telugu.Atmos.mp4",
      expectedTitle: "RRR",
      expectedYear: 2022,
      expectedType: "MOVIE",
    },
    {
      filename: "Baahubali.The.Beginning.2015.720p.BluRay.x264.mp4",
      expectedTitle: "Baahubali The Beginning",
      expectedYear: 2015,
      expectedType: "MOVIE",
    },
    {
      filename: "Sankranthi.Alludu.2024.HDRip.x264.mp4",
      expectedTitle: "Sankranthi Alludu",
      expectedYear: 2024,
      expectedType: "MOVIE",
    },
    {
      filename: "Manam (2014) [1080p] [Telugu].mp4",
      expectedTitle: "Manam",
      expectedYear: 2014,
      expectedType: "MOVIE",
    },
    {
      filename: "Annamayya_1997_DVDRip_Telugu.mp4",
      expectedTitle: "Annamayya",
      expectedYear: 1997,
      expectedType: "MOVIE",
    },
    {
      filename: "Sagara.Sangamam.1983.Remastered.mp4",
      expectedTitle: "Sagara Sangamam",
      expectedYear: 1983,
      expectedType: "MOVIE",
    },
    {
      filename: "Geethanjali.1989.Telugu.1080p.mp4",
      expectedTitle: "Geethanjali",
      expectedYear: 1989,
      expectedType: "MOVIE",
    },
    {
      filename: "Malliswari.2004.HDTV.720p.mp4",
      expectedTitle: "Malliswari",
      expectedYear: 2004,
      expectedType: "MOVIE",
    },
    {
      filename: "Athadu.2005.1080p.AAC.mp4",
      expectedTitle: "Athadu",
      expectedYear: 2005,
      expectedType: "MOVIE",
    },
    {
      filename: "Pokiri.2006.Telugu.WEB-DL.mp4",
      expectedTitle: "Pokiri",
      expectedYear: 2006,
      expectedType: "MOVIE",
    },
    {
      filename: "Bommarillu-2006-DVD-Rip.mp4",
      expectedTitle: "Bommarillu",
      expectedYear: 2006,
      expectedType: "MOVIE",
    },
    {
      filename: "Magadheera.2009.BDRip.1080p.mp4",
      expectedTitle: "Magadheera",
      expectedYear: 2009,
      expectedType: "MOVIE",
    },
    {
      filename: "Eega.2012.720p.HD.mp4",
      expectedTitle: "Eega",
      expectedYear: 2012,
      expectedType: "MOVIE",
    },
    {
      filename: "Jersey.2019.Telugu.1080p.NF.WEBRip.mp4",
      expectedTitle: "Jersey",
      expectedYear: 2019,
      expectedType: "MOVIE",
    },
    {
      filename: "Sita.Ramam.2022.1080p.AMZN.WEB-DL.mp4",
      expectedTitle: "Sita Ramam",
      expectedYear: 2022,
      expectedType: "MOVIE",
    },
    {
      filename: "Kantara.2022.1080p.WEBRip.x264.mp4",
      expectedTitle: "Kantara",
      expectedYear: 2022,
      expectedType: "MOVIE",
    },
    {
      filename: "Pushpa.The.Rise.2021.1080p.WEB-DL.mp4",
      expectedTitle: "Pushpa The Rise",
      expectedYear: 2021,
      expectedType: "MOVIE",
    },
  ];

  it.each(testCases)(
    "correctly extracts title and year from $filename",
    ({ filename, expectedTitle, expectedYear, expectedType }) => {
      const result = parseMediaFilename(filename);
      expect(result.titleEn).toBe(expectedTitle);
      expect(result.year).toBe(expectedYear);
      expect(result.suggestedType).toBe(expectedType);
    }
  );

  it("classifies phone videos as FAMILY_VIDEO", () => {
    const res1 = parseMediaFilename("VID_20230415_162030.mp4");
    expect(res1.suggestedType).toBe("FAMILY_VIDEO");

    const res2 = parseMediaFilename("PXL_20240101_120000.mp4");
    expect(res2.suggestedType).toBe("FAMILY_VIDEO");

    const res3 = parseMediaFilename("20230514_142010.mp4");
    expect(res3.suggestedType).toBe("FAMILY_VIDEO");
  });

  it("classifies images as PHOTO", () => {
    const res1 = parseMediaFilename("IMG_20240114_112233.jpg");
    expect(res1.suggestedType).toBe("PHOTO");

    const res2 = parseMediaFilename("Family_Portrait.png");
    expect(res2.suggestedType).toBe("PHOTO");
  });

  it("classifies PDFs and other docs as FILE", () => {
    const res = parseMediaFilename("House_Deed_Scan.pdf");
    expect(res.suggestedType).toBe("FILE");
  });
});
