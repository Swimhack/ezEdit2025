import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { supabase } from '@/lib/supabase';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3107; // Use unique port for integration tests

describe('Notification Deduplication - Integration Test', () => {
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
        console.log(`> Deduplication test server ready on http://${hostname}:${port}`);
        resolve();
      });
    });

    // Setup primary test user
    const { data: user1, error: userError1 } = await supabase.auth.signUp({
      email: `dedup-test-${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    if (userError1 || !user1.user) {
      throw new Error(`Failed to create primary test user: ${userError1?.message}`);
    }

    testUserId = user1.user.id;

    // Setup secondary test user
    const { data: user2, error: userError2 } = await supabase.auth.signUp({
      email: `dedup-test-2-${Date.now()}@example.com`,
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
    await supabase.from('notification_preferences').upsert([
      {
        user_id: testUserId,
        email_enabled: true,
        sms_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        email_address: `dedup-test-${Date.now()}@example.com`,
        phone_number: '+1234567890',
        deduplication_settings: {
          enabled: true,
          window_minutes: 5,
          match_criteria: ['title', 'message', 'type'],
          merge_similar: true
        }
      },
      {
        user_id: secondTestUserId,
        email_enabled: true,
        sms_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        email_address: `dedup-test-2-${Date.now()}@example.com`,
        deduplication_settings: {
          enabled: false // Disabled for comparison
        }
      }
    ]);
  });

  afterAll(async () => {
    // Cleanup test users and data
    if (testUserId) {
      await supabase.from('notifications').delete().eq('user_id', testUserId);
      await supabase.from('notification_deduplication').delete().eq('user_id', testUserId);
      await supabase.from('notification_preferences').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }

    if (secondTestUserId) {
      await supabase.from('notifications').delete().eq('user_id', secondTestUserId);
      await supabase.from('notification_deduplication').delete().eq('user_id', secondTestUserId);
      await supabase.from('notification_preferences').delete().eq('user_id', secondTestUserId);
      await supabase.auth.admin.deleteUser(secondTestUserId);
    }

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Clean up notifications and deduplication data for fresh test state
    await supabase.from('notifications').delete().eq('user_id', testUserId);
    await supabase.from('notifications').delete().eq('user_id', secondTestUserId);
    await supabase.from('notification_deduplication').delete().eq('user_id', testUserId);
    await supabase.from('notification_deduplication').delete().eq('user_id', secondTestUserId);
  });

  it('should deduplicate identical notifications within 5-minute window', async () => {
    const baseNotification = {
      userId: testUserId,
      type: 'security_alert',
      priority: 'HIGH',
      title: 'Security Alert: Suspicious Login Detected',
      message: 'A suspicious login attempt was detected from IP address 192.168.1.100',
      channels: ['email', 'push'],
      data: {
        ipAddress: '192.168.1.100',
        location: 'Unknown Location',
        timestamp: new Date().toISOString()
      }
    };

    // Send first notification
    const firstResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(baseNotification)
    });

    expect(firstResponse.status).toBe(201);
    const firstData = await firstResponse.json();
    expect(firstData).toHaveProperty('id');
    expect(firstData.deduplicated).toBe(false);

    // Wait a short time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send identical notification (should be deduplicated)
    const secondResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(baseNotification)
    });

    expect(secondResponse.status).toBe(201);
    const secondData = await secondResponse.json();
    expect(secondData.deduplicated).toBe(true);
    expect(secondData.originalNotificationId).toBe(firstData.id);
    expect(secondData.deduplicationReason).toBe('identical_within_window');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify only one notification was actually created/sent
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'security_alert')
      .order('created_at', { ascending: true });

    expect(notifications.length).toBe(1);
    expect(notifications[0].id).toBe(firstData.id);

    // Verify deduplication was logged
    const { data: deduplicationLog } = await supabase
      .from('notification_deduplication')
      .select('*')
      .eq('user_id', testUserId)
      .eq('duplicate_notification_hash', secondData.deduplicationHash)
      .single();

    expect(deduplicationLog).toBeTruthy();
    expect(deduplicationLog.original_notification_id).toBe(firstData.id);
    expect(deduplicationLog.deduplication_reason).toBe('identical_within_window');
    expect(deduplicationLog.occurrence_count).toBe(1);
  });

  it('should allow notifications after deduplication window expires', async () => {
    const notification = {
      userId: testUserId,
      type: 'system_alert',
      priority: 'MEDIUM',
      title: 'System Maintenance Alert',
      message: 'Scheduled maintenance will begin in 30 minutes',
      channels: ['email', 'in-app'],
      data: {
        maintenanceType: 'database',
        estimatedDuration: '2 hours'
      }
    };

    // Send first notification
    const firstResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification)
    });

    expect(firstResponse.status).toBe(201);
    const firstData = await firstResponse.json();

    // Mock that 6 minutes have passed by updating the first notification's timestamp
    await supabase
      .from('notifications')
      .update({
        created_at: new Date(Date.now() - 6 * 60 * 1000).toISOString() // 6 minutes ago
      })
      .eq('id', firstData.id);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send identical notification (should NOT be deduplicated due to expired window)
    const secondResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification)
    });

    expect(secondResponse.status).toBe(201);
    const secondData = await secondResponse.json();
    expect(secondData.deduplicated).toBe(false);
    expect(secondData).not.toHaveProperty('originalNotificationId');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify both notifications exist
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'system_alert')
      .order('created_at', { ascending: true });

    expect(notifications.length).toBe(2);
  });

  it('should merge similar notifications with count updates', async () => {
    const baseNotification = {
      userId: testUserId,
      type: 'error_alert',
      priority: 'MEDIUM',
      title: 'Database Connection Error',
      message: 'Failed to connect to database server',
      channels: ['email', 'in-app'],
      data: {
        service: 'user-service',
        errorCode: 'DB_CONNECTION_FAILED'
      }
    };

    // Send first notification
    const firstResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(baseNotification)
    });

    expect(firstResponse.status).toBe(201);
    const firstData = await firstResponse.json();

    // Send similar notifications with slight variations
    const variations = [
      {
        ...baseNotification,
        data: { ...baseNotification.data, timestamp: new Date().toISOString() }
      },
      {
        ...baseNotification,
        data: { ...baseNotification.data, attemptNumber: 2 }
      },
      {
        ...baseNotification,
        data: { ...baseNotification.data, severity: 'medium' }
      }
    ];

    // Send variations
    for (let i = 0; i < variations.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between sends

      const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variations[i])
      });

      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.deduplicated).toBe(true);
      expect(responseData.deduplicationReason).toBe('similar_merged');
    }

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify only one notification exists but with updated count
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'error_alert');

    expect(notifications.length).toBe(1);
    const mergedNotification = notifications[0];
    expect(mergedNotification.occurrence_count).toBe(4); // 1 original + 3 merged
    expect(mergedNotification.last_occurrence_at).toBeTruthy();

    // Verify deduplication entries
    const { data: deduplicationEntries } = await supabase
      .from('notification_deduplication')
      .select('*')
      .eq('user_id', testUserId)
      .eq('original_notification_id', firstData.id);

    expect(deduplicationEntries.length).toBe(3); // One for each merged notification
  });

  it('should respect user deduplication preferences', async () => {
    const notification = {
      type: 'info',
      priority: 'LOW',
      title: 'Weekly Report Available',
      message: 'Your weekly analytics report is ready for review',
      channels: ['email'],
      data: {
        reportType: 'analytics',
        period: 'weekly'
      }
    };

    // Send to user with deduplication ENABLED
    const enabledUserResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...notification,
        userId: testUserId
      })
    });

    expect(enabledUserResponse.status).toBe(201);

    // Send to user with deduplication DISABLED
    const disabledUserResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...notification,
        userId: secondTestUserId
      })
    });

    expect(disabledUserResponse.status).toBe(201);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send identical notifications again
    const enabledUserSecondResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...notification,
        userId: testUserId
      })
    });

    const disabledUserSecondResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...notification,
        userId: secondTestUserId
      })
    });

    const enabledUserSecondData = await enabledUserSecondResponse.json();
    const disabledUserSecondData = await disabledUserSecondResponse.json();

    // Enabled user should have deduplication
    expect(enabledUserSecondData.deduplicated).toBe(true);

    // Disabled user should NOT have deduplication
    expect(disabledUserSecondData.deduplicated).toBe(false);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify notification counts
    const { data: enabledUserNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'info');

    const { data: disabledUserNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', secondTestUserId)
      .eq('type', 'info');

    expect(enabledUserNotifications.length).toBe(1); // Deduplicated
    expect(disabledUserNotifications.length).toBe(2); // Not deduplicated
  });

  it('should handle deduplication across different channels appropriately', async () => {
    const baseNotification = {
      userId: testUserId,
      type: 'billing_alert',
      priority: 'HIGH',
      title: 'Payment Method Expired',
      message: 'Your credit card ending in 1234 has expired',
      data: {
        cardLast4: '1234',
        expiryDate: '12/23'
      }
    };

    // Send notification via email first
    const emailResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...baseNotification,
        channels: ['email']
      })
    });

    expect(emailResponse.status).toBe(201);
    const emailData = await emailResponse.json();

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send same notification via SMS (should be deduplicated but still send via SMS if user hasn't seen it)
    const smsResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...baseNotification,
        channels: ['sms']
      })
    });

    expect(smsResponse.status).toBe(201);
    const smsData = await smsResponse.json();
    expect(smsData.deduplicated).toBe(true);
    expect(smsData.deduplicationReason).toBe('identical_within_window');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify only one notification record exists
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'billing_alert');

    expect(notifications.length).toBe(1);

    // But verify both email and SMS deliveries were attempted
    const { data: emailDeliveries } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', emailData.id)
      .eq('channel', 'email');

    const { data: smsDeliveries } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', emailData.id)
      .eq('channel', 'sms');

    expect(emailDeliveries.length).toBe(1);
    expect(smsDeliveries.length).toBe(1); // SMS should still be sent even if deduplicated
  });

  it('should not deduplicate critical notifications regardless of settings', async () => {
    const criticalNotification = {
      userId: testUserId,
      type: 'security_breach',
      priority: 'CRITICAL',
      title: 'CRITICAL: Security Breach Detected',
      message: 'Unauthorized access detected. Immediate action required.',
      channels: ['email', 'sms', 'push'],
      data: {
        severity: 'critical',
        breachType: 'unauthorized_access',
        affectedSystems: ['user-database']
      }
    };

    // Send first critical notification
    const firstResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criticalNotification)
    });

    expect(firstResponse.status).toBe(201);
    const firstData = await firstResponse.json();
    expect(firstData.deduplicated).toBe(false);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Send identical critical notification (should NOT be deduplicated)
    const secondResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(criticalNotification)
    });

    expect(secondResponse.status).toBe(201);
    const secondData = await secondResponse.json();
    expect(secondData.deduplicated).toBe(false); // Critical notifications bypass deduplication

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify both critical notifications were created
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'security_breach')
      .order('created_at', { ascending: true });

    expect(notifications.length).toBe(2);
    expect(notifications[0].priority).toBe('CRITICAL');
    expect(notifications[1].priority).toBe('CRITICAL');
  });

  it('should provide deduplication analytics and insights', async () => {
    // Create multiple notifications with various deduplication scenarios
    const notificationScenarios = [
      // Scenario 1: Identical notifications (will be deduplicated)
      {
        type: 'test_scenario_1',
        title: 'Identical Test',
        message: 'This will be deduplicated',
        count: 3
      },
      // Scenario 2: Similar notifications (will be merged)
      {
        type: 'test_scenario_2',
        title: 'Similar Test',
        message: 'This will be merged',
        count: 2
      },
      // Scenario 3: Unique notifications (no deduplication)
      {
        type: 'test_scenario_3',
        title: 'Unique Test',
        message: 'This will not be deduplicated',
        count: 1
      }
    ];

    // Send notifications for each scenario
    for (const scenario of notificationScenarios) {
      for (let i = 0; i < scenario.count; i++) {
        await fetch(`http://localhost:${port}/api/notifications/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: testUserId,
            type: scenario.type,
            priority: 'MEDIUM',
            title: scenario.title,
            message: `${scenario.message} - occurrence ${i + 1}`,
            channels: ['email'],
            data: {
              scenario: scenario.type,
              iteration: i
            }
          })
        });

        // Small delay between sends
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Wait for all processing to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get deduplication analytics
    const analyticsResponse = await fetch(`http://localhost:${port}/api/notifications/deduplication/analytics?userId=${testUserId}&period=1h`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(analyticsResponse.status).toBe(200);
    const analyticsData = await analyticsResponse.json();

    expect(analyticsData).toHaveProperty('summary');
    expect(analyticsData).toHaveProperty('deduplicationRate');
    expect(analyticsData).toHaveProperty('savingsMetrics');
    expect(analyticsData).toHaveProperty('topDuplicatedTypes');

    // Verify summary data
    expect(analyticsData.summary.totalNotificationsSent).toBe(6); // 3 + 2 + 1
    expect(analyticsData.summary.totalNotificationsCreated).toBe(3); // 1 per scenario due to deduplication
    expect(analyticsData.summary.notificationsDeduplicated).toBe(3); // 2 from scenario 1, 1 from scenario 2

    // Verify deduplication rate
    expect(analyticsData.deduplicationRate).toBe(50); // 3 deduplicated out of 6 total

    // Verify savings metrics
    expect(analyticsData.savingsMetrics.emailsSaved).toBeGreaterThan(0);
    expect(analyticsData.savingsMetrics.estimatedCostSavings).toBeGreaterThan(0);

    // Verify top duplicated types
    expect(analyticsData.topDuplicatedTypes.length).toBeGreaterThan(0);
    expect(analyticsData.topDuplicatedTypes[0]).toHaveProperty('notificationType');
    expect(analyticsData.topDuplicatedTypes[0]).toHaveProperty('duplicateCount');
  });

  it('should handle deduplication hash collisions gracefully', async () => {
    // Create notifications with potential hash collision scenarios
    const notification1 = {
      userId: testUserId,
      type: 'hash_test',
      priority: 'MEDIUM',
      title: 'Hash Test A',
      message: 'Testing hash collision scenario A',
      channels: ['email'],
      data: { scenario: 'A' }
    };

    const notification2 = {
      userId: testUserId,
      type: 'hash_test',
      priority: 'MEDIUM',
      title: 'Hash Test B',
      message: 'Testing hash collision scenario B',
      channels: ['email'],
      data: { scenario: 'B' }
    };

    // Send both notifications
    const response1 = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification1)
    });

    const response2 = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification2)
    });

    expect(response1.status).toBe(201);
    expect(response2.status).toBe(201);

    const data1 = await response1.json();
    const data2 = await response2.json();

    // Different notifications should not be deduplicated even if hash collision occurs
    expect(data1.deduplicated).toBe(false);
    expect(data2.deduplicated).toBe(false);
    expect(data1.deduplicationHash).not.toBe(data2.deduplicationHash);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify both notifications were created
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'hash_test')
      .order('created_at', { ascending: true });

    expect(notifications.length).toBe(2);
    expect(notifications[0].title).toBe('Hash Test A');
    expect(notifications[1].title).toBe('Hash Test B');
  });

  it('should support custom deduplication rules per notification type', async () => {
    // Setup custom deduplication rule for specific notification type
    await supabase.from('notification_deduplication_rules').upsert({
      user_id: testUserId,
      notification_type: 'custom_dedup_test',
      window_minutes: 10, // Longer window than default
      match_criteria: ['message'], // Only match on message, not title
      merge_threshold: 0.8, // Higher similarity threshold
      is_active: true
    });

    const baseNotification = {
      userId: testUserId,
      type: 'custom_dedup_test',
      priority: 'MEDIUM',
      message: 'Custom deduplication test message',
      channels: ['email'],
      data: { test: 'custom' }
    };

    // Send notification with different title but same message
    const notification1 = {
      ...baseNotification,
      title: 'First Title'
    };

    const notification2 = {
      ...baseNotification,
      title: 'Different Title' // Different title, same message
    };

    const response1 = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification1)
    });

    expect(response1.status).toBe(201);
    const data1 = await response1.json();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const response2 = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification2)
    });

    expect(response2.status).toBe(201);
    const data2 = await response2.json();

    // Should be deduplicated based on custom rule (matching message only)
    expect(data2.deduplicated).toBe(true);
    expect(data2.deduplicationReason).toBe('custom_rule_match');

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify only one notification exists
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'custom_dedup_test');

    expect(notifications.length).toBe(1);

    // Cleanup custom rule
    await supabase.from('notification_deduplication_rules').delete().eq('user_id', testUserId);
  });
});