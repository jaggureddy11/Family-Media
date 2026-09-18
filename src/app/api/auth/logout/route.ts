import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, hashToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await prisma.device
      .updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      })
      .catch(() => {});
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true, redirect: "/login" });
}
