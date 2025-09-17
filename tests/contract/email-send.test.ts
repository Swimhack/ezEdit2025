import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3007; // Use different port for testing

// Mock authentication for testing
const mockAuthToken = 'mock-bearer-token';

describe('POST /api/email/send - Contract Test', () => {
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

  it('should return 401 when no authorization header is provided', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('subject', 'Test Email');
    formData.append('htmlBody', '<p>This is a test email</p>');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 403 when invalid authorization token is provided', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('subject', 'Test Email');
    formData.append('htmlBody', '<p>This is a test email</p>');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token'
      },
      body: formData
    });

    expect(response.status).toBe(403);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Forbidden');
  });

  it('should send email with valid multipart/form-data request', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com', 'test2@example.com']));
    formData.append('cc', JSON.stringify(['cc@example.com']));
    formData.append('bcc', JSON.stringify(['bcc@example.com']));
    formData.append('subject', 'Test Email Subject');
    formData.append('htmlBody', '<h1>Test Email</h1><p>This is a test email with HTML content.</p>');
    formData.append('textBody', 'Test Email\nThis is a test email with plain text content.');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('messageId');
    expect(data).toHaveProperty('status');
    expect(typeof data.id).toBe('string');
    expect(typeof data.messageId).toBe('string');
    expect(typeof data.status).toBe('string');
  });

  it('should require to field', async () => {
    const formData = new FormData();
    formData.append('subject', 'Test Email');
    formData.append('htmlBody', '<p>This is a test email</p>');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('to field is required');
  });

  it('should require subject field', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('htmlBody', '<p>This is a test email</p>');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('subject field is required');
  });

  it('should validate email addresses in to field', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['invalid-email', 'valid@example.com']));
    formData.append('subject', 'Test Email');
    formData.append('htmlBody', '<p>This is a test email</p>');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid email address');
  });

  it('should validate email addresses in cc field', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('cc', JSON.stringify(['invalid-cc-email']));
    formData.append('subject', 'Test Email');
    formData.append('htmlBody', '<p>This is a test email</p>');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid email address');
  });

  it('should validate email addresses in bcc field', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('bcc', JSON.stringify(['invalid-bcc-email']));
    formData.append('subject', 'Test Email');
    formData.append('htmlBody', '<p>This is a test email</p>');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid email address');
  });

  it('should validate subject length', async () => {
    const longSubject = 'a'.repeat(201); // Exceeds 200 character limit

    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('subject', longSubject);
    formData.append('htmlBody', '<p>This is a test email</p>');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('subject must be 200 characters or less');
  });

  it('should accept email with template ID and template data', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('subject', 'Template Email');
    formData.append('templateId', 'welcome-email-template');
    formData.append('templateData', JSON.stringify({
      name: 'John Doe',
      company: 'Test Company',
      activationLink: 'https://example.com/activate'
    }));

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(201);
  });

  it('should accept email with file attachments', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('subject', 'Email with Attachments');
    formData.append('htmlBody', '<p>This email has attachments</p>');

    // Create mock file attachments
    const textFile = new Blob(['This is a text file'], { type: 'text/plain' });
    const pdfFile = new Blob(['%PDF-1.4 fake pdf content'], { type: 'application/pdf' });

    formData.append('attachments', textFile, 'document.txt');
    formData.append('attachments', pdfFile, 'report.pdf');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(201);
  });

  it('should return 413 when email size exceeds limit', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('subject', 'Large Email');

    // Create large content that exceeds 25MB limit
    const largeContent = 'a'.repeat(26 * 1024 * 1024); // 26MB
    formData.append('htmlBody', largeContent);

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(413);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Email exceeds 25MB limit');
  });

  it('should require either htmlBody, textBody, or templateId', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('subject', 'Test Email');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Either htmlBody, textBody, or templateId is required');
  });

  it('should validate JSON format for array fields', async () => {
    const formData = new FormData();
    formData.append('to', 'invalid-json-array');
    formData.append('subject', 'Test Email');
    formData.append('htmlBody', '<p>Test</p>');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid JSON format');
  });

  it('should validate templateData JSON format', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('subject', 'Test Email');
    formData.append('templateId', 'test-template');
    formData.append('templateData', 'invalid-json');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid templateData JSON format');
  });

  it('should handle both HTML and text body', async () => {
    const formData = new FormData();
    formData.append('to', JSON.stringify(['test@example.com']));
    formData.append('subject', 'Multi-format Email');
    formData.append('htmlBody', '<h1>HTML Version</h1><p>This is the HTML version</p>');
    formData.append('textBody', 'Text Version\nThis is the plain text version');

    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      },
      body: formData
    });

    expect(response.status).toBe(201);
  });

  it('should return 400 for non-multipart content type', async () => {
    const response = await fetch(`http://localhost:${port}/api/email/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: ['test@example.com'],
        subject: 'Test Email',
        htmlBody: '<p>Test</p>'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Content-Type must be multipart/form-data');
  });
});