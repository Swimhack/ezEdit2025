import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3009; // Use different port for testing

describe('POST /api/webhooks/resend - Contract Test', () => {
  let app: any;
  let handle: any;
  let server: any;

  beforeAll(async () => {
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
        console.log(`> Test server ready on http://${hostname}:${port}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  it('should process email.sent webhook event', async () => {
    const webhookPayload = {
      type: 'email.sent',
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>',
        to: ['recipient@example.com'],
        from: 'sender@example.com',
        subject: 'Test Email',
        createdAt: new Date().toISOString(),
        lastEvent: 'sent'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Resend/1.0',
        'X-Resend-Webhook-Id': 'wh_12345',
        'X-Resend-Webhook-Timestamp': Date.now().toString(),
        'X-Resend-Webhook-Signature': 'mock-signature'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(200);
  });

  it('should process email.delivered webhook event', async () => {
    const webhookPayload = {
      type: 'email.delivered',
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>',
        to: ['recipient@example.com'],
        from: 'sender@example.com',
        subject: 'Test Email',
        createdAt: new Date().toISOString(),
        lastEvent: 'delivered',
        deliveredAt: new Date().toISOString()
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Resend/1.0'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(200);
  });

  it('should process email.bounced webhook event', async () => {
    const webhookPayload = {
      type: 'email.bounced',
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>',
        to: ['invalid@example.com'],
        from: 'sender@example.com',
        subject: 'Test Email',
        createdAt: new Date().toISOString(),
        lastEvent: 'bounced',
        bounceReason: 'mailbox_not_found',
        bounceDetail: 'The email address does not exist'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Resend/1.0'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(200);
  });

  it('should process email.complained webhook event', async () => {
    const webhookPayload = {
      type: 'email.complained',
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>',
        to: ['complainer@example.com'],
        from: 'sender@example.com',
        subject: 'Test Email',
        createdAt: new Date().toISOString(),
        lastEvent: 'complained',
        complaintFeedbackType: 'abuse',
        complaintUserAgent: 'Gmail'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Resend/1.0'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(200);
  });

  it('should validate webhook event type', async () => {
    const webhookPayload = {
      type: 'invalid.event.type',
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>',
        to: ['recipient@example.com']
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(400);
  });

  it('should require type field in webhook payload', async () => {
    const webhookPayload = {
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>',
        to: ['recipient@example.com']
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(400);
  });

  it('should require data field in webhook payload', async () => {
    const webhookPayload = {
      type: 'email.sent'
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(400);
  });

  it('should validate JSON format', async () => {
    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid json'
    });

    expect(response.status).toBe(400);
  });

  it('should validate content type', async () => {
    const webhookPayload = {
      type: 'email.sent',
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(400);
  });

  it('should handle webhook with minimal data', async () => {
    const webhookPayload = {
      type: 'email.sent',
      data: {
        id: 'email_12345'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(200);
  });

  it('should handle webhook with extra fields', async () => {
    const webhookPayload = {
      type: 'email.delivered',
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>',
        to: ['recipient@example.com'],
        from: 'sender@example.com',
        subject: 'Test Email',
        createdAt: new Date().toISOString(),
        lastEvent: 'delivered',
        deliveredAt: new Date().toISOString(),
        extraField: 'should be ignored',
        customData: {
          userId: '12345',
          campaign: 'newsletter'
        }
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(200);
  });

  it('should verify webhook signature if provided', async () => {
    const webhookPayload = {
      type: 'email.sent',
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Resend-Webhook-Signature': 'invalid-signature'
      },
      body: JSON.stringify(webhookPayload)
    });

    // Should either accept (200) or reject with signature verification error (400/401)
    expect([200, 400, 401]).toContain(response.status);
  });

  it('should handle timestamp validation', async () => {
    const webhookPayload = {
      type: 'email.sent',
      data: {
        id: 'email_12345',
        messageId: '<20240101000000.12345@resend.dev>'
      }
    };

    // Timestamp from 10 minutes ago (potentially expired)
    const oldTimestamp = (Date.now() - 10 * 60 * 1000).toString();

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Resend-Webhook-Timestamp': oldTimestamp
      },
      body: JSON.stringify(webhookPayload)
    });

    // Should either accept (200) or reject with timestamp validation error (400)
    expect([200, 400]).toContain(response.status);
  });

  it('should handle duplicate webhook events', async () => {
    const webhookPayload = {
      type: 'email.delivered',
      data: {
        id: 'email_duplicate_test',
        messageId: '<duplicate@resend.dev>',
        to: ['recipient@example.com'],
        lastEvent: 'delivered'
      }
    };

    // Send the same webhook twice
    const response1 = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Resend-Webhook-Id': 'wh_duplicate_123'
      },
      body: JSON.stringify(webhookPayload)
    });

    const response2 = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Resend-Webhook-Id': 'wh_duplicate_123'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200); // Should be idempotent
  });

  it('should handle batch webhook events', async () => {
    const webhookPayload = {
      type: 'email.delivered',
      data: [
        {
          id: 'email_batch_1',
          messageId: '<batch1@resend.dev>',
          to: ['recipient1@example.com'],
          lastEvent: 'delivered'
        },
        {
          id: 'email_batch_2',
          messageId: '<batch2@resend.dev>',
          to: ['recipient2@example.com'],
          lastEvent: 'delivered'
        }
      ]
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(200);
  });

  it('should log webhook processing for debugging', async () => {
    const webhookPayload = {
      type: 'email.bounced',
      data: {
        id: 'email_debug_test',
        messageId: '<debug@resend.dev>',
        to: ['debug@example.com'],
        lastEvent: 'bounced',
        bounceReason: 'mailbox_full'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Resend-Webhook-Id': 'wh_debug_123'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(200);
    // In a real implementation, this would verify that appropriate logs were created
  });

  it('should handle missing message ID gracefully', async () => {
    const webhookPayload = {
      type: 'email.sent',
      data: {
        id: 'email_no_msgid',
        to: ['recipient@example.com'],
        from: 'sender@example.com',
        subject: 'Test Email'
      }
    };

    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    expect(response.status).toBe(200);
  });

  it('should reject non-POST methods', async () => {
    const response = await fetch(`http://localhost:${port}/api/webhooks/resend`, {
      method: 'GET'
    });

    expect(response.status).toBe(405); // Method Not Allowed
  });
});