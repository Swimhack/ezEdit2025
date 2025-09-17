// Stub implementation for deployment
export class NotificationPreferenceService {
  static async getPreferences(userId: string) {
    console.log('Notification preferences service not implemented yet:', userId);
    return {
      email: true,
      sms: false,
      push: true,
      inApp: true,
      quietHours: { enabled: false, start: '22:00', end: '08:00' }
    };
  }

  static async updatePreferences(userId: string, preferences: any) {
    console.log('Update preferences not implemented yet:', userId, preferences);
    return { success: true, id: 'stub-' + Date.now() };
  }
}