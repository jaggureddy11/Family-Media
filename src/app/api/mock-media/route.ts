import { NextRequest, NextResponse } from "next/server";

// Minimal valid MP4 container (silent empty movie clip) for browser HTML5 video testing
// This 32-byte ftyp/moov container is standard for mock video playback
const MINIMAL_MP4 = Buffer.from([
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // size 24, "ftyp"
  0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00, // "isom", minor ver 512
  0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, // compatible brands
  0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65, // size 8, "free"
  0x00, 0x00, 0x00, 0x08, 0x6d, 0x64, 0x61, 0x74, // size 8, "mdat"
]);

const SAMPLE_WEBVTT = `WEBVTT - Kutumbam Subtitles

1
00:00:01.000 --> 00:00:05.000
నమస్తే! కుశలమా?
Namaste! How are you?

2
00:00:06.000 --> 00:00:12.000
కుటుంబం అందరికీ స్వాగతం.
Welcome everyone to Kutumbam.
`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "";

  // Subtitle WebVTT files
  if (key.endsWith(".vtt") || key.includes("subtitle")) {
    return new NextResponse(SAMPLE_WEBVTT, {
      status: 200,
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Image posters / thumbnails
  if (key.endsWith(".jpg") || key.endsWith(".jpeg") || key.endsWith(".webp") || key.endsWith(".png") || key.includes("posters/") || key.includes("thumbs/")) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <rect x="20" y="20" width="360" height="560" rx="16" fill="#0f172a" stroke="#facc15" stroke-width="4"/>
      <text x="50%" y="45%" text-anchor="middle" fill="#facc15" font-family="sans-serif" font-size="28" font-weight="bold">Kutumbam</text>
      <text x="50%" y="55%" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="36" font-weight="bold">కుటుంబం</text>
      <text x="50%" y="65%" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="20">Telugu Cinema</text>
    </svg>`;
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Video files: support HTTP range requests for HTML5 <video>
  const rangeHeader = request.headers.get("range");
  const totalSize = MINIMAL_MP4.length;

  if (rangeHeader && rangeHeader.startsWith("bytes=")) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10) || 0;
    const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
    const chunk = MINIMAL_MP4.slice(start, end + 1);

    return new NextResponse(chunk, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunk.length.toString(),
        "Content-Type": "video/mp4",
      },
    });
  }

  return new NextResponse(MINIMAL_MP4, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": totalSize.toString(),
      "Accept-Ranges": "bytes",
    },
  });
}
