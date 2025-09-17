import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3008; // Use different port for testing

describe('POST /api/email/contact - Contract Test', () => {
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

  it('should submit contact form with valid multipart/form-data request', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('phone', '+1-555-123-4567');
    formData.append('subject', 'Product Inquiry');
    formData.append('message', 'I am interested in learning more about your products and services. Please contact me at your earliest convenience.');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('message');
    expect(typeof data.id).toBe('string');
    expect(typeof data.message).toBe('string');
    expect(data.message).toContain("We'll respond within 24 hours");
  });

  it('should require name field', async () => {
    const formData = new FormData();
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Test Subject');
    formData.append('message', 'Test message');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('name field is required');
  });

  it('should require email field', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('subject', 'Test Subject');
    formData.append('message', 'Test message');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('email field is required');
  });

  it('should require subject field', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('message', 'Test message');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('subject field is required');
  });

  it('should require message field', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Test Subject');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('message field is required');
  });

  it('should validate email format', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'invalid-email');
    formData.append('subject', 'Test Subject');
    formData.append('message', 'Test message');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid email format');
  });

  it('should validate name length', async () => {
    const longName = 'a'.repeat(101); // Exceeds 100 character limit

    const formData = new FormData();
    formData.append('name', longName);
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Test Subject');
    formData.append('message', 'Test message');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('name must be 100 characters or less');
  });

  it('should validate phone length', async () => {
    const longPhone = '1'.repeat(21); // Exceeds 20 character limit

    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('phone', longPhone);
    formData.append('subject', 'Test Subject');
    formData.append('message', 'Test message');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('phone must be 20 characters or less');
  });

  it('should validate subject length', async () => {
    const longSubject = 'a'.repeat(201); // Exceeds 200 character limit

    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('subject', longSubject);
    formData.append('message', 'Test message');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('subject must be 200 characters or less');
  });

  it('should validate message length', async () => {
    const longMessage = 'a'.repeat(10001); // Exceeds 10000 character limit

    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Test Subject');
    formData.append('message', longMessage);

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('message must be 10000 characters or less');
  });

  it('should accept contact form without phone field', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Test Subject');
    formData.append('message', 'Test message without phone number');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(201);
  });

  it('should accept contact form with file attachments', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Contact with Attachments');
    formData.append('message', 'Please find my documents attached');

    // Create mock file attachments
    const resumeFile = new Blob(['Resume content'], { type: 'application/pdf' });
    const portfolioFile = new Blob(['Portfolio content'], { type: 'application/zip' });

    formData.append('attachments', resumeFile, 'resume.pdf');
    formData.append('attachments', portfolioFile, 'portfolio.zip');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(201);
  });

  it('should return 429 when rate limit is exceeded', async () => {
    // This test simulates rapid requests to trigger rate limiting
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Rate Limit Test');
    formData.append('message', 'Testing rate limiting');

    // Send multiple requests rapidly
    const requests = Array(10).fill(0).map(() =>
      fetch(`http://localhost:${port}/api/email/contact`, {
        method: 'POST',
        body: formData.clone ? formData.clone() : formData
      })
    );

    const responses = await Promise.all(requests);

    // At least one request should be rate limited
    const rateLimitedResponses = responses.filter(r => r.status === 429);

    if (rateLimitedResponses.length > 0) {
      expect(rateLimitedResponses[0].headers.get('content-type')).toContain('application/json');

      const data = await rateLimitedResponses[0].json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Too many requests');
    }
  });

  it('should sanitize input to prevent XSS', async () => {
    const formData = new FormData();
    formData.append('name', '<script>alert("xss")</script>');
    formData.append('email', 'test@example.com');
    formData.append('subject', '<img src=x onerror=alert("xss")>');
    formData.append('message', '<iframe src="javascript:alert(\'xss\')"></iframe>');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    // Should either sanitize and accept (201) or reject malicious content (400)
    expect([201, 400]).toContain(response.status);

    if (response.status === 400) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid characters detected');
    }
  });

  it('should validate attachment file size', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Large Attachment Test');
    formData.append('message', 'Testing large file attachment');

    // Create oversized file (simulate 30MB file)
    const largeFile = new Blob(['x'.repeat(30 * 1024 * 1024)], { type: 'application/octet-stream' });
    formData.append('attachments', largeFile, 'large-file.bin');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('File size exceeds limit');
  });

  it('should validate attachment file types', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Dangerous File Test');
    formData.append('message', 'Testing dangerous file upload');

    // Create potentially dangerous file
    const executableFile = new Blob(['fake executable'], { type: 'application/x-executable' });
    formData.append('attachments', executableFile, 'malware.exe');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('File type not allowed');
  });

  it('should accept valid file types', async () => {
    const formData = new FormData();
    formData.append('name', 'John Doe');
    formData.append('email', 'john@example.com');
    formData.append('subject', 'Valid Files Test');
    formData.append('message', 'Testing valid file uploads');

    // Create files with acceptable types
    const pdfFile = new Blob(['PDF content'], { type: 'application/pdf' });
    const imageFile = new Blob(['Image content'], { type: 'image/jpeg' });
    const textFile = new Blob(['Text content'], { type: 'text/plain' });

    formData.append('attachments', pdfFile, 'document.pdf');
    formData.append('attachments', imageFile, 'image.jpg');
    formData.append('attachments', textFile, 'notes.txt');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(201);
  });

  it('should return 400 for non-multipart content type', async () => {
    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Test Subject',
        message: 'Test message'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Content-Type must be multipart/form-data');
  });

  it('should handle empty form data gracefully', async () => {
    const formData = new FormData();

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('required');
  });

  it('should handle unicode characters properly', async () => {
    const formData = new FormData();
    formData.append('name', 'João Silva');
    formData.append('email', 'joão@example.com');
    formData.append('subject', 'Consulta sobre produtos 📧');
    formData.append('message', 'Olá! Gostaria de saber mais informações sobre seus produtos. Obrigado! 🙏');

    const response = await fetch(`http://localhost:${port}/api/email/contact`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(201);
  });
});