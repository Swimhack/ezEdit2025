import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { supabase } from '@/lib/supabase';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3100; // Use unique port for integration tests

describe('Logging Flow - Integration Test', () => {
  let app: any;
  let handle: any;
  let server: any;
  let testUserId: string;
  let authToken: string;
  let logTokenId: string;

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
        console.log(`> Integration test server ready on http://${hostname}:${port}`);
        resolve();
      });
    });

    // Setup test user and auth
    const { data: user, error: userError } = await supabase.auth.signUp({
      email: `logging-test-${Date.now()}@example.com`,
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
      await supabase.from('log_tokens').delete().eq('user_id', testUserId);
      await supabase.from('log_entries').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }

    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  beforeEach(async () => {
    // Clean up any existing log data for this user
    await supabase.from('log_tokens').delete().eq('user_id', testUserId);
    await supabase.from('log_entries').delete().eq('user_id', testUserId);
  });

  afterEach(async () => {
    // Clean up after each test
    if (logTokenId) {
      await supabase.from('log_tokens').delete().eq('id', logTokenId);
      logTokenId = '';
    }
  });

  it('should complete full logging workflow with secure token access', async () => {
    // Step 1: Create a secure log token
    const createTokenResponse = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Integration Test Token',
        description: 'Token for integration testing',
        permissions: ['READ', 'WRITE'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      })
    });

    expect(createTokenResponse.status).toBe(201);
    const tokenData = await createTokenResponse.json();
    expect(tokenData).toHaveProperty('id');
    expect(tokenData).toHaveProperty('token');
    expect(tokenData).toHaveProperty('hashedToken');
    expect(tokenData.name).toBe('Integration Test Token');
    expect(tokenData.permissions).toEqual(['READ', 'WRITE']);

    logTokenId = tokenData.id;
    const secureToken = tokenData.token;

    // Step 2: Verify token can be used to write logs
    const logEntry = {
      level: 'info',
      message: 'Integration test log entry',
      timestamp: new Date().toISOString(),
      source: 'integration-test',
      metadata: {
        testType: 'integration',
        workflow: 'logging-flow'
      }
    };

    const writeLogResponse = await fetch(`http://localhost:${port}/api/logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logEntry)
    });

    expect(writeLogResponse.status).toBe(201);
    const logData = await writeLogResponse.json();
    expect(logData).toHaveProperty('id');
    expect(logData.level).toBe('info');
    expect(logData.message).toBe('Integration test log entry');
    expect(logData.source).toBe('integration-test');

    const logEntryId = logData.id;

    // Step 3: Verify token can be used to read logs
    const readLogsResponse = await fetch(`http://localhost:${port}/api/logs?limit=10&source=integration-test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
      }
    });

    expect(readLogsResponse.status).toBe(200);
    const logsData = await readLogsResponse.json();
    expect(logsData).toHaveProperty('logs');
    expect(logsData).toHaveProperty('pagination');
    expect(Array.isArray(logsData.logs)).toBe(true);
    expect(logsData.logs.length).toBe(1);
    expect(logsData.logs[0].id).toBe(logEntryId);

    // Step 4: Test log filtering and search
    const searchResponse = await fetch(`http://localhost:${port}/api/logs?search=integration&level=info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
      }
    });

    expect(searchResponse.status).toBe(200);
    const searchData = await searchResponse.json();
    expect(searchData.logs.length).toBe(1);
    expect(searchData.logs[0].message).toContain('integration');

    // Step 5: Test bulk log operations
    const bulkLogs = [
      {
        level: 'warn',
        message: 'Warning log entry',
        timestamp: new Date().toISOString(),
        source: 'integration-test',
        metadata: { batch: 'bulk-1' }
      },
      {
        level: 'error',
        message: 'Error log entry',
        timestamp: new Date().toISOString(),
        source: 'integration-test',
        metadata: { batch: 'bulk-1' }
      }
    ];

    const bulkWriteResponse = await fetch(`http://localhost:${port}/api/logs/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logs: bulkLogs })
    });

    expect(bulkWriteResponse.status).toBe(201);
    const bulkData = await bulkWriteResponse.json();
    expect(bulkData).toHaveProperty('inserted');
    expect(bulkData.inserted).toBe(2);

    // Step 6: Verify all logs are accessible
    const allLogsResponse = await fetch(`http://localhost:${port}/api/logs?source=integration-test&limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
      }
    });

    expect(allLogsResponse.status).toBe(200);
    const allLogsData = await allLogsResponse.json();
    expect(allLogsData.logs.length).toBe(3); // 1 initial + 2 bulk

    // Step 7: Test log aggregation and analytics
    const analyticsResponse = await fetch(`http://localhost:${port}/api/logs/analytics?source=integration-test&groupBy=level`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
      }
    });

    expect(analyticsResponse.status).toBe(200);
    const analyticsData = await analyticsResponse.json();
    expect(analyticsData).toHaveProperty('aggregations');
    expect(analyticsData.aggregations).toHaveProperty('info');
    expect(analyticsData.aggregations).toHaveProperty('warn');
    expect(analyticsData.aggregations).toHaveProperty('error');
    expect(analyticsData.aggregations.info.count).toBe(1);
    expect(analyticsData.aggregations.warn.count).toBe(1);
    expect(analyticsData.aggregations.error.count).toBe(1);

    // Step 8: Test token management
    const listTokensResponse = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(listTokensResponse.status).toBe(200);
    const tokensData = await listTokensResponse.json();
    expect(Array.isArray(tokensData.tokens)).toBe(true);
    expect(tokensData.tokens.length).toBe(1);
    expect(tokensData.tokens[0].id).toBe(logTokenId);
    expect(tokensData.tokens[0]).not.toHaveProperty('token'); // Should not expose raw token
    expect(tokensData.tokens[0]).toHaveProperty('hashedToken');

    // Step 9: Test token revocation
    const revokeTokenResponse = await fetch(`http://localhost:${port}/api/logs/tokens/${logTokenId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      }
    });

    expect(revokeTokenResponse.status).toBe(200);

    // Step 10: Verify revoked token cannot access logs
    const invalidAccessResponse = await fetch(`http://localhost:${port}/api/logs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
      }
    });

    expect(invalidAccessResponse.status).toBe(401);
    const errorData = await invalidAccessResponse.json();
    expect(errorData.error).toContain('Invalid or expired token');
  });

  it('should handle log retention and cleanup policies', async () => {
    // Create token for testing
    const createTokenResponse = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Retention Test Token',
        permissions: ['READ', 'WRITE'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    });

    const tokenData = await createTokenResponse.json();
    logTokenId = tokenData.id;
    const secureToken = tokenData.token;

    // Create logs with different timestamps for retention testing
    const oldTimestamp = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(); // 31 days ago
    const recentTimestamp = new Date().toISOString();

    const oldLog = {
      level: 'info',
      message: 'Old log entry for retention test',
      timestamp: oldTimestamp,
      source: 'retention-test',
      metadata: { retention: 'old' }
    };

    const recentLog = {
      level: 'info',
      message: 'Recent log entry for retention test',
      timestamp: recentTimestamp,
      source: 'retention-test',
      metadata: { retention: 'recent' }
    };

    // Write both logs
    await fetch(`http://localhost:${port}/api/logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(oldLog)
    });

    await fetch(`http://localhost:${port}/api/logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recentLog)
    });

    // Test retention policy enforcement
    const retentionResponse = await fetch(`http://localhost:${port}/api/logs/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        retentionDays: 30,
        dryRun: false
      })
    });

    expect(retentionResponse.status).toBe(200);
    const cleanupData = await retentionResponse.json();
    expect(cleanupData).toHaveProperty('deletedCount');
    expect(cleanupData).toHaveProperty('retentionPolicy');

    // Verify old logs are removed and recent logs remain
    const remainingLogsResponse = await fetch(`http://localhost:${port}/api/logs?source=retention-test`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
      }
    });

    const remainingLogs = await remainingLogsResponse.json();
    expect(remainingLogs.logs.every((log: any) => log.metadata.retention === 'recent')).toBe(true);
  });

  it('should handle concurrent logging operations safely', async () => {
    // Create token for concurrent testing
    const createTokenResponse = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Concurrent Test Token',
        permissions: ['READ', 'WRITE'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    });

    const tokenData = await createTokenResponse.json();
    logTokenId = tokenData.id;
    const secureToken = tokenData.token;

    // Create multiple concurrent log operations
    const concurrentOperations = Array.from({ length: 10 }, (_, i) => {
      return fetch(`http://localhost:${port}/api/logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secureToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'info',
          message: `Concurrent log entry ${i}`,
          timestamp: new Date().toISOString(),
          source: 'concurrent-test',
          metadata: { sequence: i }
        })
      });
    });

    // Execute all operations concurrently
    const results = await Promise.all(concurrentOperations);

    // Verify all operations succeeded
    results.forEach((response, index) => {
      expect(response.status).toBe(201);
    });

    // Verify all logs were recorded correctly
    const allLogsResponse = await fetch(`http://localhost:${port}/api/logs?source=concurrent-test&limit=20`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secureToken}`,
      }
    });

    const allLogs = await allLogsResponse.json();
    expect(allLogs.logs.length).toBe(10);

    // Verify data integrity
    const sequences = allLogs.logs.map((log: any) => log.metadata.sequence);
    expect(sequences.sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should enforce rate limiting and quotas', async () => {
    // Create token with limited quota for testing
    const createTokenResponse = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Rate Limited Token',
        permissions: ['READ', 'WRITE'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        rateLimit: {
          requestsPerMinute: 5,
          requestsPerHour: 50
        }
      })
    });

    const tokenData = await createTokenResponse.json();
    logTokenId = tokenData.id;
    const secureToken = tokenData.token;

    // Attempt to exceed rate limit
    const rapidRequests = Array.from({ length: 10 }, (_, i) => {
      return fetch(`http://localhost:${port}/api/logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secureToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: 'info',
          message: `Rate limit test ${i}`,
          timestamp: new Date().toISOString(),
          source: 'rate-limit-test'
        })
      });
    });

    const results = await Promise.all(rapidRequests);

    // Some requests should succeed, others should be rate limited
    const successfulRequests = results.filter(r => r.status === 201);
    const rateLimitedRequests = results.filter(r => r.status === 429);

    expect(successfulRequests.length).toBeLessThanOrEqual(5);
    expect(rateLimitedRequests.length).toBeGreaterThan(0);

    // Check rate limit headers
    const rateLimitResponse = rateLimitedRequests[0];
    expect(rateLimitResponse.headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect(rateLimitResponse.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    expect(rateLimitResponse.headers.get('X-RateLimit-Reset')).toBeTruthy();
  });
});