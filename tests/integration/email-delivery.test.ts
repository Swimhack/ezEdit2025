import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { supabase } from '@/lib/supabase';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3104; // Use unique port for integration tests

describe('Email Delivery - Integration Test', () => {
  let app: any;
  let handle: any;
  let server: any;
  let testUserId: string;
  let authToken: string;

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
        console.log(`> Email delivery test server ready on http://${hostname}:${port}`);
        resolve();
      });
    });

    // Setup test user
    const { data: user, error: userError } = await supabase.auth.signUp({
      email: `email-delivery-test-${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    if (userError || !user.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }

    testUserId = user.user.id;

    // Get auth token
    const { data: session } = await supabase.auth.getSession();
    authToken = session?.session?.access_token || 'mock-token';
  });

  afterAll(async () => {
    // Cleanup test user and data
    if (testUserId) {
      await supabase.from('email_deliveries').delete().eq('user_id', testUserId);
      await supabase.from('email_templates').delete().eq('created_by', testUserId);
      await supabase.from('email_logs').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Clean up email data for fresh test state
    await supabase.from('email_deliveries').delete().eq('user_id', testUserId);
    await supabase.from('email_logs').delete().eq('user_id', testUserId);
  });

  it('should send email using Resend API with primary provider', async () => {
    // Test basic email sending
    const emailRequest = {
      to: 'test@example.com',
      subject: 'Integration Test Email',
      content: {
        text: 'This is a test email from the integration test suite.',
        html: '<p>This is a <strong>test email</strong> from the integration test suite.</p>'
      },
      from: {
        email: 'noreply@ezedit.co',
        name: 'EzEdit Test'
      },
      metadata: {
        testType: 'integration',
        userId: testUserId
      }
    };

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailRequest)
    });

    expect(response.status).toBe(200);
    const emailData = await response.json();

    expect(emailData).toHaveProperty('id');
    expect(emailData).toHaveProperty('status');
    expect(emailData).toHaveProperty('provider');
    expect(emailData.status).toBe('sent');
    expect(emailData.provider).toBe('resend');

    // Wait for async logging
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify email delivery was logged
    const { data: deliveryLog } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', emailData.id)
      .single();

    expect(deliveryLog).toBeTruthy();
    expect(deliveryLog.to_email).toBe('test@example.com');
    expect(deliveryLog.subject).toBe('Integration Test Email');
    expect(deliveryLog.provider).toBe('resend');
    expect(deliveryLog.status).toBe('sent');
    expect(deliveryLog.metadata.testType).toBe('integration');
  });

  it('should handle email sending with fallback provider', async () => {
    // Test email sending with forced fallback (simulate Resend failure)
    const emailRequest = {
      to: 'fallback-test@example.com',
      subject: 'Fallback Provider Test',
      content: {
        text: 'Testing fallback email provider functionality.',
        html: '<p>Testing <em>fallback</em> email provider functionality.</p>'
      },
      options: {
        forceFallback: true, // Force use of fallback provider
        priority: 'high'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailRequest)
    });

    expect(response.status).toBe(200);
    const emailData = await response.json();

    expect(emailData).toHaveProperty('id');
    expect(emailData.status).toBe('sent');
    expect(emailData.provider).toBe('fallback');

    // Wait for logging
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify fallback delivery was logged
    const { data: deliveryLog } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', emailData.id)
      .single();

    expect(deliveryLog.provider).toBe('fallback');
    expect(deliveryLog.priority).toBe('high');
  });

  it('should handle email templates and dynamic content', async () => {
    // First create an email template
    const templateRequest = {
      name: 'welcome-email',
      subject: 'Welcome to {{companyName}}!',
      html_content: '<h1>Welcome {{userName}}!</h1><p>Thank you for joining {{companyName}}. Your account is now active.</p>',
      text_content: 'Welcome {{userName}}! Thank you for joining {{companyName}}. Your account is now active.',
      variables: ['userName', 'companyName']
    };

    const templateResponse = await fetch(`http://localhost:${port}/api/email/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateRequest)
    });

    expect(templateResponse.status).toBe(201);
    const templateData = await templateResponse.json();
    expect(templateData).toHaveProperty('id');

    const templateId = templateData.id;

    // Send email using the template
    const templateEmailRequest = {
      to: 'template-test@example.com',
      templateId: templateId,
      variables: {
        userName: 'John Doe',
        companyName: 'EzEdit Technologies'
      },
      metadata: {
        templateUsage: true
      }
    };

    const emailResponse = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateEmailRequest)
    });

    expect(emailResponse.status).toBe(200);
    const emailData = await emailResponse.json();

    expect(emailData.status).toBe('sent');
    expect(emailData).toHaveProperty('renderedSubject');
    expect(emailData.renderedSubject).toBe('Welcome to EzEdit Technologies!');

    // Wait for logging
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify template usage was logged
    const { data: deliveryLog } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', emailData.id)
      .single();

    expect(deliveryLog.template_id).toBe(templateId);
    expect(deliveryLog.subject).toBe('Welcome to EzEdit Technologies!');
    expect(deliveryLog.metadata.templateUsage).toBe(true);

    // Cleanup template
    await supabase.from('email_templates').delete().eq('id', templateId);
  });

  it('should handle bulk email sending efficiently', async () => {
    // Test bulk email sending
    const bulkEmails = Array.from({ length: 5 }, (_, i) => ({
      to: `bulk-test-${i}@example.com`,
      subject: `Bulk Email ${i + 1}`,
      content: {
        text: `This is bulk email number ${i + 1}`,
        html: `<p>This is <strong>bulk email number ${i + 1}</strong></p>`
      },
      metadata: {
        bulkIndex: i,
        batchId: 'test-batch-1'
      }
    }));

    const bulkResponse = await fetch(`http://localhost:${port}/api/email/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emails: bulkEmails,
        options: {
          batchSize: 2, // Process in batches of 2
          delayBetweenBatches: 500 // 500ms delay between batches
        }
      })
    });

    expect(bulkResponse.status).toBe(200);
    const bulkData = await bulkResponse.json();

    expect(bulkData).toHaveProperty('batchId');
    expect(bulkData).toHaveProperty('totalEmails');
    expect(bulkData).toHaveProperty('batches');
    expect(bulkData.totalEmails).toBe(5);
    expect(bulkData.batches.length).toBe(3); // 5 emails in batches of 2 = 3 batches

    // Wait for bulk processing to complete
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verify all bulk emails were processed
    const { data: bulkDeliveries } = await supabase
      .from('email_deliveries')
      .select('*')
      .contains('metadata', { batchId: 'test-batch-1' });

    expect(bulkDeliveries.length).toBe(5);

    // Verify batch processing order
    bulkDeliveries.forEach((delivery, index) => {
      expect(delivery.to_email).toBe(`bulk-test-${delivery.metadata.bulkIndex}@example.com`);
      expect(delivery.status).toMatch(/^(sent|delivered)$/);
    });
  });

  it('should track email delivery status and webhooks', async () => {
    // Send an email to track
    const trackingEmailRequest = {
      to: 'tracking-test@example.com',
      subject: 'Delivery Tracking Test',
      content: {
        text: 'Testing email delivery tracking functionality.',
        html: '<p>Testing email delivery tracking functionality.</p>'
      },
      options: {
        trackDelivery: true,
        trackOpens: true,
        trackClicks: true
      }
    };

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trackingEmailRequest)
    });

    expect(response.status).toBe(200);
    const emailData = await response.json();
    const emailId = emailData.id;

    // Wait for initial processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check initial delivery status
    const statusResponse = await fetch(`http://localhost:${port}/api/email/${emailId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(statusResponse.status).toBe(200);
    const statusData = await statusResponse.json();

    expect(statusData).toHaveProperty('id', emailId);
    expect(statusData).toHaveProperty('status');
    expect(statusData).toHaveProperty('deliveryAttempts');
    expect(statusData).toHaveProperty('trackingEnabled');
    expect(statusData.trackingEnabled.delivery).toBe(true);
    expect(statusData.trackingEnabled.opens).toBe(true);
    expect(statusData.trackingEnabled.clicks).toBe(true);

    // Simulate webhook delivery status update
    const webhookPayload = {
      eventType: 'email.delivered',
      emailId: emailId,
      timestamp: new Date().toISOString(),
      data: {
        deliveredAt: new Date().toISOString(),
        recipientEmail: 'tracking-test@example.com',
        provider: 'resend'
      }
    };

    const webhookResponse = await fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'resend'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(webhookResponse.status).toBe(200);

    // Wait for webhook processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check updated delivery status
    const updatedStatusResponse = await fetch(`http://localhost:${port}/api/email/${emailId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    const updatedStatusData = await updatedStatusResponse.json();
    expect(updatedStatusData.status).toBe('delivered');
    expect(updatedStatusData.deliveredAt).toBeTruthy();
  });

  it('should handle email bounces and failures gracefully', async () => {
    // Send email to invalid address to trigger bounce
    const bounceEmailRequest = {
      to: 'invalid-email@nonexistent-domain-12345.com',
      subject: 'Bounce Test Email',
      content: {
        text: 'This email should bounce due to invalid recipient.',
        html: '<p>This email should bounce due to invalid recipient.</p>'
      },
      options: {
        handleBounces: true
      }
    };

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bounceEmailRequest)
    });

    expect(response.status).toBe(200);
    const emailData = await response.json();
    const emailId = emailData.id;

    // Wait for delivery attempt
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate bounce webhook
    const bounceWebhookPayload = {
      eventType: 'email.bounced',
      emailId: emailId,
      timestamp: new Date().toISOString(),
      data: {
        bounceType: 'permanent',
        bounceReason: 'mailbox_not_found',
        recipientEmail: 'invalid-email@nonexistent-domain-12345.com',
        diagnosticCode: '550 5.1.1 The email account that you tried to reach does not exist.'
      }
    };

    const bounceWebhookResponse = await fetch(`http://localhost:${port}/api/webhooks/email/delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'resend'
      },
      body: JSON.stringify(bounceWebhookPayload)
    });

    expect(bounceWebhookResponse.status).toBe(200);

    // Wait for bounce processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check bounce status
    const bounceStatusResponse = await fetch(`http://localhost:${port}/api/email/${emailId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    const bounceStatusData = await bounceStatusResponse.json();
    expect(bounceStatusData.status).toBe('bounced');
    expect(bounceStatusData.bounceType).toBe('permanent');
    expect(bounceStatusData.bounceReason).toBe('mailbox_not_found');

    // Verify bounce was logged for future reference
    const { data: bounceLog } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', emailId)
      .single();

    expect(bounceLog.status).toBe('bounced');
    expect(bounceLog.bounce_type).toBe('permanent');
    expect(bounceLog.error_message).toContain('mailbox_not_found');
  });

  it('should manage email rate limiting and quotas', async () => {
    // Test rate limiting by sending multiple emails rapidly
    const rateLimitEmails = Array.from({ length: 10 }, (_, i) => ({
      to: `rate-limit-test-${i}@example.com`,
      subject: `Rate Limit Test ${i + 1}`,
      content: {
        text: `Rate limit test email ${i + 1}`,
        html: `<p>Rate limit test email ${i + 1}</p>`
      }
    }));

    const rateLimitPromises = rateLimitEmails.map(email =>
      fetch(`http://localhost:${port}/api/email/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(email)
      })
    );

    const results = await Promise.all(rateLimitPromises);

    // Some requests should succeed, others might be rate limited
    const successfulRequests = results.filter(r => r.status === 200);
    const rateLimitedRequests = results.filter(r => r.status === 429);

    expect(successfulRequests.length).toBeGreaterThan(0);

    // If rate limiting is enforced, check headers
    if (rateLimitedRequests.length > 0) {
      const rateLimitResponse = rateLimitedRequests[0];
      expect(rateLimitResponse.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(rateLimitResponse.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      expect(rateLimitResponse.headers.get('X-RateLimit-Reset')).toBeTruthy();
    }

    // Check email quota endpoint
    const quotaResponse = await fetch(`http://localhost:${port}/api/email/quota`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(quotaResponse.status).toBe(200);
    const quotaData = await quotaResponse.json();

    expect(quotaData).toHaveProperty('dailyLimit');
    expect(quotaData).toHaveProperty('dailyUsed');
    expect(quotaData).toHaveProperty('monthlyLimit');
    expect(quotaData).toHaveProperty('monthlyUsed');
    expect(quotaData).toHaveProperty('remaining');
    expect(quotaData.dailyUsed).toBeGreaterThan(0);
  });

  it('should support email scheduling and delayed delivery', async () => {
    // Schedule email for future delivery
    const scheduledTime = new Date(Date.now() + 5000); // 5 seconds in the future

    const scheduledEmailRequest = {
      to: 'scheduled-test@example.com',
      subject: 'Scheduled Email Test',
      content: {
        text: 'This email was scheduled for future delivery.',
        html: '<p>This email was <em>scheduled</em> for future delivery.</p>'
      },
      scheduledFor: scheduledTime.toISOString(),
      metadata: {
        scheduled: true
      }
    };

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduledEmailRequest)
    });

    expect(response.status).toBe(200);
    const emailData = await response.json();

    expect(emailData.status).toBe('scheduled');
    expect(emailData.scheduledFor).toBe(scheduledTime.toISOString());

    // Wait for initial processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify email is in scheduled state
    const { data: scheduledDelivery } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', emailData.id)
      .single();

    expect(scheduledDelivery.status).toBe('scheduled');
    expect(scheduledDelivery.scheduled_for).toBeTruthy();

    // Wait for scheduled delivery time to pass
    await new Promise(resolve => setTimeout(resolve, 6000));

    // Check if email was sent after scheduled time
    const { data: deliveredEmail } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', emailData.id)
      .single();

    expect(deliveredEmail.status).toMatch(/^(sent|delivered)$/);
    expect(new Date(deliveredEmail.sent_at).getTime()).toBeGreaterThanOrEqual(scheduledTime.getTime());
  });

  it('should handle email attachments and content types', async () => {
    // Test email with attachments
    const attachmentEmailRequest = {
      to: 'attachment-test@example.com',
      subject: 'Email with Attachments',
      content: {
        text: 'This email contains attachments.',
        html: '<p>This email contains <strong>attachments</strong>.</p>'
      },
      attachments: [
        {
          filename: 'test-document.txt',
          content: 'VGhpcyBpcyBhIHRlc3QgZG9jdW1lbnQ=', // Base64 encoded "This is a test document"
          contentType: 'text/plain'
        },
        {
          filename: 'test-data.json',
          content: 'eyJ0ZXN0IjogInZhbHVlIn0=', // Base64 encoded '{"test": "value"}'
          contentType: 'application/json'
        }
      ],
      metadata: {
        hasAttachments: true
      }
    };

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attachmentEmailRequest)
    });

    expect(response.status).toBe(200);
    const emailData = await response.json();

    expect(emailData.status).toBe('sent');
    expect(emailData.attachmentCount).toBe(2);

    // Wait for logging
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify attachment information was logged
    const { data: deliveryLog } = await supabase
      .from('email_deliveries')
      .select('*')
      .eq('external_id', emailData.id)
      .single();

    expect(deliveryLog.attachment_count).toBe(2);
    expect(deliveryLog.metadata.hasAttachments).toBe(true);
  });
});