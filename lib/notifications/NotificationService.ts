// Stub implementation for deployment
export class NotificationService {
  static async sendNotification(data: any) {
    console.log('Notification service not implemented yet:', data);
    return { success: true, id: 'stub-' + Date.now(), messageId: 'stub-msg-' + Date.now() };
  }

  static async getNotificationStatus(id: string) {
    console.log('Notification status not implemented yet:', id);
    return { id, status: 'delivered', timestamp: new Date().toISOString() };
  }
}