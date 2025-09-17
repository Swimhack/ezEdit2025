import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001; // Use different port for testing

// Mock authentication for testing
const mockAuthToken = 'mock-bearer-token';

describe('GET /api/logs/stream - Contract Test', () => {
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
    const response = await fetch(`http://localhost:${port}/api/logs/stream`);

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 403 when invalid authorization token is provided', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/stream`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect(response.status).toBe(403);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Forbidden');
  });

  it('should return SSE stream with valid authorization', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/stream`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    expect(response.headers.get('cache-control')).toBe('no-cache');
    expect(response.headers.get('connection')).toBe('keep-alive');
  });

  it('should accept level query parameter', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/stream?level=ERROR`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
  });

  it('should accept source query parameter', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/stream?source=api`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
  });

  it('should accept since query parameter with valid datetime', async () => {
    const since = new Date().toISOString();
    const response = await fetch(`http://localhost:${port}/api/logs/stream?since=${encodeURIComponent(since)}`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/event-stream');
  });

  it('should validate level parameter values', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/stream?level=INVALID`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid level parameter');
  });

  it('should validate since parameter format', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/stream?since=invalid-date`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid since parameter');
  });

  it('should return proper CORS headers for browser compatibility', async () => {
    const response = await fetch(`http://localhost:${port}/api/logs/stream`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`,
        'Origin': 'http://localhost:3000'
      }
    });

    expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
  });
});