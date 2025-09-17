import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3006; // Use different port for testing

// Mock authentication for testing
const mockAuthToken = 'mock-bearer-token';

// Mock notification IDs for testing
const validNotificationId = 'notif_12345';
const invalidNotificationId = 'invalid_id';
const nonExistentNotificationId = 'notif_99999';

describe('GET /api/notifications/{id}/status - Contract Test', () => {
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
    const response = await fetch(`http://localhost:${port}/api/notifications/${validNotificationId}/status`);

    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Unauthorized');
  });

  it('should return 403 when invalid authorization token is provided', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/${validNotificationId}/status`, {
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

  it('should return notification delivery status with valid request', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/${validNotificationId}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('deliveries');

    expect(typeof data.id).toBe('string');
    expect(typeof data.status).toBe('string');
    expect(Array.isArray(data.deliveries)).toBe(true);

    // Validate delivery status structure
    data.deliveries.forEach((delivery: any) => {
      expect(delivery).toHaveProperty('channel');
      expect(delivery).toHaveProperty('status');
      expect(delivery).toHaveProperty('sentAt');

      expect(['EMAIL', 'SMS', 'PUSH', 'IN_APP']).toContain(delivery.channel);
      expect(['PENDING', 'SENT', 'DELIVERED', 'FAILED']).toContain(delivery.status);
      expect(typeof delivery.sentAt).toBe('string');

      // Validate date format
      expect(() => new Date(delivery.sentAt)).not.toThrow();

      // Optional fields validation
      if (delivery.deliveredAt) {
        expect(typeof delivery.deliveredAt).toBe('string');
        expect(() => new Date(delivery.deliveredAt)).not.toThrow();
      }

      if (delivery.errorMessage) {
        expect(typeof delivery.errorMessage).toBe('string');
      }
    });
  });

  it('should return 404 for non-existent notification ID', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/${nonExistentNotificationId}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Notification not found');
  });

  it('should return 400 for invalid notification ID format', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/${invalidNotificationId}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid notification ID format');
  });

  it('should return status for notification with multiple delivery channels', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/${validNotificationId}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.deliveries.length).toBeGreaterThan(0);

    // Check that different channels can be present
    const channels = data.deliveries.map((d: any) => d.channel);
    const uniqueChannels = [...new Set(channels)];
    expect(uniqueChannels.length).toBeGreaterThanOrEqual(1);
  });

  it('should return status for notification with failed deliveries', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/${validNotificationId}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Check if any delivery failed and has error message
    const failedDeliveries = data.deliveries.filter((d: any) => d.status === 'FAILED');
    failedDeliveries.forEach((delivery: any) => {
      expect(delivery).toHaveProperty('errorMessage');
      expect(typeof delivery.errorMessage).toBe('string');
      expect(delivery.errorMessage.length).toBeGreaterThan(0);
    });
  });

  it('should return status for notification with successful deliveries', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/${validNotificationId}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Check if any delivery was delivered and has deliveredAt timestamp
    const deliveredDeliveries = data.deliveries.filter((d: any) => d.status === 'DELIVERED');
    deliveredDeliveries.forEach((delivery: any) => {
      expect(delivery).toHaveProperty('deliveredAt');
      expect(typeof delivery.deliveredAt).toBe('string');

      // Validate that deliveredAt is after sentAt
      const sentAt = new Date(delivery.sentAt);
      const deliveredAt = new Date(delivery.deliveredAt);
      expect(deliveredAt.getTime()).toBeGreaterThanOrEqual(sentAt.getTime());
    });
  });

  it('should return status with proper timestamps ordering', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/${validNotificationId}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    data.deliveries.forEach((delivery: any) => {
      const sentAt = new Date(delivery.sentAt);

      // If deliveredAt exists, it should be after sentAt
      if (delivery.deliveredAt) {
        const deliveredAt = new Date(delivery.deliveredAt);
        expect(deliveredAt.getTime()).toBeGreaterThanOrEqual(sentAt.getTime());
      }
    });
  });

  it('should handle empty path parameter gracefully', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications//status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Notification ID is required');
  });

  it('should validate user access to notification', async () => {
    // This test assumes the notification belongs to the authenticated user
    const response = await fetch(`http://localhost:${port}/api/notifications/${validNotificationId}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    expect([200, 403, 404]).toContain(response.status);

    if (response.status === 403) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Access denied');
    }
  });

  it('should return consistent notification ID in response', async () => {
    const response = await fetch(`http://localhost:${port}/api/notifications/${validNotificationId}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      expect(data.id).toBe(validNotificationId);
    }
  });

  it('should handle special characters in notification ID', async () => {
    const specialCharId = 'notif_123-abc_456';
    const response = await fetch(`http://localhost:${port}/api/notifications/${encodeURIComponent(specialCharId)}/status`, {
      headers: {
        'Authorization': `Bearer ${mockAuthToken}`
      }
    });

    // Should handle URL encoding properly
    expect([200, 400, 404]).toContain(response.status);
  });
});