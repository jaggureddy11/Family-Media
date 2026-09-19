import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/settings
 * Returns public/family support contact configuration for the Help card.
 */
export async function GET() {
  const envPhone = process.env.NEXT_PUBLIC_HELP_PHONE_NUMBER || "+919110300509";
  const envWhatsapp = process.env.NEXT_PUBLIC_HELP_WHATSAPP_NUMBER || "+919110300509";
  const envName = process.env.NEXT_PUBLIC_HELP_CONTACT_NAME || "Jaggu";

  try {
    const settings = await prisma.systemSetting.findMany();
    const map = new Map(settings.map((s: any) => [s.key, s.value]));

    return NextResponse.json({
      helpContactName: map.get("help_contact_name") || envName,
      helpPhoneNumber: map.get("help_phone_number") || envPhone,
      helpWhatsappNumber: map.get("help_whatsapp_number") || envWhatsapp,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        helpContactName: envName,
        helpPhoneNumber: envPhone,
        helpWhatsappNumber: envWhatsapp,
      },
      { status: 200 }
    );
  }
}
