import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "../../../../../lib/email/EmailService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Email ID is required" },
        { status: 400 }
      );
    }

    // Get email status from EmailService
    const status = await EmailService.getEmailStatus(id);

    if (!status) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(status);

  } catch (error) {
    console.error('Email status error:', error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}