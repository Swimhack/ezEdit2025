// Stub implementation for deployment
export class EmailService {
  static async sendEmail(data: any) {
    console.log('Email service not implemented yet:', data);
    return { success: true, messageId: 'stub-' + Date.now(), id: 'stub-' + Date.now(), status: 'sent' };
  }

  static async processContactForm(data: any) {
    console.log('Contact form service not implemented yet:', data);
    return { success: true, id: 'stub-' + Date.now() };
  }
}