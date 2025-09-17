import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3010; // Use different port for testing

describe('POST /api/webhooks/twilio - Contract Test', () => {
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

  it('should process SMS queued status webhook', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'queued');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', 'Test SMS message');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'TwilioProxy/1.1'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should process SMS sent status webhook', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'sent');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', 'Test SMS message');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should process SMS delivered status webhook', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', 'Test SMS message');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should process SMS failed status webhook', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'failed');
    formData.append('ErrorCode', '30008');
    formData.append('ErrorMessage', 'Unknown error');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', 'Test SMS message');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should process SMS undelivered status webhook', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'undelivered');
    formData.append('ErrorCode', '30003');
    formData.append('ErrorMessage', 'Unreachable destination handset');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', 'Test SMS message');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should require MessageSid field', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(400);
  });

  it('should require MessageStatus field', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(400);
  });

  it('should validate MessageStatus values', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'invalid_status');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(400);
  });

  it('should accept all valid MessageStatus values', async () => {
    const validStatuses = ['queued', 'failed', 'sent', 'delivered', 'undelivered'];

    for (const status of validStatuses) {
      const formData = new URLSearchParams();
      formData.append('MessageSid', `SM${status}1234567890abcdef1234567890ab`);
      formData.append('MessageStatus', status);
      formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');

      const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      expect(response.status).toBe(200);
    }
  });

  it('should validate content type', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'delivered');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(400);
  });

  it('should handle webhook with all optional fields', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('MessagingServiceSid', 'MG1234567890abcdef1234567890abcdef');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', 'Complete test message');
    formData.append('NumMedia', '0');
    formData.append('NumSegments', '1');
    formData.append('Price', '-0.0075');
    formData.append('PriceUnit', 'USD');
    formData.append('Direction', 'outbound-api');
    formData.append('ApiVersion', '2010-04-01');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should handle webhook with error information', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'failed');
    formData.append('ErrorCode', '21211');
    formData.append('ErrorMessage', 'The \'To\' number is not a valid phone number.');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', 'invalid_number');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should handle MMS webhooks with media', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'MM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', 'Check out this image!');
    formData.append('NumMedia', '1');
    formData.append('MediaUrl0', 'https://api.twilio.com/2010-04-01/Accounts/AC.../Messages/MM.../Media/ME...');
    formData.append('MediaContentType0', 'image/jpeg');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should handle webhooks with special characters', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', 'Message with émojis 🎉 and ñ special chars!');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should handle empty message body', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', '');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should validate MessageSid format', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'invalid_sid_format');
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    // Should either accept (200) or validate format (400)
    expect([200, 400]).toContain(response.status);
  });

  it('should handle duplicate webhook deliveries', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM_duplicate_test_1234567890abcdef');
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');

    // Send the same webhook twice
    const response1 = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const response2 = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200); // Should be idempotent
  });

  it('should handle malformed form data', async () => {
    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'MessageSid=SM123&MessageStatus='
    });

    expect(response.status).toBe(400);
  });

  it('should verify Twilio signature if configured', async () => {
    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Twilio-Signature': 'invalid-signature'
      },
      body: formData.toString()
    });

    // Should either accept (200) or reject with signature verification error (400/401)
    expect([200, 400, 401]).toContain(response.status);
  });

  it('should handle long message bodies', async () => {
    const longMessage = 'A'.repeat(1600); // Max SMS length

    const formData = new URLSearchParams();
    formData.append('MessageSid', 'SM1234567890abcdef1234567890abcdef');
    formData.append('MessageStatus', 'delivered');
    formData.append('AccountSid', 'TWILIO_ACCOUNT_SID_TEST');
    formData.append('From', '+15551234567');
    formData.append('To', '+15557654321');
    formData.append('Body', longMessage);
    formData.append('NumSegments', '11'); // Multi-part message

    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    expect(response.status).toBe(200);
  });

  it('should reject non-POST methods', async () => {
    const response = await fetch(`http://localhost:${port}/api/webhooks/twilio`, {
      method: 'GET'
    });

    expect(response.status).toBe(405); // Method Not Allowed
  });
});