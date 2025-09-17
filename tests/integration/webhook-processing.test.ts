import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3106; // Use unique port for integration tests

describe('Webhook Processing - Integration Test', () => {
  let app: any;
  let handle: any;
  let server: any;
  let testUserId: string;
  let authToken: string;
  let webhookSecret: string;

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
        console.log(`> Webhook processing test server ready on http://${hostname}:${port}`);
        resolve();
      });
    });

    // Setup test user
    const { data: user, error: userError } = await supabase.auth.signUp({
      email: `webhook-test-${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    if (userError || !user.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }

    testUserId = user.user.id;

    // Get auth token
    const { data: session } = await supabase.auth.getSession();
    authToken = session?.session?.access_token || 'mock-token';

    // Setup webhook configuration
    webhookSecret = 'test-webhook-secret-key-' + Date.now();

    // Configure webhook endpoints in database
    await supabase.from('webhook_endpoints').upsert([
      {
        name: 'resend-email-webhook',
        url: `http://localhost:${port}/api/webhooks/email/delivery`,
        provider: 'resend',
        events: ['email.sent', 'email.delivered', 'email.bounced', 'email.complaint'],
        secret: webhookSecret,
        is_active: true
      },
      {
        name: 'twilio-sms-webhook',
        url: `http://localhost:${port}/api/webhooks/sms/delivery`,
        provider: 'twilio',
        events: ['sms.sent', 'sms.delivered', 'sms.failed'],
        secret: webhookSecret,
        is_active: true
      }
    ]);
  });

  afterAll(async () => {
    // Cleanup test user and data
    if (testUserId) {
      await supabase.from('webhook_logs').delete().contains('metadata', { testUserId });
      await supabase.from('email_deliveries').delete().eq('user_id', testUserId);
      await supabase.from('sms_deliveries').delete().eq('user_id', testUserId);
      await supabase.from('notifications').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }

    // Cleanup webhook endpoints
    await supabase.from('webhook_endpoints').delete().like('name', '%webhook%');

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Clean up webhook logs and delivery data for fresh test state
    await supabase.from('webhook_logs').delete().contains('metadata', { testUserId });
    await supabase.from('email_deliveries').delete().eq('user_id', testUserId);
    await supabase.from('sms_deliveries').delete().eq('user_id', testUserId);
  });

  const createWebhookSignature = (payload: string, secret: string): string => {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  };

  it('should process Resend email delivery webhooks', async () => {
    // First create an email delivery to reference
    const { data: emailDelivery } = await supabase.from('email_deliveries').insert({
      user_id: testUserId,
      external_id: 'resend-email-123',
      to_email: 'test@example.com',
      subject: 'Test Email',
      provider: 'resend',
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: { testUserId }
    }).select().single();

    // Test email delivered webhook
    const deliveredPayload = {
      event: 'email.delivered',
      data: {
        email_id: 'resend-email-123',
        to: 'test@example.com',
        subject: 'Test Email',
        delivered_at: new Date().toISOString(),
        message_id: 'msg_123456789',
        provider_response: {
          smtp_code: 250,
          message: 'Message delivered successfully'
        }
      },
      created_at: new Date().toISOString()
    };

    const payloadString = JSON.stringify(deliveredPayload);
    const signature = createWebhookSignature(payloadString, webhookSecret);

    const response = await fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Source': 'resend'
      },
      body: payloadString
    });

    expect(response.status).toBe(200);
    const webhookResponse = await response.json();
    expect(webhookResponse.processed).toBe(true);
    expect(webhookResponse.eventType).toBe('email.delivered');

    // Wait for async processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify email delivery status was updated
    const { data: updatedDelivery } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', 'resend-email-123')
      .single();

    expect(updatedDelivery.status).toBe('delivered');
    expect(updatedDelivery.delivered_at).toBeTruthy();
    expect(updatedDelivery.provider_response.smtp_code).toBe(250);

    // Verify webhook was logged
    const { data: webhookLog } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('provider', 'resend')
      .eq('event_type', 'email.delivered')
      .contains('payload', { data: { email_id: 'resend-email-123' } })
      .single();

    expect(webhookLog).toBeTruthy();
    expect(webhookLog.status).toBe('processed');
    expect(webhookLog.processed_at).toBeTruthy();
  });

  it('should handle email bounce webhooks and update status', async () => {
    // Create an email delivery that will bounce
    const { data: emailDelivery } = await supabase.from('email_deliveries').insert({
      user_id: testUserId,
      external_id: 'resend-email-bounce-456',
      to_email: 'bounce@invalid-domain.com',
      subject: 'Bouncing Email Test',
      provider: 'resend',
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: { testUserId }
    }).select().single();

    // Send bounce webhook
    const bouncePayload = {
      event: 'email.bounced',
      data: {
        email_id: 'resend-email-bounce-456',
        to: 'bounce@invalid-domain.com',
        bounced_at: new Date().toISOString(),
        bounce_type: 'permanent',
        bounce_subtype: 'no_email',
        diagnostic_code: '550 5.1.1 The email account that you tried to reach does not exist.',
        feedback_id: 'bounce_123456789'
      },
      created_at: new Date().toISOString()
    };

    const payloadString = JSON.stringify(bouncePayload);
    const signature = createWebhookSignature(payloadString, webhookSecret);

    const response = await fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Source': 'resend'
      },
      body: payloadString
    });

    expect(response.status).toBe(200);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify bounce was processed
    const { data: bouncedDelivery } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', 'resend-email-bounce-456')
      .single();

    expect(bouncedDelivery.status).toBe('bounced');
    expect(bouncedDelivery.bounce_type).toBe('permanent');
    expect(bouncedDelivery.bounce_subtype).toBe('no_email');
    expect(bouncedDelivery.error_message).toContain('does not exist');

    // Verify bounce was logged in webhook logs
    const { data: bounceLog } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('event_type', 'email.bounced')
      .contains('payload', { data: { email_id: 'resend-email-bounce-456' } })
      .single();

    expect(bounceLog.status).toBe('processed');
  });

  it('should process Twilio SMS delivery webhooks', async () => {
    // Create an SMS delivery to reference
    const { data: smsDelivery } = await supabase.from('sms_deliveries').insert({
      user_id: testUserId,
      external_id: 'twilio-sms-789',
      to_phone: '+1234567890',
      message: 'Test SMS message',
      provider: 'twilio',
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: { testUserId }
    }).select().single();

    // Test SMS delivered webhook
    const smsDeliveredPayload = {
      MessageSid: 'twilio-sms-789',
      MessageStatus: 'delivered',
      To: '+1234567890',
      From: '+1987654321',
      Body: 'Test SMS message',
      DateSent: new Date().toISOString(),
      DateUpdated: new Date().toISOString(),
      NumSegments: '1',
      Price: '-0.0075',
      PriceUnit: 'USD'
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/sms/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Webhook-Source': 'twilio'
      },
      body: new URLSearchParams(smsDeliveredPayload).toString()
    });

    expect(response.status).toBe(200);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify SMS delivery status was updated
    const { data: updatedSmsDelivery } = await supabase
      .from('sms_deliveries')
      .select('*')
      .eq('external_id', 'twilio-sms-789')
      .single();

    expect(updatedSmsDelivery.status).toBe('delivered');
    expect(updatedSmsDelivery.delivered_at).toBeTruthy();
    expect(updatedSmsDelivery.provider_response.price).toBe('-0.0075');
    expect(updatedSmsDelivery.provider_response.segments).toBe(1);

    // Verify webhook was logged
    const { data: smsWebhookLog } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('provider', 'twilio')
      .eq('event_type', 'sms.delivered')
      .contains('payload', { MessageSid: 'twilio-sms-789' })
      .single();

    expect(smsWebhookLog.status).toBe('processed');
  });

  it('should handle SMS failure webhooks', async () => {
    // Create an SMS delivery that will fail
    const { data: smsDelivery } = await supabase.from('sms_deliveries').insert({
      user_id: testUserId,
      external_id: 'twilio-sms-failed-999',
      to_phone: '+1000000000',
      message: 'Test SMS that will fail',
      provider: 'twilio',
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: { testUserId }
    }).select().single();

    // Send SMS failed webhook
    const smsFailedPayload = {
      MessageSid: 'twilio-sms-failed-999',
      MessageStatus: 'failed',
      To: '+1000000000',
      From: '+1987654321',
      Body: 'Test SMS that will fail',
      ErrorCode: '30003',
      ErrorMessage: 'Unreachable destination handset',
      DateSent: new Date().toISOString(),
      DateUpdated: new Date().toISOString()
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/sms/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Webhook-Source': 'twilio'
      },
      body: new URLSearchParams(smsFailedPayload).toString()
    });

    expect(response.status).toBe(200);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify SMS failure was processed
    const { data: failedSmsDelivery } = await supabase
      .from('sms_deliveries')
      .select('*')
      .eq('external_id', 'twilio-sms-failed-999')
      .single();

    expect(failedSmsDelivery.status).toBe('failed');
    expect(failedSmsDelivery.error_code).toBe('30003');
    expect(failedSmsDelivery.error_message).toBe('Unreachable destination handset');
    expect(failedSmsDelivery.failed_at).toBeTruthy();
  });

  it('should validate webhook signatures and reject invalid ones', async () => {
    // Test with invalid signature
    const invalidPayload = {
      event: 'email.delivered',
      data: {
        email_id: 'invalid-signature-test',
        to: 'test@example.com'
      }
    };

    const payloadString = JSON.stringify(invalidPayload);
    const invalidSignature = 'sha256=invalid_signature_hash';

    const invalidResponse = await fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': invalidSignature,
        'X-Webhook-Source': 'resend'
      },
      body: payloadString
    });

    expect(invalidResponse.status).toBe(401);
    const invalidError = await invalidResponse.json();
    expect(invalidError.error).toContain('Invalid signature');

    // Test with missing signature
    const missingSignatureResponse = await fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'resend'
      },
      body: payloadString
    });

    expect(missingSignatureResponse.status).toBe(401);

    // Test with valid signature
    const validSignature = createWebhookSignature(payloadString, webhookSecret);
    const validResponse = await fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${validSignature}`,
        'X-Webhook-Source': 'resend'
      },
      body: payloadString
    });

    expect(validResponse.status).toBe(200);
  });

  it('should handle webhook retries and idempotency', async () => {
    // Create email delivery for testing
    const { data: emailDelivery } = await supabase.from('email_deliveries').insert({
      user_id: testUserId,
      external_id: 'resend-email-retry-123',
      to_email: 'retry@example.com',
      subject: 'Retry Test Email',
      provider: 'resend',
      status: 'sent',
      sent_at: new Date().toISOString(),
      metadata: { testUserId }
    }).select().single();

    const retryPayload = {
      event: 'email.delivered',
      data: {
        email_id: 'resend-email-retry-123',
        to: 'retry@example.com',
        delivered_at: new Date().toISOString(),
        message_id: 'retry_msg_123',
      },
      created_at: new Date().toISOString(),
      webhook_id: 'unique-webhook-id-123' // Used for idempotency
    };

    const payloadString = JSON.stringify(retryPayload);
    const signature = createWebhookSignature(payloadString, webhookSecret);

    // Send the same webhook multiple times (simulating retries)
    const retryPromises = Array.from({ length: 3 }, () =>
      fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': `sha256=${signature}`,
          'X-Webhook-Source': 'resend',
          'X-Webhook-ID': 'unique-webhook-id-123'
        },
        body: payloadString
      })
    );

    const results = await Promise.all(retryPromises);

    // All should succeed (200) due to idempotency
    results.forEach(result => {
      expect(result.status).toBe(200);
    });

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify only one webhook log entry exists (idempotency working)
    const { data: webhookLogs } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('webhook_id', 'unique-webhook-id-123');

    expect(webhookLogs.length).toBe(1);

    // Verify delivery was only updated once
    const { data: delivery } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', 'resend-email-retry-123')
      .single();

    expect(delivery.status).toBe('delivered');
  });

  it('should handle webhook processing failures gracefully', async () => {
    // Send webhook with malformed data to trigger processing error
    const malformedPayload = {
      event: 'email.delivered',
      data: {
        // Missing required email_id field
        to: 'malformed@example.com',
        delivered_at: 'invalid-date-format'
      }
    };

    const payloadString = JSON.stringify(malformedPayload);
    const signature = createWebhookSignature(payloadString, webhookSecret);

    const response = await fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Source': 'resend'
      },
      body: payloadString
    });

    expect(response.status).toBe(400);
    const errorResponse = await response.json();
    expect(errorResponse.error).toBeTruthy();

    // Wait for error logging
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify error was logged
    const { data: errorLog } = await supabase
      .from('webhook_logs')
      .select('*')
      .eq('status', 'failed')
      .contains('payload', { event: 'email.delivered' })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(errorLog).toBeTruthy();
    expect(errorLog.error_message).toBeTruthy();
    expect(errorLog.retry_count).toBe(0);
  });

  it('should trigger notifications based on webhook events', async () => {
    // Create notification subscription for delivery events
    await supabase.from('notification_subscriptions').insert({
      user_id: testUserId,
      notification_type: 'delivery_status',
      channels: ['email', 'in-app'],
      is_active: true,
      filters: {
        providers: ['resend'],
        event_types: ['email.bounced', 'email.complaint']
      }
    });

    // Create email delivery
    const { data: emailDelivery } = await supabase.from('email_deliveries').insert({
      user_id: testUserId,
      external_id: 'resend-email-complaint-456',
      to_email: 'complaint@example.com',
      subject: 'Email that will generate complaint',
      provider: 'resend',
      status: 'delivered',
      sent_at: new Date().toISOString(),
      metadata: { testUserId }
    }).select().single();

    // Send complaint webhook
    const complaintPayload = {
      event: 'email.complaint',
      data: {
        email_id: 'resend-email-complaint-456',
        to: 'complaint@example.com',
        complaint_type: 'spam',
        complaint_subtype: 'bulk',
        feedback_id: 'complaint_123456789',
        complained_at: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    const payloadString = JSON.stringify(complaintPayload);
    const signature = createWebhookSignature(payloadString, webhookSecret);

    const response = await fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Source': 'resend'
      },
      body: payloadString
    });

    expect(response.status).toBe(200);

    // Wait for processing and notification generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify notification was created
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('type', 'delivery_status')
      .contains('data', { eventType: 'email.complaint' });

    expect(notifications.length).toBeGreaterThan(0);
    const notification = notifications[0];
    expect(notification.title).toContain('Email Complaint');
    expect(notification.message).toContain('complaint@example.com');
    expect(notification.priority).toBe('HIGH'); // Complaints should be high priority
  });

  it('should provide webhook analytics and monitoring', async () => {
    // Create multiple webhook events for analytics
    const webhookEvents = [
      { event: 'email.sent', status: 'processed' },
      { event: 'email.delivered', status: 'processed' },
      { event: 'email.bounced', status: 'processed' },
      { event: 'sms.delivered', status: 'processed' },
      { event: 'email.delivered', status: 'failed' }
    ];

    // Insert webhook logs directly for analytics testing
    const webhookLogs = webhookEvents.map((event, index) => ({
      provider: event.event.startsWith('email') ? 'resend' : 'twilio',
      event_type: event.event,
      status: event.status,
      webhook_id: `analytics-webhook-${index}`,
      payload: { event: event.event, data: { id: `test-${index}` } },
      processed_at: event.status === 'processed' ? new Date().toISOString() : null,
      error_message: event.status === 'failed' ? 'Processing error' : null,
      created_at: new Date().toISOString()
    }));

    await supabase.from('webhook_logs').insert(webhookLogs);

    // Get webhook analytics
    const analyticsResponse = await fetch(`http://localhost:${port}/api/webhooks/analytics?period=1h`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(analyticsResponse.status).toBe(200);
    const analyticsData = await analyticsResponse.json();

    expect(analyticsData).toHaveProperty('summary');
    expect(analyticsData).toHaveProperty('byProvider');
    expect(analyticsData).toHaveProperty('byEventType');
    expect(analyticsData).toHaveProperty('successRate');

    // Verify summary data
    expect(analyticsData.summary.totalWebhooks).toBe(5);
    expect(analyticsData.summary.successfulWebhooks).toBe(4);
    expect(analyticsData.summary.failedWebhooks).toBe(1);

    // Verify provider breakdown
    expect(analyticsData.byProvider).toHaveProperty('resend');
    expect(analyticsData.byProvider).toHaveProperty('twilio');

    // Verify success rate calculation
    expect(analyticsData.successRate).toBe(80); // 4 out of 5 successful
  });
});