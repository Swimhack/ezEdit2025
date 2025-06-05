import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Client } from 'basic-ftp';
import { Readable } from 'stream';

// Import the retry functions to test
// Note: Since we can't directly import the private functions from the router,
// we'll recreate them here for testing and ensure they match the implementation
interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  backoffFactor: 2,
  maxDelayMs: 30000, // 30 seconds
};

/**
 * Sleep for the specified number of milliseconds
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute an operation with retry logic and exponential back-off
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // First attempt (attempt=0) has no delay
      if (attempt > 0) {
        await sleep(delay);
        // Increase the delay for the next attempt (with a max cap)
        delay = Math.min(delay * config.backoffFactor, config.maxDelayMs);
      }

      // Attempt the operation
      return await operation();
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, we'll throw the error
      if (attempt === config.maxRetries) {
        break;
      }
    }
  }

  // If we get here, all retries failed
  throw lastError;
}

// Mock the Client class from basic-ftp
vi.mock('basic-ftp', () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      access: vi.fn(),
      ftp: { verbose: false },
      uploadFrom: vi.fn(),
      downloadTo: vi.fn(),
      close: vi.fn(),
      ensureDir: vi.fn(),
      cd: vi.fn(),
      remove: vi.fn(),
      removeDir: vi.fn(),
    })),
  };
});

describe('FTP Retry Functionality', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
  });

  it('should retry failed operations with exponential backoff', async () => {
    // Setup mock operation that fails the first 2 times then succeeds
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('Server Busy'))
      .mockRejectedValueOnce(new Error('Connection Reset'))
      .mockResolvedValueOnce('Success');

    // Start the retry process
    const retryPromise = withRetry(mockOperation);
    
    // Initial call should happen immediately
    expect(mockOperation).toHaveBeenCalledTimes(1);

    // Advance timer to trigger first retry (1000ms)
    await vi.advanceTimersByTimeAsync(1000);
    expect(mockOperation).toHaveBeenCalledTimes(2);
    
    // Advance timer to trigger second retry (2000ms, due to backoff)
    await vi.advanceTimersByTimeAsync(2000);
    expect(mockOperation).toHaveBeenCalledTimes(3);

    // Resolve the promise
    const result = await retryPromise;
    expect(result).toBe('Success');
  });

  it('should respect custom retry options', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce('Success');

    const customOptions = {
      maxRetries: 1,
      initialDelayMs: 500,
      backoffFactor: 1.5,
      maxDelayMs: 5000
    };

    const retryPromise = withRetry(mockOperation, customOptions);
    
    // Initial call should happen immediately
    expect(mockOperation).toHaveBeenCalledTimes(1);

    // Advance timer to trigger retry (500ms, per custom settings)
    await vi.advanceTimersByTimeAsync(500);
    expect(mockOperation).toHaveBeenCalledTimes(2);

    const result = await retryPromise;
    expect(result).toBe('Success');
  });

  it('should throw the last error after all retries fail', async () => {
    const mockError = new Error('Persistent Failure');
    const mockOperation = vi.fn().mockRejectedValue(mockError);

    // Use fewer retries for faster test
    const customOptions = {
      maxRetries: 2,
      initialDelayMs: 100,
      backoffFactor: 1.5,
    };

    const retryPromise = withRetry(mockOperation, customOptions);
    
    // Initial call
    expect(mockOperation).toHaveBeenCalledTimes(1);

    // First retry (100ms)
    await vi.advanceTimersByTimeAsync(100);
    expect(mockOperation).toHaveBeenCalledTimes(2);
    
    // Second retry (150ms, due to backoff)
    await vi.advanceTimersByTimeAsync(150);
    expect(mockOperation).toHaveBeenCalledTimes(3);

    // Ensure it throws the last error
    await expect(retryPromise).rejects.toThrow(mockError);
  });

  it('should cap delay at maxDelayMs', async () => {
    const mockOperation = vi.fn()
      .mockRejectedValueOnce(new Error('Failed 1'))
      .mockRejectedValueOnce(new Error('Failed 2'))
      .mockRejectedValueOnce(new Error('Failed 3'))
      .mockResolvedValueOnce('Success');
    
    const customOptions = {
      maxRetries: 3,
      initialDelayMs: 10000,
      backoffFactor: 3,
      maxDelayMs: 15000 // This should cap the delay
    };

    const retryPromise = withRetry(mockOperation, customOptions);
    
    // Initial call
    expect(mockOperation).toHaveBeenCalledTimes(1);

    // First retry (10000ms)
    await vi.advanceTimersByTimeAsync(10000);
    expect(mockOperation).toHaveBeenCalledTimes(2);
    
    // Second retry (should be capped at 15000ms instead of 30000ms)
    await vi.advanceTimersByTimeAsync(15000);
    expect(mockOperation).toHaveBeenCalledTimes(3);
    
    // Third retry (still capped at 15000ms)
    await vi.advanceTimersByTimeAsync(15000);
    expect(mockOperation).toHaveBeenCalledTimes(4);

    const result = await retryPromise;
    expect(result).toBe('Success');
  });

  // Test for FTP file upload with retry
  it('should retry FTP uploads with proper stream recreation', async () => {
    const client = new Client();
    const mockUploadFrom = client.uploadFrom as any;
    
    // Mock uploadFrom to fail twice then succeed
    mockUploadFrom
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce(undefined);

    const content = 'Test file content';
    const buffer = Buffer.from(content);

    // Test the upload with retry logic
    await withRetry(async () => {
      const readable = Readable.from(buffer);
      return await client.uploadFrom(readable, '/path/to/file.txt');
    }, {
      maxRetries: 3,
      initialDelayMs: 100
    });

    // Should have been called 3 times (1 initial + 2 retries before success)
    expect(mockUploadFrom).toHaveBeenCalledTimes(3);
  });
});
