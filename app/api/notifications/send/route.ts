import { NextRequest, NextResponse } from "next/server";
import { getNotificationDispatcher } from "@/lib/notifications/dispatcher";
import { NotificationPriority, NotificationChannel } from "@/lib/notifications/models/Notification";
import { getLogger } from "@/lib/logging/logger";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const logger = getLogger();

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
      user_id,
      type,
      title,
      message,
      priority = NotificationPriority.MEDIUM,
      channels,
      data,
      expiresAt
    } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, type, title, message" },
        { status: 400 }
      );
    }

    const dispatcher = getNotificationDispatcher();

    const result = await dispatcher.dispatch({
      user_id,
      type,
      title,
      message,
      priority,
      channels: channels || [NotificationChannel.IN_APP],
      data
    });

    if (!result.overallSuccess) {
      const errors = result.channels.filter(c => !c.success).map(c => c.error);

      logger.error("Failed to send notification", undefined, {
        errorMsg: errors.join(", "),
        user_id,
        type,
        title
      });

      return NextResponse.json(
        { error: errors.join(", ") || "Failed to send notification" },
        { status: 500 }
      );
    }

    logger.info("Notification sent successfully", {
      notificationId: result.notification.id,
      user_id,
      type,
      channels: result.channels
    });

    return NextResponse.json({
      success: true,
      notificationId: result.notification.id,
      channels: result.channels.map(c => ({
        channel: c.channel,
        success: c.success,
        messageId: c.messageId
      }))
    });

  } catch (error) {
    logger.error("Error sending notification", error as Error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
