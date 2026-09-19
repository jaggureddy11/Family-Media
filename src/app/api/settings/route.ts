import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/settings
 * Returns public/family support contact configuration for the Help card.
 */
export async function GET() {
  try {
    const settings = await prisma.systemSetting.findMany();
    const map = new Map(settings.map((s: any) => [s.key, s.value]));

    return NextResponse.json({
      helpContactName: map.get("help_contact_name") || "Kiran (Son)",
      helpPhoneNumber: map.get("help_phone_number") || "+919876543210",
      helpWhatsappNumber: map.get("help_whatsapp_number") || "+919876543210",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        helpContactName: "Kiran (Son)",
        helpPhoneNumber: "+919876543210",
        helpWhatsappNumber: "+919876543210",
      },
      { status: 200 }
    );
  }
}
