import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    app: "kutumbam",
    timestamp: new Date().toISOString(),
  });
}
