import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Email send functionality is temporarily disabled" },
    { status: 503 }
  );
}
