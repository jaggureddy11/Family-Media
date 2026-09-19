import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/settings
 */
export async function GET(request?: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const settings = await prisma.systemSetting.findMany();
    const map = new Map(settings.map((s: any) => [s.key, s.value]));

    return NextResponse.json({
      helpContactName: map.get("help_contact_name") || "Kiran (Son)",
      helpPhoneNumber: map.get("help_phone_number") || "+919876543210",
      helpWhatsappNumber: map.get("help_whatsapp_number") || "+919876543210",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings
 */
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { helpContactName, helpPhoneNumber, helpWhatsappNumber } = body;

    if (helpContactName) {
      await prisma.systemSetting.upsert({
        where: { key: "help_contact_name" },
        create: { key: "help_contact_name", value: helpContactName },
        update: { value: helpContactName },
      });
    }

    if (helpPhoneNumber) {
      await prisma.systemSetting.upsert({
        where: { key: "help_phone_number" },
        create: { key: "help_phone_number", value: helpPhoneNumber },
        update: { value: helpPhoneNumber },
      });
    }

    if (helpWhatsappNumber) {
      await prisma.systemSetting.upsert({
        where: { key: "help_whatsapp_number" },
        create: { key: "help_whatsapp_number", value: helpWhatsappNumber },
        update: { value: helpWhatsappNumber },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
