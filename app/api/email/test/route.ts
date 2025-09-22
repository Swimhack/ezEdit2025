import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "../../../../lib/email/EmailService";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.templateId) {
      return NextResponse.json(
        { error: "templateId field is required" },
        { status: 400 }
      );
    }

    if (!data.templateData) {
      return NextResponse.json(
        { error: "templateData field is required" },
        { status: 400 }
      );
    }

    // Test template rendering
    const result = await EmailService.testTemplate(
      data.templateId,
      data.templateData
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Email test error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}