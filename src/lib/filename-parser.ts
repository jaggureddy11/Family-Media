/**
 * Filename Parser & Media Type Suggester
 *
 * Automatically extracts clean English titles and release years from
 * movie/video filenames, and detects suggested media types (MOVIE, FAMILY_VIDEO, PHOTO, FILE).
 */

export type SuggestedMediaType = "MOVIE" | "FAMILY_VIDEO" | "PHOTO" | "FILE";

export interface ParsedMediaInfo {
  titleEn: string;
  year?: number;
  suggestedType: SuggestedMediaType;
  cleanName: string;
}

// Scene release noise words to strip
const NOISE_TOKENS = new Set([
  "1080p", "720p", "480p", "2160p", "4k", "uhd", "hd", "fhd",
  "web-dl", "webrip", "web", "bluray", "blu-ray", "bdrip", "brrip",
  "dvdrip", "dvd", "hdrip", "hdtv", "remux", "remastered",
  "x264", "x265", "h264", "h265", "hevc", "avc", "10bit",
  "aac", "ac3", "ddp", "ddp2", "ddp5", "dd5", "dts", "atmos", "mp3",
  "nf", "amzn", "hotstar", "zee5", "aha", "sunnxt",
  "telugu", "hindi", "tamil", "malayalam", "kannada", "english",
  "esub", "sub", "dual", "multi", "audio"
]);

// Photo extensions
const PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "gif", "avif"]);

// Video extensions
const VIDEO_EXTENSIONS = new Set(["mp4", "m4v", "mov", "mkv", "webm", "avi"]);

/**
 * Parses a filename into clean metadata.
 */
export function parseMediaFilename(
  filename: string,
  durationSec?: number
): ParsedMediaInfo {
  // 1. Separate extension
  const lastDot = filename.lastIndexOf(".");
  const ext = lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : "";
  const nameWithoutExt = lastDot !== -1 ? filename.slice(0, lastDot) : filename;

  // 2. Identify suggested media category
  let suggestedType: SuggestedMediaType = "FILE";
  if (PHOTO_EXTENSIONS.has(ext)) {
    suggestedType = "PHOTO";
  } else if (VIDEO_EXTENSIONS.has(ext)) {
    // If video duration is >= 60 minutes (3600 seconds), strongly suggest MOVIE
    if (durationSec && durationSec >= 3600) {
      suggestedType = "MOVIE";
    } else if (isPhoneCameraVideo(nameWithoutExt)) {
      suggestedType = "FAMILY_VIDEO";
    } else {
      suggestedType = "FAMILY_VIDEO"; // Default for videos unless movie pattern detected
    }
  }

  // 3. Extract year if present: 4 digits starting with 19xx or 20xx surrounded by separators
  let year: number | undefined;
  const yearMatch = nameWithoutExt.match(/(?:^|[.\s_\-\(\[])((?:19|20)\d{2})(?:$|[.\s_\-\)\]])/);
  if (yearMatch) {
    year = parseInt(yearMatch[1], 10);
  }

  // 4. Tokenize name using separators (. _ - [ ] ( ) + space)
  const rawTokens = nameWithoutExt
    .replace(/[\[\]\(\)\-_+]/g, " ")
    .split(/[.\s]+/)
    .filter((t) => t.trim().length > 0);

  // If a year is found, or typical movie keywords exist in tokens, upgrade suggestion to MOVIE
  const hasMovieTokens = rawTokens.some((t) =>
    ["1080p", "720p", "2160p", "4k", "bluray", "web-dl", "webrip", "hdrip"].includes(t.toLowerCase())
  );

  if (suggestedType === "FAMILY_VIDEO" && (hasMovieTokens || (year && !isPhoneCameraVideo(nameWithoutExt)))) {
    suggestedType = "MOVIE";
  }

  // Collect tokens for clean title
  const titleTokens: string[] = [];
  for (const token of rawTokens) {
    const lower = token.toLowerCase();

    // Stop collecting when we hit the release year
    if (year && token === year.toString()) {
      break;
    }

    // Stop collecting when we hit scene quality tags
    if (NOISE_TOKENS.has(lower)) {
      break;
    }

    titleTokens.push(token);
  }

  let cleanTitle = titleTokens.join(" ").trim();
  if (!cleanTitle) {
    cleanTitle = nameWithoutExt.replace(/[._\-]/g, " ").trim();
  }

  // Capitalize words nicely
  cleanTitle = cleanTitle
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");

  return {
    titleEn: cleanTitle,
    year,
    suggestedType,
    cleanName: cleanTitle + (year ? ` (${year})` : ""),
  };
}

/**
 * Checks for typical smartphone camera naming patterns
 * e.g., VID_20230415_112233, PXL_20240101_120000, 20230514_142010, etc.
 */
function isPhoneCameraVideo(name: string): boolean {
  const upper = name.toUpperCase();
  if (upper.startsWith("VID_") || upper.startsWith("PXL_") || upper.startsWith("MOV_")) {
    return true;
  }
  // Date timestamp pattern like 20240512_143022
  if (/^\d{8}_\d{6}/.test(name)) {
    return true;
  }
  return false;
}
