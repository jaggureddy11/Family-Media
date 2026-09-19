import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    const text = await request.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = { error: text };
      }
    }
    const { mediaId, error, details } = body;

    if (!mediaId) {
      return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
    }

    const session = await getSession();
    const userLabel = session?.user?.name_en || "Anonymous family member";
    const timestamp = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const failureReason = `Playback failure reported by ${userLabel} at ${timestamp}: ${error || "Unknown error"}${
      details ? ` (${details})` : ""
    }`;

    await prisma.mediaItem.update({
      where: { id: mediaId },
      data: {
        failureReason,
      },
    });

    return NextResponse.json({ success: true, failureReason });
  } catch (err: any) {
    console.error("Failed to log playback error:", err);
    return NextResponse.json(
      { error: "Failed to record playback error" },
      { status: 500 }
    );
  }
}
