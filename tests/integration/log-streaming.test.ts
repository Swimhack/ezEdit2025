import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { supabase } from '@/lib/supabase';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3101; // Use unique port for integration tests

describe('Log Streaming - Integration Test', () => {
  let app: any;
  let handle: any;
  let server: any;
  let testUserId: string;
  let authToken: string;
  let logTokenId: string;
  let secureToken: string;

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
        console.log(`> Log streaming test server ready on http://${hostname}:${port}`);
        resolve();
      });
    });

    // Setup test user and auth
    const { data: user, error: userError } = await supabase.auth.signUp({
      email: `log-streaming-test-${Date.now()}@example.com`,
      password: 'testpassword123',
    });

    if (userError || !user.user) {
      throw new Error(`Failed to create test user: ${userError?.message}`);
    }

    testUserId = user.user.id;

    // Get auth token
    const { data: session } = await supabase.auth.getSession();
    authToken = session?.session?.access_token || 'mock-token';

    // Create log token for streaming tests
    const createTokenResponse = await fetch(`http://localhost:${port}/api/logs/tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Streaming Test Token',
        description: 'Token for log streaming integration testing',
        permissions: ['READ', 'WRITE', 'STREAM'],
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      })
    });

    const tokenData = await createTokenResponse.json();
    logTokenId = tokenData.id;
    secureToken = tokenData.token;
  });

  afterAll(async () => {
    // Cleanup test user and data
    if (testUserId) {
      await supabase.from('log_tokens').delete().eq('user_id', testUserId);
      await supabase.from('log_entries').delete().eq('user_id', testUserId);
      await supabase.from('log_streams').delete().eq('user_id', testUserId);
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
    await supabase.from('log_entries').delete().eq('user_id', testUserId);
    await supabase.from('log_streams').delete().eq('user_id', testUserId);
  });

  it('should establish real-time log streaming with SSE', async () => {
    // Test SSE connection establishment
    const sseUrl = `http://localhost:${port}/api/logs/stream?source=streaming-test&level=info`;

    return new Promise<void>((resolve, reject) => {
      const eventSource = new (global as any).EventSource(sseUrl, {
        headers: {
          'Authorization': `Bearer ${secureToken}`,
        }
      });

      const receivedEvents: any[] = [];
      let connectionEstablished = false;

      eventSource.onopen = () => {
        connectionEstablished = true;
        console.log('SSE connection established');
      };

      eventSource.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          receivedEvents.push(data);

          if (data.type === 'log' && data.message === 'Test streaming log entry') {
            eventSource.close();

            // Verify received log data
            expect(data).toHaveProperty('id');
            expect(data).toHaveProperty('timestamp');
            expect(data.level).toBe('info');
            expect(data.source).toBe('streaming-test');
            expect(data.metadata).toEqual({ streaming: true });

            resolve();
          }
        } catch (error) {
          reject(new Error(`Failed to parse SSE event data: ${error}`));
        }
      };

      eventSource.onerror = (error: any) => {
        eventSource.close();
        reject(new Error(`SSE connection error: ${error}`));
      };

      // Wait for connection to establish, then send a log entry
      setTimeout(async () => {
        if (!connectionEstablished) {
          eventSource.close();
          reject(new Error('SSE connection not established within timeout'));
          return;
        }

        // Send a log entry that should trigger the stream
        try {
          const response = await fetch(`http://localhost:${port}/api/logs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secureToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              level: 'info',
              message: 'Test streaming log entry',
              timestamp: new Date().toISOString(),
              source: 'streaming-test',
              metadata: { streaming: true }
            })
          });

          if (!response.ok) {
            throw new Error(`Failed to create log entry: ${response.status}`);
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      }, 1000);

      // Timeout after 10 seconds
      setTimeout(() => {
        eventSource.close();
        reject(new Error('Test timeout - no log event received'));
      }, 10000);
    });
  });

  it('should handle multiple concurrent streaming connections', async () => {
    const streamPromises = Array.from({ length: 3 }, (_, index) => {
      return new Promise<number>((resolve, reject) => {
        const sseUrl = `http://localhost:${port}/api/logs/stream?source=concurrent-stream-${index}`;
        const eventSource = new (global as any).EventSource(sseUrl, {
          headers: {
            'Authorization': `Bearer ${secureToken}`,
          }
        });

        let eventCount = 0;

        eventSource.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'log' && data.source === `concurrent-stream-${index}`) {
              eventCount++;
              if (eventCount >= 2) { // Expect 2 events per stream
                eventSource.close();
                resolve(eventCount);
              }
            }
          } catch (error) {
            eventSource.close();
            reject(error);
          }
        };

        eventSource.onerror = (error: any) => {
          eventSource.close();
          reject(error);
        };

        // Send test logs after connection is established
        setTimeout(async () => {
          for (let i = 0; i < 2; i++) {
            await fetch(`http://localhost:${port}/api/logs`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${secureToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                level: 'info',
                message: `Concurrent stream log ${i}`,
                timestamp: new Date().toISOString(),
                source: `concurrent-stream-${index}`,
                metadata: { concurrent: true, batch: i }
              })
            });
          }
        }, 1000);

        // Timeout after 15 seconds
        setTimeout(() => {
          eventSource.close();
          reject(new Error('Concurrent stream test timeout'));
        }, 15000);
      });
    });

    const results = await Promise.all(streamPromises);
    results.forEach(eventCount => {
      expect(eventCount).toBe(2);
    });
  });

  it('should support streaming with filters and subscriptions', async () => {
    return new Promise<void>((resolve, reject) => {
      // Create filtered stream for error level logs only
      const sseUrl = `http://localhost:${port}/api/logs/stream?level=error&source=filter-test`;
      const eventSource = new (global as any).EventSource(sseUrl, {
        headers: {
          'Authorization': `Bearer ${secureToken}`,
        }
      });

      const receivedEvents: any[] = [];

      eventSource.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          receivedEvents.push(data);

          if (data.type === 'log') {
            // Should only receive error level logs
            expect(data.level).toBe('error');
            expect(data.source).toBe('filter-test');

            if (receivedEvents.filter(e => e.type === 'log').length >= 2) {
              eventSource.close();
              resolve();
            }
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = (error: any) => {
        eventSource.close();
        reject(error);
      };

      // Send logs of different levels after connection is established
      setTimeout(async () => {
        const logLevels = ['info', 'warn', 'error', 'error']; // Only error logs should be streamed

        for (const level of logLevels) {
          await fetch(`http://localhost:${port}/api/logs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secureToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              level,
              message: `Filter test ${level} log`,
              timestamp: new Date().toISOString(),
              source: 'filter-test',
              metadata: { filtered: true, level }
            })
          });

          // Small delay between logs
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }, 1000);

      // Timeout after 10 seconds
      setTimeout(() => {
        eventSource.close();
        reject(new Error('Filter test timeout'));
      }, 10000);
    });
  });

  it('should handle stream reconnection and buffering', async () => {
    let reconnectionCount = 0;
    let totalEventsReceived = 0;

    return new Promise<void>((resolve, reject) => {
      const createConnection = () => {
        const sseUrl = `http://localhost:${port}/api/logs/stream?source=reconnection-test&lastEventId=${Date.now()}`;
        const eventSource = new (global as any).EventSource(sseUrl, {
          headers: {
            'Authorization': `Bearer ${secureToken}`,
          }
        });

        eventSource.onopen = () => {
          console.log(`Connection ${reconnectionCount + 1} established`);
        };

        eventSource.onmessage = (event: any) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'log') {
              totalEventsReceived++;

              // Simulate connection drop after first event
              if (totalEventsReceived === 1 && reconnectionCount === 0) {
                eventSource.close();
                reconnectionCount++;

                // Reconnect after a delay
                setTimeout(() => {
                  createConnection();
                }, 1000);
                return;
              }

              // Complete test after receiving events from reconnected stream
              if (totalEventsReceived >= 3) {
                eventSource.close();
                expect(reconnectionCount).toBe(1);
                expect(totalEventsReceived).toBeGreaterThanOrEqual(3);
                resolve();
              }
            }
          } catch (error) {
            eventSource.close();
            reject(error);
          }
        };

        eventSource.onerror = (error: any) => {
          if (reconnectionCount === 0) {
            // Expected disconnection for testing
            return;
          }
          eventSource.close();
          reject(error);
        };
      };

      // Start initial connection
      createConnection();

      // Send logs continuously
      const logInterval = setInterval(async () => {
        try {
          await fetch(`http://localhost:${port}/api/logs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secureToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              level: 'info',
              message: `Reconnection test log ${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: 'reconnection-test',
              metadata: { reconnection: true }
            })
          });
        } catch (error) {
          console.error('Error sending log during reconnection test:', error);
        }
      }, 2000);

      // Cleanup and timeout after 20 seconds
      setTimeout(() => {
        clearInterval(logInterval);
        reject(new Error('Reconnection test timeout'));
      }, 20000);
    });
  });

  it('should enforce stream authentication and authorization', async () => {
    // Test unauthorized access
    return new Promise<void>((resolve, reject) => {
      const sseUrl = `http://localhost:${port}/api/logs/stream?source=auth-test`;
      const eventSource = new (global as any).EventSource(sseUrl); // No auth header

      eventSource.onerror = (error: any) => {
        // Should fail due to missing authentication
        eventSource.close();

        // Now test with invalid token
        const invalidTokenSource = new (global as any).EventSource(sseUrl, {
          headers: {
            'Authorization': 'Bearer invalid-token',
          }
        });

        invalidTokenSource.onerror = (error: any) => {
          invalidTokenSource.close();

          // Finally test with valid token (should succeed)
          const validTokenSource = new (global as any).EventSource(sseUrl, {
            headers: {
              'Authorization': `Bearer ${secureToken}`,
            }
          });

          validTokenSource.onopen = () => {
            validTokenSource.close();
            resolve();
          };

          validTokenSource.onerror = (error: any) => {
            validTokenSource.close();
            reject(new Error('Valid token should have succeeded'));
          };

          // Timeout for valid token test
          setTimeout(() => {
            validTokenSource.close();
            reject(new Error('Valid token test timeout'));
          }, 5000);
        };

        // Timeout for invalid token test
        setTimeout(() => {
          invalidTokenSource.close();
          reject(new Error('Invalid token test timeout'));
        }, 5000);
      };

      // Timeout for unauthorized test
      setTimeout(() => {
        eventSource.close();
        reject(new Error('Unauthorized test timeout'));
      }, 5000);
    });
  });

  it('should handle high-volume streaming with backpressure', async () => {
    return new Promise<void>((resolve, reject) => {
      const sseUrl = `http://localhost:${port}/api/logs/stream?source=volume-test`;
      const eventSource = new (global as any).EventSource(sseUrl, {
        headers: {
          'Authorization': `Bearer ${secureToken}`,
        }
      });

      let eventsReceived = 0;
      const expectedEvents = 100;
      const startTime = Date.now();

      eventSource.onmessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'log' && data.source === 'volume-test') {
            eventsReceived++;

            if (eventsReceived >= expectedEvents) {
              const endTime = Date.now();
              const duration = endTime - startTime;

              eventSource.close();

              // Verify all events were received
              expect(eventsReceived).toBe(expectedEvents);

              // Verify reasonable performance (should handle 100 events in reasonable time)
              expect(duration).toBeLessThan(30000); // 30 seconds max

              console.log(`Streamed ${expectedEvents} events in ${duration}ms`);
              resolve();
            }
          }
        } catch (error) {
          eventSource.close();
          reject(error);
        }
      };

      eventSource.onerror = (error: any) => {
        eventSource.close();
        reject(error);
      };

      // Send high volume of logs after connection is established
      setTimeout(async () => {
        console.log('Starting high-volume log generation...');

        // Send logs in batches to avoid overwhelming the system
        const batchSize = 10;
        const batches = expectedEvents / batchSize;

        for (let batch = 0; batch < batches; batch++) {
          const batchPromises = [];

          for (let i = 0; i < batchSize; i++) {
            const logIndex = batch * batchSize + i;
            batchPromises.push(
              fetch(`http://localhost:${port}/api/logs`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${secureToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  level: 'info',
                  message: `Volume test log ${logIndex}`,
                  timestamp: new Date().toISOString(),
                  source: 'volume-test',
                  metadata: { volume: true, index: logIndex }
                })
              })
            );
          }

          await Promise.all(batchPromises);

          // Small delay between batches to allow processing
          if (batch < batches - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      }, 1000);

      // Timeout after 60 seconds
      setTimeout(() => {
        eventSource.close();
        reject(new Error(`Volume test timeout. Received ${eventsReceived}/${expectedEvents} events`));
      }, 60000);
    });
  });
});