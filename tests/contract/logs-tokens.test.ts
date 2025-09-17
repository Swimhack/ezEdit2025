import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3003; // Use different port for testing

// Mock authentication for testing
const mockAuthToken = 'mock-bearer-token';

describe('POST /api/logs/tokens - Contract Test', () => {
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
    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Token',
        permissions: {
          levels: ['ERROR', 'CRITICAL'],
          sources: ['api', 'db']
        }
      })
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 403 when invalid authorization token is provided', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Token',
        permissions: {
          levels: ['ERROR', 'CRITICAL'],
          sources: ['api', 'db']
        }
      })
    });

    expect(response.status).toBe(403);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Forbidden');
  });

  it('should create log access token with valid request', async () => {
    const requestBody = {
      name: 'Test Token',
      permissions: {
        levels: ['ERROR', 'CRITICAL'],
        sources: ['api', 'db']
      },
      expiresIn: '24h'
    };

    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
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
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('url');
    expect(data).toHaveProperty('expiresAt');
    expect(typeof data.token).toBe('string');
    expect(typeof data.url).toBe('string');
    expect(typeof data.expiresAt).toBe('string');

    // Validate date format
    expect(() => new Date(data.expiresAt)).not.toThrow();
  });

  it('should require name field', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        permissions: {
          levels: ['ERROR', 'CRITICAL'],
          sources: ['api', 'db']
        }
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('name');
  });

  it('should require permissions field', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Token'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('permissions');
  });

  it('should validate name length', async () => {
    const longName = 'a'.repeat(101); // Exceeds 100 character limit

    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: longName,
        permissions: {
          levels: ['ERROR'],
          sources: ['api']
        }
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('name must be 100 characters or less');
  });

  it('should validate permission levels', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Token',
        permissions: {
          levels: ['INVALID_LEVEL'],
          sources: ['api']
        }
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid log level');
  });

  it('should accept valid log levels', async () => {
    const validLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Token',
        permissions: {
          levels: validLevels,
          sources: ['api']
        }
      })
    });

    expect(response.status).toBe(201);
  });

  it('should use default expiration when not provided', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Token',
        permissions: {
          levels: ['ERROR'],
          sources: ['api']
        }
      })
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('expiresAt');

    // Should default to 24h from now
    const expiresAt = new Date(data.expiresAt);
    const now = new Date();
    const timeDiff = expiresAt.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    expect(hoursDiff).toBeGreaterThan(23);
    expect(hoursDiff).toBeLessThan(25);
  });

  it('should validate expiresIn format', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Token',
        permissions: {
          levels: ['ERROR'],
          sources: ['api']
        },
        expiresIn: 'invalid-duration'
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid duration format');
  });

  it('should accept valid duration formats', async () => {
    const validDurations = ['1h', '24h', '7d', '30d'];

    for (const duration of validDurations) {
      const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Test Token ${duration}`,
          permissions: {
            levels: ['ERROR'],
            sources: ['api']
          },
          expiresIn: duration
        })
      });

      expect(response.status).toBe(201);
    }
  });

  it('should return 400 for invalid JSON', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
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
    const response = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
      },
      body: JSON.stringify({
        name: 'Test Token',
        permissions: {
          levels: ['ERROR'],
          sources: ['api']
        }
      })
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Content-Type must be application/json');
  });
});