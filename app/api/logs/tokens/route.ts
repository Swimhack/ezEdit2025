import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/logging/logger";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const logger = getLogger();

const LOG_ACCESS_TOKEN_SECRET = process.env.LOG_ACCESS_TOKEN_SECRET || "your-jwt-secret-for-log-tokens";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      filters,
      expiresIn = "1h",
      permissions = ["read"]
    } = body;

    const token = jwt.sign(
      {
        userId: user.id,
        filters,
        permissions,
        type: "log-access"
      },
      LOG_ACCESS_TOKEN_SECRET,
      {
        expiresIn,
        issuer: "ezedit.co",
        audience: "logs"
      }
    );

    const expiresAt = new Date();
    if (expiresIn.includes("h")) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));
    } else if (expiresIn.includes("d")) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    } else {
      expiresAt.setMinutes(expiresAt.getMinutes() + 60);
    }

    logger.info("Log access token generated", {
      userId: user.id,
      expiresIn,
      filters
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/logs/${token}`
    });

  } catch (error) {
    logger.error("Error generating log access token", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
