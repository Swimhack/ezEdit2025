import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3004; // Use different port for testing

// Mock authentication for testing
const mockAuthToken = 'mock-bearer-token';

describe('POST /api/notifications/send - Contract Test', () => {
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
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification'
      })
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 403 when invalid authorization token is provided', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification'
      })
    });

    expect(response.status).toBe(403);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Forbidden');
  });

  it('should send notification with valid request', async () => {
    const requestBody = {
      userId: 'user123',
      type: 'info',
      priority: 'MEDIUM',
      title: 'Test Notification',
      message: 'This is a test notification',
      data: { key: 'value' },
      channels: ['email', 'in-app']
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('estimatedDelivery');
    expect(typeof data.id).toBe('string');
    expect(typeof data.status).toBe('string');
    expect(typeof data.estimatedDelivery).toBe('string');

    // Validate date format
    expect(() => new Date(data.estimatedDelivery)).not.toThrow();
  });

  it('should require userId field', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('userId');
  });

  it('should require type field', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        title: 'Test Notification',
        message: 'This is a test notification'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('type');
  });

  it('should require title field', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        message: 'This is a test notification'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('title');
  });

  it('should require message field', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('message');
  });

  it('should validate title length', async () => {
    const longTitle = 'a'.repeat(201); // Exceeds 200 character limit

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: longTitle,
        message: 'This is a test notification'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('title must be 200 characters or less');
  });

  it('should validate message length', async () => {
    const longMessage = 'a'.repeat(2001); // Exceeds 2000 character limit

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: longMessage
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('message must be 2000 characters or less');
  });

  it('should validate priority values', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        priority: 'INVALID_PRIORITY',
        title: 'Test Notification',
        message: 'This is a test notification'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid priority');
  });

  it('should accept valid priority values', async () => {
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    for (const priority of validPriorities) {
      const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user123',
          type: 'info',
          priority,
          title: 'Test Notification',
          message: 'This is a test notification'
        })
      });

      expect(response.status).toBe(201);
    }
  });

  it('should default priority to MEDIUM when not provided', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification'
      })
    });

    expect(response.status).toBe(201);
  });

  it('should validate channel values', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification',
        channels: ['invalid-channel']
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid channel');
  });

  it('should accept valid channel values', async () => {
    const validChannels = ['email', 'sms', 'push', 'in-app'];

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification',
        channels: validChannels
      })
    });

    expect(response.status).toBe(201);
  });

  it('should accept scheduledFor datetime', async () => {
    const scheduledFor = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification',
        scheduledFor
      })
    });

    expect(response.status).toBe(201);
  });

  it('should validate scheduledFor datetime format', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification',
        scheduledFor: 'invalid-date'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid scheduledFor format');
  });

  it('should accept custom data object', async () => {
    const customData = {
      actionUrl: 'https://example.com/action',
      category: 'user-action',
      metadata: { source: 'api' }
    };

    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification',
        data: customData
      })
    });

    expect(response.status).toBe(201);
  });

  it('should return 400 for invalid JSON', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: 'invalid json'
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid JSON');
  });

  it('should return 400 for missing content-type', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
      },
      body: JSON.stringify({
        userId: 'user123',
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test notification'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Content-Type must be application/json');
  });
});