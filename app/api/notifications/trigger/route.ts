import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "../../../../lib/email/EmailService";
import { NotificationType, EmailPriority } from "../../../../lib/email/models/EmailNotification";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.event) {
      return NextResponse.json(
        { error: "event field is required" },
        { status: 400 }
      );
    }

    if (!data.userId) {
      return NextResponse.json(
        { error: "userId field is required" },
        { status: 400 }
      );
    }

    // Validate event type
    if (!Object.values(NotificationType).includes(data.event)) {
      return NextResponse.json(
        { error: `Invalid event type: ${data.event}` },
        { status: 400 }
      );
    }

    // Map event to template
    const templateMapping: Record<string, string> = {
      [NotificationType.WELCOME]: 'welcome',
      [NotificationType.EMAIL_VERIFICATION]: 'email-verification',
      [NotificationType.PASSWORD_RESET]: 'password-reset',
      [NotificationType.SYSTEM_ALERT]: 'admin-alert',
      [NotificationType.SECURITY_ALERT]: 'admin-alert',
      [NotificationType.ERROR_ALERT]: 'admin-alert'
    };

    const templateId = templateMapping[data.event];
    if (!templateId) {
      return NextResponse.json(
        { error: `No template available for event: ${data.event}` },
        { status: 400 }
      );
    }

    // Extract recipient email from data
    const recipientEmail = data.data?.email;
    if (!recipientEmail) {
      return NextResponse.json(
        { error: "Recipient email is required in data.email" },
        { status: 400 }
      );
    }

    // Generate subject based on event
    let subject = '';
    switch (data.event) {
      case NotificationType.WELCOME:
        subject = 'Welcome to EzEdit!';
        break;
      case NotificationType.EMAIL_VERIFICATION:
        subject = 'Verify your email address';
        break;
      case NotificationType.PASSWORD_RESET:
        subject = 'Reset your password';
        break;
      case NotificationType.SYSTEM_ALERT:
        subject = `System Alert: ${data.data?.alertType || 'System Event'}`;
        break;
      default:
        subject = 'Notification from EzEdit';
    }

    // Send notification email
    const result = await EmailService.sendEmail({
      to: recipientEmail,
      subject: subject,
      templateId: templateId,
      templateData: data.data || {},
      priority: data.priority || EmailPriority.NORMAL,
      userId: data.userId,
      correlationId: data.correlationId
    });

    if (!result.success) {
      return NextResponse.json(
        {
          notificationId: null,
          status: 'failed',
          reason: result.error
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      notificationId: result.notificationId,
      status: 'queued',
      reason: null
    }, { status: 202 });

  } catch (error) {
    console.error('Notification trigger error:', error);

    return NextResponse.json(
      {
        notificationId: null,
        status: 'failed',
        reason: 'Internal server error'
      },
      { status: 500 }
    );
  }
}