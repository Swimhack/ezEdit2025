import { NextRequest, NextResponse } from "next/server";
import { getEmailSender } from "@/lib/email/sender";
import { EmailProvider } from "@/lib/email/models/EmailMessage";
import { getLogger } from "@/lib/logging/logger";
import { getNotificationDispatcher } from "@/lib/notifications/dispatcher";
import { NotificationChannel, NotificationPriority } from "@/lib/notifications/models/Notification";

const logger = getLogger();

const CONTACT_FORM_RECIPIENT = process.env.CONTACT_FORM_RECIPIENT || "support@ezedit.co";
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      subject,
      message,
      phone,
      company
    } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, subject, message" },
        { status: 400 }
      );
    }

    const emailSender = getEmailSender();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Contact Form Submission</h2>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ""}
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background-color: white; padding: 15px; border-radius: 3px; margin-top: 15px;">
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      </div>
    `;

    const confirmationHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for contacting EZEdit</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Your Message:</strong></p>
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
        <p>Best regards,<br>The EZEdit Team</p>
      </div>
    `;

    const adminResult = await emailSender.send({
      from: CONTACT_FORM_RECIPIENT,
      to: [CONTACT_FORM_RECIPIENT],
      subject: `[Contact Form] ${subject}`,
      html_body: htmlContent,
      text_body: `New contact form submission from ${name} (${email})\n\n${message}`,
      provider: EmailProvider.RESEND
    });

    if (!adminResult.success) {
      // logger.error("Failed to send contact form to admin", undefined, {
      //   errorMsg: adminResult.error,
      //   email,
      //   subject
      // });
    }

    const confirmationResult = await emailSender.send({
      from: CONTACT_FORM_RECIPIENT,
      to: [email],
      subject: `Re: ${subject}`,
      html_body: confirmationHtml,
      text_body: `Thank you for contacting EZEdit. We have received your message and will get back to you soon.\n\nYour message:\n${message}`,
      provider: EmailProvider.RESEND
    });

    if (!confirmationResult.success) {
      // logger.warn("Failed to send confirmation email", undefined, {
      //   errorMsg: confirmationResult.error,
      //   email
      // });
    }

    // const dispatcher = getNotificationDispatcher();
    // await dispatcher.send({
    //   recipientId: ADMIN_USER_ID,
    //   type: "contact_form",
    //   title: "New Contact Form Submission",
    //   message: `New message from ${name} (${email}): ${subject}`,
    //   priority: NotificationPriority.HIGH,
    //   channels: [NotificationChannel.IN_APP],
    //   data: {
    //     name,
    //     email,
    //     phone,
    //     company,
    //     subject,
    //     message
    //   }
    // });

    logger.info("Contact form processed", {
      name,
      email,
      subject,
      adminSent: adminResult.success,
      confirmationSent: confirmationResult.success
    });

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully. We'll get back to you soon!"
    });

  } catch (error) {
    // logger.error("Error processing contact form", { error });
    return NextResponse.json(
      { error: "Failed to process contact form. Please try again later." },
      { status: 500 }
    );
  }
}
