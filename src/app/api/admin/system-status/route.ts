import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageInfo } from "@/lib/storage";
import { getDatabaseInfo } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const storage = getStorageInfo();
  const database = getDatabaseInfo();

  // In production, mock providers are strictly forbidden
  if (isProduction && (!storage.isReal || !database.isReal)) {
    return NextResponse.json(
      {
        error: "Production environment cannot run with mock storage or mock database",
        storage,
        database,
        isProduction,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    storage,
    database,
    isProduction,
  });
}
