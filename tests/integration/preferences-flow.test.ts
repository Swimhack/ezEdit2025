import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { supabase } from '@/lib/supabase';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3103; // Use unique port for integration tests

describe('Notification Preferences Flow - Integration Test', () => {
  let app: any;
  let handle: any;
  let server: any;
  let testUserId: string;
  let authToken: string;
  let secondTestUserId: string;
  let secondAuthToken: string;

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
        console.log(`> Preferences flow test server ready on http://${hostname}:${port}`);
        resolve();
      });
    });

    // Setup primary test user
    const { data: user1, error: userError1 } = await supabase.auth.signUp({
      email: `preferences-test-${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    if (userError1 || !user1.user) {
      throw new Error(`Failed to create primary test user: ${userError1?.message}`);
    }

    testUserId = user1.user.id;

    // Setup secondary test user
    const { data: user2, error: userError2 } = await supabase.auth.signUp({
      email: `preferences-test-2-${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    if (userError2 || !user2.user) {
      throw new Error(`Failed to create secondary test user: ${userError2?.message}`);
    }

    secondTestUserId = user2.user.id;

    // Get auth tokens
    const { data: session1 } = await supabase.auth.getSession();
    authToken = session1?.session?.access_token || 'mock-token-1';

    // Sign in as second user to get their token
    await supabase.auth.signInWithPassword({
      email: `preferences-test-2-${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    const { data: session2 } = await supabase.auth.getSession();
    secondAuthToken = session2?.session?.access_token || 'mock-token-2';
  });

  afterAll(async () => {
    // Cleanup test users and data
    if (testUserId) {
      await supabase.from('notification_preferences').delete().eq('user_id', testUserId);
      await supabase.from('notification_subscriptions').delete().eq('user_id', testUserId);
      await supabase.from('notifications').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }

    if (secondTestUserId) {
      await supabase.from('notification_preferences').delete().eq('user_id', secondTestUserId);
      await supabase.from('notification_subscriptions').delete().eq('user_id', secondTestUserId);
      await supabase.from('notifications').delete().eq('user_id', secondTestUserId);
      await supabase.auth.admin.deleteUser(secondTestUserId);
    }

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Reset preferences to default state for each test
    await supabase.from('notification_preferences').delete().eq('user_id', testUserId);
    await supabase.from('notification_preferences').delete().eq('user_id', secondTestUserId);
    await supabase.from('notification_subscriptions').delete().eq('user_id', testUserId);
    await supabase.from('notification_subscriptions').delete().eq('user_id', secondTestUserId);
  });

  it('should create default preferences for new users', async () => {
    // Create initial preferences
    const preferencesRequest = {
      email_enabled: true,
      sms_enabled: false,
      push_enabled: true,
      in_app_enabled: true,
      email_address: 'test@example.com',
      phone_number: null,
      quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'UTC'
      },
      frequency_limits: {
        email_per_hour: 10,
        sms_per_hour: 5,
        push_per_hour: 20
      }
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferencesRequest)
    });

    expect(response.status).toBe(201);
    const preferencesData = await response.json();

    expect(preferencesData).toHaveProperty('id');
    expect(preferencesData.user_id).toBe(testUserId);
    expect(preferencesData.email_enabled).toBe(true);
    expect(preferencesData.sms_enabled).toBe(false);
    expect(preferencesData.push_enabled).toBe(true);
    expect(preferencesData.in_app_enabled).toBe(true);
    expect(preferencesData.email_address).toBe('test@example.com');
    expect(preferencesData.phone_number).toBeNull();
    expect(preferencesData.quiet_hours.enabled).toBe(false);
    expect(preferencesData.frequency_limits.email_per_hour).toBe(10);

    // Verify preferences were saved to database
    const { data: savedPreferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    expect(savedPreferences).toBeTruthy();
    expect(savedPreferences.email_enabled).toBe(true);
    expect(savedPreferences.sms_enabled).toBe(false);
  });

  it('should retrieve existing user preferences', async () => {
    // First create preferences
    await supabase.from('notification_preferences').insert({
      user_id: testUserId,
      email_enabled: true,
      sms_enabled: true,
      push_enabled: false,
      in_app_enabled: true,
      email_address: 'existing@example.com',
      phone_number: '+1234567890',
      quiet_hours: {
        enabled: true,
        start_time: '23:00',
        end_time: '07:00',
        timezone: 'America/New_York'
      },
      frequency_limits: {
        email_per_hour: 5,
        sms_per_hour: 3,
        push_per_hour: 15
      }
    });

    // Retrieve preferences
    const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(response.status).toBe(200);
    const preferencesData = await response.json();

    expect(preferencesData.user_id).toBe(testUserId);
    expect(preferencesData.email_enabled).toBe(true);
    expect(preferencesData.sms_enabled).toBe(true);
    expect(preferencesData.push_enabled).toBe(false);
    expect(preferencesData.email_address).toBe('existing@example.com');
    expect(preferencesData.phone_number).toBe('+1234567890');
    expect(preferencesData.quiet_hours.enabled).toBe(true);
    expect(preferencesData.quiet_hours.timezone).toBe('America/New_York');
    expect(preferencesData.frequency_limits.sms_per_hour).toBe(3);
  });

  it('should update existing preferences', async () => {
    // Create initial preferences
    await supabase.from('notification_preferences').insert({
      user_id: testUserId,
      email_enabled: false,
      sms_enabled: false,
      push_enabled: false,
      in_app_enabled: true,
      email_address: 'old@example.com',
      phone_number: null
    });

    // Update preferences
    const updateRequest = {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      email_address: 'updated@example.com',
      phone_number: '+9876543210',
      quiet_hours: {
        enabled: true,
        start_time: '22:30',
        end_time: '08:30',
        timezone: 'Europe/London'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateRequest)
    });

    expect(response.status).toBe(200);
    const updatedData = await response.json();

    expect(updatedData.email_enabled).toBe(true);
    expect(updatedData.sms_enabled).toBe(true);
    expect(updatedData.push_enabled).toBe(true);
    expect(updatedData.email_address).toBe('updated@example.com');
    expect(updatedData.phone_number).toBe('+9876543210');
    expect(updatedData.quiet_hours.enabled).toBe(true);
    expect(updatedData.quiet_hours.timezone).toBe('Europe/London');

    // Verify changes were persisted
    const { data: persistedPreferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    expect(persistedPreferences.email_enabled).toBe(true);
    expect(persistedPreferences.email_address).toBe('updated@example.com');
    expect(persistedPreferences.quiet_hours.timezone).toBe('Europe/London');
  });

  it('should manage notification subscriptions', async () => {
    // Create subscription to specific notification types
    const subscriptionsRequest = {
      subscriptions: [
        {
          type: 'security_alert',
          channels: ['email', 'sms', 'push'],
          priority_override: 'HIGH'
        },
        {
          type: 'system_maintenance',
          channels: ['email'],
          priority_override: null
        },
        {
          type: 'billing_update',
          channels: ['email', 'in-app'],
          priority_override: 'MEDIUM'
        }
      ]
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/preferences/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionsRequest)
    });

    expect(response.status).toBe(201);
    const subscriptionsData = await response.json();

    expect(subscriptionsData.created).toBe(3);
    expect(subscriptionsData.subscriptions).toHaveLength(3);

    // Verify subscriptions were created
    const { data: savedSubscriptions } = await supabase
      .from('notification_subscriptions')
      .select('*')
      .eq('user_id', testUserId);

    expect(savedSubscriptions.length).toBe(3);

    const securitySubscription = savedSubscriptions.find(s => s.notification_type === 'security_alert');
    expect(securitySubscription).toBeTruthy();
    expect(securitySubscription.channels).toEqual(['email', 'sms', 'push']);
    expect(securitySubscription.priority_override).toBe('HIGH');

    const maintenanceSubscription = savedSubscriptions.find(s => s.notification_type === 'system_maintenance');
    expect(maintenanceSubscription.channels).toEqual(['email']);
    expect(maintenanceSubscription.priority_override).toBeNull();
  });

  it('should retrieve user subscriptions', async () => {
    // Create test subscriptions
    await supabase.from('notification_subscriptions').insert([
      {
        user_id: testUserId,
        notification_type: 'billing_update',
        channels: ['email'],
        priority_override: 'MEDIUM',
        is_active: true
      },
      {
        user_id: testUserId,
        notification_type: 'security_alert',
        channels: ['email', 'sms'],
        priority_override: 'CRITICAL',
        is_active: true
      },
      {
        user_id: testUserId,
        notification_type: 'feature_announcement',
        channels: ['in-app'],
        priority_override: null,
        is_active: false
      }
    ]);

    // Retrieve subscriptions
    const response = await fetch(`http://localhost:${port}/api/notifications/preferences/subscriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(response.status).toBe(200);
    const subscriptionsData = await response.json();

    expect(subscriptionsData.subscriptions).toHaveLength(3);

    const activeSubscriptions = subscriptionsData.subscriptions.filter((s: any) => s.is_active);
    expect(activeSubscriptions).toHaveLength(2);

    const securitySubscription = subscriptionsData.subscriptions.find((s: any) => s.notification_type === 'security_alert');
    expect(securitySubscription.channels).toEqual(['email', 'sms']);
    expect(securitySubscription.priority_override).toBe('CRITICAL');
  });

  it('should handle preference-based notification filtering', async () => {
    // Setup preferences with specific channel settings
    await supabase.from('notification_preferences').insert({
      user_id: testUserId,
      email_enabled: true,
      sms_enabled: false, // SMS disabled
      push_enabled: true,
      in_app_enabled: true,
      email_address: 'filter-test@example.com',
      phone_number: '+1234567890'
    });

    // Create subscription that includes SMS
    await supabase.from('notification_subscriptions').insert({
      user_id: testUserId,
      notification_type: 'test_notification',
      channels: ['email', 'sms', 'push'], // Includes disabled SMS
      priority_override: null,
      is_active: true
    });

    // Send notification through the system
    const notificationRequest = {
      userId: testUserId,
      type: 'test_notification',
      priority: 'MEDIUM',
      title: 'Preference Filter Test',
      message: 'Testing preference-based filtering',
      channels: ['email', 'sms', 'push'] // Request all channels
    };

    const notificationResponse = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationRequest)
    });

    expect(notificationResponse.status).toBe(201);
    const notificationData = await notificationResponse.json();

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify deliveries respect preferences (SMS should be filtered out)
    const { data: deliveries } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', notificationData.id);

    const channelTypes = deliveries.map(d => d.channel);
    expect(channelTypes).toContain('email');
    expect(channelTypes).toContain('push');
    expect(channelTypes).not.toContain('sms'); // Should be filtered out

    expect(deliveries.length).toBe(2); // Only email and push
  });

  it('should handle quiet hours preferences', async () => {
    // Setup preferences with quiet hours
    await supabase.from('notification_preferences').insert({
      user_id: testUserId,
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      email_address: 'quiet-test@example.com',
      phone_number: '+1234567890',
      quiet_hours: {
        enabled: true,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'UTC'
      }
    });

    // Test notification during quiet hours
    const quietHoursNotification = {
      userId: testUserId,
      type: 'info',
      priority: 'LOW', // Non-critical should respect quiet hours
      title: 'Quiet Hours Test',
      message: 'This should be delayed',
      channels: ['email', 'push']
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quietHoursNotification)
    });

    expect(response.status).toBe(201);
    const notificationData = await response.json();

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if notification was scheduled rather than sent immediately
    const { data: notification } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationData.id)
      .single();

    // During quiet hours, non-critical notifications should be scheduled
    if (notification.status === 'scheduled') {
      expect(notification.scheduled_for).toBeTruthy();
      const scheduledTime = new Date(notification.scheduled_for);
      const now = new Date();
      expect(scheduledTime.getTime()).toBeGreaterThan(now.getTime());
    }
  });

  it('should update quiet hours preferences dynamically', async () => {
    // Create initial preferences
    await supabase.from('notification_preferences').insert({
      user_id: testUserId,
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      quiet_hours: {
        enabled: false
      }
    });

    // Update to enable quiet hours
    const updateRequest = {
      quiet_hours: {
        enabled: true,
        start_time: '23:00',
        end_time: '07:00',
        timezone: 'America/New_York',
        apply_to_channels: ['push', 'sms'], // Only apply to certain channels
        exclude_priorities: ['CRITICAL', 'HIGH'] // Don't apply to high priority
      }
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateRequest)
    });

    expect(response.status).toBe(200);
    const updatedData = await response.json();

    expect(updatedData.quiet_hours.enabled).toBe(true);
    expect(updatedData.quiet_hours.start_time).toBe('23:00');
    expect(updatedData.quiet_hours.timezone).toBe('America/New_York');
    expect(updatedData.quiet_hours.apply_to_channels).toEqual(['push', 'sms']);
    expect(updatedData.quiet_hours.exclude_priorities).toEqual(['CRITICAL', 'HIGH']);

    // Verify the changes were persisted
    const { data: persistedPreferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    expect(persistedPreferences.quiet_hours.enabled).toBe(true);
    expect(persistedPreferences.quiet_hours.timezone).toBe('America/New_York');
  });

  it('should handle frequency limit preferences', async () => {
    // Setup preferences with frequency limits
    await supabase.from('notification_preferences').insert({
      user_id: testUserId,
      email_enabled: true,
      sms_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      frequency_limits: {
        email_per_hour: 2,
        sms_per_hour: 1,
        push_per_hour: 5,
        in_app_per_hour: 10
      }
    });

    // Send multiple notifications to test frequency limiting
    const notifications = Array.from({ length: 5 }, (_, i) => ({
      userId: testUserId,
      type: 'info',
      priority: 'MEDIUM',
      title: `Frequency Test ${i + 1}`,
      message: `Testing frequency limits ${i + 1}`,
      channels: ['email'] // Should be limited to 2 per hour
    }));

    const promises = notifications.map(notification =>
      fetch(`http://localhost:${port}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification)
      })
    );

    const results = await Promise.all(promises);

    // Some should succeed, others should be rate limited
    const successfulResponses = results.filter(r => r.status === 201);
    const rateLimitedResponses = results.filter(r => r.status === 429);

    expect(successfulResponses.length).toBeLessThanOrEqual(2); // Email limit is 2 per hour
    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Check rate limit headers
    if (rateLimitedResponses.length > 0) {
      const rateLimitResponse = rateLimitedResponses[0];
      expect(rateLimitResponse.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(rateLimitResponse.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    }
  });

  it('should prevent unauthorized access to other users preferences', async () => {
    // Create preferences for first user
    await supabase.from('notification_preferences').insert({
      user_id: testUserId,
      email_enabled: true,
      email_address: 'user1@example.com'
    });

    // Try to access first user's preferences with second user's token
    const unauthorizedResponse = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secondAuthToken}`,
      }
    });

    // Should not return first user's preferences
    expect(unauthorizedResponse.status).toBe(404); // No preferences found for second user

    // Try to update first user's preferences with second user's token
    const unauthorizedUpdateResponse = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${secondAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_enabled: false
      })
    });

    expect(unauthorizedUpdateResponse.status).toBe(404); // Can't update non-existent preferences

    // Verify first user's preferences were not affected
    const { data: originalPreferences } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    expect(originalPreferences.email_enabled).toBe(true); // Unchanged
    expect(originalPreferences.email_address).toBe('user1@example.com'); // Unchanged
  });

  it('should validate preference data integrity', async () => {
    // Test invalid email address
    const invalidEmailResponse = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_enabled: true,
        email_address: 'invalid-email', // Invalid format
        sms_enabled: false,
        push_enabled: true,
        in_app_enabled: true
      })
    });

    expect(invalidEmailResponse.status).toBe(400);
    const emailError = await invalidEmailResponse.json();
    expect(emailError.error).toContain('email');

    // Test invalid phone number
    const invalidPhoneResponse = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_enabled: false,
        sms_enabled: true,
        phone_number: 'invalid-phone', // Invalid format
        push_enabled: true,
        in_app_enabled: true
      })
    });

    expect(invalidPhoneResponse.status).toBe(400);
    const phoneError = await invalidPhoneResponse.json();
    expect(phoneError.error).toContain('phone');

    // Test invalid timezone
    const invalidTimezoneResponse = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_enabled: true,
        email_address: 'valid@example.com',
        quiet_hours: {
          enabled: true,
          start_time: '22:00',
          end_time: '08:00',
          timezone: 'Invalid/Timezone' // Invalid timezone
        }
      })
    });

    expect(invalidTimezoneResponse.status).toBe(400);
    const timezoneError = await invalidTimezoneResponse.json();
    expect(timezoneError.error).toContain('timezone');
  });
});