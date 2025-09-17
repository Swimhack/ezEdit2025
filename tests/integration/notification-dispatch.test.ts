import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { supabase } from '@/lib/supabase';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3102; // Use unique port for integration tests

describe('Notification Dispatch - Integration Test', () => {
  let app: any;
  let handle: any;
  let server: any;
  let testUserId: string;
  let authToken: string;
  let secondTestUserId: string;

  beforeAll(async () => {
    // Setup Next.js test server
    app = next({ dev, hostname, port });
    handle = app.getRequestHandler();
    await app.prepare();

    server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('internal server error');
      }
    });

    await new Promise<void>((resolve) => {
      server.listen(port, () => {
        console.log(`> Notification dispatch test server ready on http://${hostname}:${port}`);
        resolve();
      });
    });

    // Setup primary test user
    const { data: user1, error: userError1 } = await supabase.auth.signUp({
      email: `notification-dispatch-test-${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    if (userError1 || !user1.user) {
      throw new Error(`Failed to create primary test user: ${userError1?.message}`);
    }

    testUserId = user1.user.id;

    // Setup secondary test user
    const { data: user2, error: userError2 } = await supabase.auth.signUp({
      email: `notification-dispatch-test-2-${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    if (userError2 || !user2.user) {
      throw new Error(`Failed to create secondary test user: ${userError2?.message}`);
    }

    secondTestUserId = user2.user.id;

    // Get auth token
    const { data: session } = await supabase.auth.getSession();
    authToken = session?.session?.access_token || 'mock-token';

    // Setup user preferences for testing
    await supabase.from('notification_preferences').upsert({
      user_id: testUserId,
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      email_address: `notification-test-${Date.now()}@example.com`,
      phone_number: '+1234567890',
      quiet_hours: {
        enabled: true,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'UTC'
      }
    });

    await supabase.from('notification_preferences').upsert({
      user_id: secondTestUserId,
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      in_app_enabled: true,
      email_address: `notification-test-2-${Date.now()}@example.com`,
      phone_number: null
    });
  });

  afterAll(async () => {
    // Cleanup test users and data
    if (testUserId) {
      await supabase.from('notifications').delete().eq('user_id', testUserId);
      await supabase.from('notification_preferences').delete().eq('user_id', testUserId);
      await supabase.from('notification_deliveries').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }

    if (secondTestUserId) {
      await supabase.from('notifications').delete().eq('user_id', secondTestUserId);
      await supabase.from('notification_preferences').delete().eq('user_id', secondTestUserId);
      await supabase.from('notification_deliveries').delete().eq('user_id', secondTestUserId);
      await supabase.auth.admin.deleteUser(secondTestUserId);
    }

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Clean up notifications for fresh test state
    await supabase.from('notifications').delete().eq('user_id', testUserId);
    await supabase.from('notifications').delete().eq('user_id', secondTestUserId);
    await supabase.from('notification_deliveries').delete().eq('user_id', testUserId);
    await supabase.from('notification_deliveries').delete().eq('user_id', secondTestUserId);
  });

  it('should dispatch notifications across all enabled channels', async () => {
    // Send multi-channel notification
    const notificationRequest = {
      userId: testUserId,
      type: 'info',
      priority: 'MEDIUM',
      title: 'Multi-channel Test Notification',
      message: 'This notification should be sent via all enabled channels',
      channels: ['email', 'sms', 'push', 'in-app'],
      data: {
        actionUrl: 'https://example.com/action',
        category: 'test'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationRequest)
    });

    expect(response.status).toBe(201);
    const notificationData = await response.json();
    expect(notificationData).toHaveProperty('id');

    const notificationId = notificationData.id;

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify notification was created
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    expect(notification).toBeTruthy();
    expect(notification.title).toBe('Multi-channel Test Notification');
    expect(notification.status).toBe('sent');

    // Verify deliveries were created for all enabled channels
    const { data: deliveries } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', notificationId);

    expect(deliveries).toBeTruthy();
    expect(deliveries.length).toBe(4); // email, sms, push, in-app

    const channelTypes = deliveries.map(d => d.channel);
    expect(channelTypes).toContain('email');
    expect(channelTypes).toContain('sms');
    expect(channelTypes).toContain('push');
    expect(channelTypes).toContain('in-app');

    // Verify delivery status
    deliveries.forEach(delivery => {
      expect(delivery.status).toMatch(/^(pending|sent|delivered)$/);
      expect(delivery.attempted_at).toBeTruthy();
    });

    // Test delivery status tracking
    const statusResponse = await fetch(`http://localhost:${port}/api/notifications/${notificationId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(statusResponse.status).toBe(200);
    const statusData = await statusResponse.json();
    expect(statusData).toHaveProperty('id', notificationId);
    expect(statusData).toHaveProperty('deliveries');
    expect(statusData.deliveries.length).toBe(4);
  });

  it('should respect user channel preferences', async () => {
    // Send notification to second user who has SMS disabled
    const notificationRequest = {
      userId: secondTestUserId,
      type: 'warning',
      priority: 'HIGH',
      title: 'Preference Respect Test',
      message: 'This should not be sent via SMS',
      channels: ['email', 'sms', 'push', 'in-app'] // Request all channels
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationRequest)
    });

    expect(response.status).toBe(201);
    const notificationData = await response.json();
    const notificationId = notificationData.id;

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify deliveries respect user preferences
    const { data: deliveries } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', notificationId);

    expect(deliveries).toBeTruthy();
    expect(deliveries.length).toBe(3); // email, push, in-app (no SMS)

    const channelTypes = deliveries.map(d => d.channel);
    expect(channelTypes).toContain('email');
    expect(channelTypes).toContain('push');
    expect(channelTypes).toContain('in-app');
    expect(channelTypes).not.toContain('sms');
  });

  it('should handle priority-based routing and escalation', async () => {
    // Send CRITICAL priority notification
    const criticalNotification = {
      userId: testUserId,
      type: 'error',
      priority: 'CRITICAL',
      title: 'Critical System Alert',
      message: 'Critical issue requiring immediate attention',
      channels: ['email', 'sms', 'push']
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criticalNotification)
    });

    expect(response.status).toBe(201);
    const notificationData = await response.json();
    const notificationId = notificationData.id;

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify critical notification properties
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    expect(notification.priority).toBe('CRITICAL');
    expect(notification.type).toBe('error');

    // Verify deliveries have appropriate urgency
    const { data: deliveries } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', notificationId);

    // Critical notifications should be delivered faster
    deliveries.forEach(delivery => {
      expect(delivery.priority).toBe('CRITICAL');
      if (delivery.status === 'delivered') {
        const deliveryTime = new Date(delivery.delivered_at).getTime();
        const attemptTime = new Date(delivery.attempted_at).getTime();
        const deliveryDuration = deliveryTime - attemptTime;

        // Critical notifications should be delivered quickly (under 30 seconds)
        expect(deliveryDuration).toBeLessThan(30000);
      }
    });
  });

  it('should handle quiet hours and scheduling', async () => {
    // Test notification during quiet hours
    const quietHoursNotification = {
      userId: testUserId,
      type: 'info',
      priority: 'LOW', // Non-critical should be delayed
      title: 'Quiet Hours Test',
      message: 'This should be delayed due to quiet hours',
      channels: ['email', 'push']
    };

    // Mock current time to be during quiet hours (e.g., 23:00 UTC)
    const mockQuietHourTime = new Date();
    mockQuietHourTime.setUTCHours(23, 0, 0, 0);

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...quietHoursNotification,
        scheduledFor: mockQuietHourTime.toISOString()
      })
    });

    expect(response.status).toBe(201);
    const notificationData = await response.json();
    const notificationId = notificationData.id;

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify notification is scheduled, not immediately sent
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    expect(notification.status).toBe('scheduled');
    expect(notification.scheduled_for).toBeTruthy();

    // Test CRITICAL notification during quiet hours (should bypass)
    const criticalQuietNotification = {
      userId: testUserId,
      type: 'error',
      priority: 'CRITICAL',
      title: 'Critical Alert During Quiet Hours',
      message: 'This should bypass quiet hours',
      channels: ['email', 'sms']
    };

    const criticalResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criticalQuietNotification)
    });

    expect(criticalResponse.status).toBe(201);
    const criticalData = await criticalResponse.json();

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: criticalNotification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', criticalData.id)
      .single();

    // Critical notifications should bypass quiet hours
    expect(criticalNotification.status).toBe('sent');
  });

  it('should handle batch notifications efficiently', async () => {
    // Send multiple notifications in batch
    const batchNotifications = Array.from({ length: 10 }, (_, i) => ({
      userId: testUserId,
      type: 'info',
      priority: 'MEDIUM',
      title: `Batch Notification ${i + 1}`,
      message: `This is batch notification number ${i + 1}`,
      channels: ['email', 'in-app'],
      data: { batchIndex: i }
    }));

    const batchResponse = await fetch(`http://localhost:${port}/api/notifications/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notifications: batchNotifications })
    });

    expect(batchResponse.status).toBe(201);
    const batchData = await batchResponse.json();
    expect(batchData).toHaveProperty('created');
    expect(batchData.created).toBe(10);
    expect(batchData).toHaveProperty('notificationIds');
    expect(batchData.notificationIds.length).toBe(10);

    // Wait for batch processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify all notifications were created and processed
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .in('id', batchData.notificationIds);

    expect(notifications.length).toBe(10);
    notifications.forEach((notification, index) => {
      expect(notification.title).toBe(`Batch Notification ${index + 1}`);
      expect(notification.status).toMatch(/^(sent|delivered)$/);
    });

    // Verify deliveries were created efficiently
    const { data: deliveries } = await supabase
      .from('notification_deliveries')
      .select('*')
      .in('notification_id', batchData.notificationIds);

    // Should have 2 deliveries per notification (email + in-app)
    expect(deliveries.length).toBe(20);
  });

  it('should handle delivery failures and retries', async () => {
    // Send notification to trigger potential delivery failures
    const failureTestNotification = {
      userId: testUserId,
      type: 'info',
      priority: 'MEDIUM',
      title: 'Delivery Failure Test',
      message: 'Testing delivery failure handling',
      channels: ['email', 'sms'],
      data: {
        testDeliveryFailure: true,
        invalidEmail: 'invalid-email-address', // This should cause email delivery to fail
        invalidPhone: 'invalid-phone' // This should cause SMS delivery to fail
      }
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(failureTestNotification)
    });

    expect(response.status).toBe(201);
    const notificationData = await response.json();
    const notificationId = notificationData.id;

    // Wait for initial delivery attempts and retries
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check delivery status and retry attempts
    const { data: deliveries } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', notificationId);

    expect(deliveries.length).toBe(2); // email and sms

    // Verify retry logic
    deliveries.forEach(delivery => {
      expect(delivery.retry_count).toBeGreaterThan(0);
      expect(delivery.last_error).toBeTruthy();

      if (delivery.status === 'failed') {
        expect(delivery.retry_count).toBeLessThanOrEqual(3); // Max retry limit
      }
    });

    // Test manual retry
    const retryResponse = await fetch(`http://localhost:${port}/api/notifications/${notificationId}/retry`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channels: ['email', 'sms'] })
    });

    expect(retryResponse.status).toBe(200);
    const retryData = await retryResponse.json();
    expect(retryData).toHaveProperty('retriedDeliveries');
  });

  it('should support real-time notification streaming', async () => {
    return new Promise<void>((resolve, reject) => {
      // Establish SSE connection for real-time notifications
      const sseUrl = `http://localhost:${port}/api/notifications/stream?userId=${testUserId}`;
      const eventSource = new (global as any).EventSource(sseUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      let notificationReceived = false;

      eventSource.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'notification' && data.title === 'Real-time Streaming Test') {
            notificationReceived = true;
            eventSource.close();

            // Verify notification data
            expect(data).toHaveProperty('id');
            expect(data).toHaveProperty('timestamp');
            expect(data.title).toBe('Real-time Streaming Test');
            expect(data.message).toBe('Testing real-time notification delivery');
            expect(data.channels).toContain('in-app');

            resolve();
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = (error: any) => {
        eventSource.close();
        reject(error);
      };

      // Send notification after establishing connection
      setTimeout(async () => {
        await fetch(`http://localhost:${port}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: testUserId,
            type: 'info',
            priority: 'MEDIUM',
            title: 'Real-time Streaming Test',
            message: 'Testing real-time notification delivery',
            channels: ['in-app']
          })
        });
      }, 1000);

      // Timeout after 10 seconds
      setTimeout(() => {
        eventSource.close();
        if (!notificationReceived) {
          reject(new Error('Real-time notification not received within timeout'));
        }
      }, 10000);
    });
  });

  it('should track delivery analytics and metrics', async () => {
    // Send notifications with different outcomes for analytics
    const analyticsNotifications = [
      {
        userId: testUserId,
        type: 'info',
        priority: 'LOW',
        title: 'Analytics Test 1',
        message: 'Low priority notification',
        channels: ['email']
      },
      {
        userId: testUserId,
        type: 'warning',
        priority: 'MEDIUM',
        title: 'Analytics Test 2',
        message: 'Medium priority notification',
        channels: ['email', 'push']
      },
      {
        userId: testUserId,
        type: 'error',
        priority: 'HIGH',
        title: 'Analytics Test 3',
        message: 'High priority notification',
        channels: ['email', 'sms', 'push']
      }
    ];

    // Send all notifications
    const notificationIds = [];
    for (const notification of analyticsNotifications) {
      const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      });

      const data = await response.json();
      notificationIds.push(data.id);
    }

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get analytics data
    const analyticsResponse = await fetch(`http://localhost:${port}/api/notifications/analytics?userId=${testUserId}&period=1h`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(analyticsResponse.status).toBe(200);
    const analyticsData = await analyticsResponse.json();

    // Verify analytics structure
    expect(analyticsData).toHaveProperty('summary');
    expect(analyticsData).toHaveProperty('byChannel');
    expect(analyticsData).toHaveProperty('byPriority');
    expect(analyticsData).toHaveProperty('byType');
    expect(analyticsData).toHaveProperty('deliveryRates');

    // Verify summary data
    expect(analyticsData.summary.totalSent).toBe(3);
    expect(analyticsData.summary.totalDeliveries).toBeGreaterThan(3); // Multiple channels

    // Verify channel breakdown
    expect(analyticsData.byChannel).toHaveProperty('email');
    expect(analyticsData.byChannel).toHaveProperty('push');
    expect(analyticsData.byChannel).toHaveProperty('sms');

    // Verify priority breakdown
    expect(analyticsData.byPriority).toHaveProperty('LOW');
    expect(analyticsData.byPriority).toHaveProperty('MEDIUM');
    expect(analyticsData.byPriority).toHaveProperty('HIGH');

    // Verify delivery rates
    expect(analyticsData.deliveryRates).toHaveProperty('overall');
    expect(analyticsData.deliveryRates.overall).toBeGreaterThan(0);
    expect(analyticsData.deliveryRates.overall).toBeLessThanOrEqual(100);
  });
});