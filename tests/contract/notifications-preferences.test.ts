import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3005; // Use different port for testing

// Mock authentication for testing
const mockAuthToken = 'mock-bearer-token';

describe('GET/PUT /api/notifications/preferences - Contract Test', () => {
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

  describe('GET /api/notifications/preferences', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`);

      expect(response.status).toBe(401);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 403 when invalid authorization token is provided', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
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

    it('should return user notification preferences with valid authorization', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`
        }
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);

      // Validate structure of each preference
      data.forEach((preference: any) => {
        expect(preference).toHaveProperty('notificationType');
        expect(preference).toHaveProperty('enabled');
        expect(preference).toHaveProperty('channels');
        expect(preference).toHaveProperty('quietHours');
        expect(preference).toHaveProperty('frequency');

        expect(typeof preference.notificationType).toBe('string');
        expect(typeof preference.enabled).toBe('boolean');
        expect(typeof preference.channels).toBe('object');
        expect(typeof preference.quietHours).toBe('object');
        expect(['INSTANT', 'BATCHED_5MIN', 'BATCHED_HOURLY', 'DAILY_DIGEST']).toContain(preference.frequency);

        // Validate channels structure
        if (preference.channels) {
          expect(typeof preference.channels.email).toBe('boolean');
          expect(typeof preference.channels.sms).toBe('boolean');
          expect(typeof preference.channels.push).toBe('boolean');
          expect(typeof preference.channels.inApp).toBe('boolean');
        }

        // Validate quiet hours structure
        if (preference.quietHours) {
          expect(typeof preference.quietHours.start).toBe('string');
          expect(typeof preference.quietHours.end).toBe('string');
          expect(typeof preference.quietHours.timezone).toBe('string');

          // Validate time format (HH:MM)
          expect(preference.quietHours.start).toMatch(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
          expect(preference.quietHours.end).toMatch(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
        }
      });
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    it('should return 401 when no authorization header is provided', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            notificationType: 'email_digest',
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: false,
              inApp: true
            },
            quietHours: {
              start: '22:00',
              end: '08:00',
              timezone: 'UTC'
            },
            frequency: 'DAILY_DIGEST'
          }
        ])
      });

      expect(response.status).toBe(401);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 403 when invalid authorization token is provided', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            notificationType: 'email_digest',
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: false,
              inApp: true
            },
            quietHours: {
              start: '22:00',
              end: '08:00',
              timezone: 'UTC'
            },
            frequency: 'DAILY_DIGEST'
          }
        ])
      });

      expect(response.status).toBe(403);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Forbidden');
    });

    it('should update notification preferences with valid request', async () => {
      const preferences = [
        {
          notificationType: 'email_digest',
          enabled: true,
          channels: {
            email: true,
            sms: false,
            push: false,
            inApp: true
          },
          quietHours: {
            start: '22:00',
            end: '08:00',
            timezone: 'UTC'
          },
          frequency: 'DAILY_DIGEST'
        },
        {
          notificationType: 'security_alerts',
          enabled: true,
          channels: {
            email: true,
            sms: true,
            push: true,
            inApp: true
          },
          quietHours: {
            start: '23:00',
            end: '07:00',
            timezone: 'America/New_York'
          },
          frequency: 'INSTANT'
        }
      ];

      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('updated');
      expect(typeof data.updated).toBe('number');
      expect(data.updated).toBeGreaterThanOrEqual(0);
    });

    it('should validate frequency values', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            notificationType: 'test',
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: false,
              inApp: false
            },
            quietHours: {
              start: '22:00',
              end: '08:00',
              timezone: 'UTC'
            },
            frequency: 'INVALID_FREQUENCY'
          }
        ])
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid frequency');
    });

    it('should accept valid frequency values', async () => {
      const validFrequencies = ['INSTANT', 'BATCHED_5MIN', 'BATCHED_HOURLY', 'DAILY_DIGEST'];

      for (const frequency of validFrequencies) {
        const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${mockAuthToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            {
              notificationType: `test_${frequency}`,
              enabled: true,
              channels: {
                email: true,
                sms: false,
                push: false,
                inApp: false
              },
              quietHours: {
                start: '22:00',
                end: '08:00',
                timezone: 'UTC'
              },
              frequency
            }
          ])
        });

        expect(response.status).toBe(200);
      }
    });

    it('should validate quiet hours time format', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            notificationType: 'test',
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: false,
              inApp: false
            },
            quietHours: {
              start: 'invalid-time',
              end: '08:00',
              timezone: 'UTC'
            },
            frequency: 'INSTANT'
          }
        ])
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid time format');
    });

    it('should require array of preferences', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationType: 'test',
          enabled: true
        })
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Expected array of preferences');
    });

    it('should validate required fields in each preference', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          {
            enabled: true,
            channels: {
              email: true,
              sms: false,
              push: false,
              inApp: false
            }
            // Missing notificationType, quietHours, frequency
          }
        ])
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        method: 'PUT',
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
      const response = await fetch(`http://localhost:${port}/api/notifications/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${mockAuthToken}`,
        },
        body: JSON.stringify([])
      });

      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Content-Type must be application/json');
    });
  });
});