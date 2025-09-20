import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_37YYP2iE_KbLqkdskcjngf9XqFMJZv1xG');

export { resend };

export interface ResendEmailOptions {
  to: string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export async function sendEmail(options: ResendEmailOptions) {
  try {
    const emailData: any = {
      to: options.to,
      from: options.from,
      subject: options.subject,
    };

    if (options.html) {
      emailData.html = options.html;
    }
    if (options.text) {
      emailData.text = options.text;
    }
    if (options.attachments) {
      emailData.attachments = options.attachments;
    }

    const result = await resend.emails.send(emailData);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}