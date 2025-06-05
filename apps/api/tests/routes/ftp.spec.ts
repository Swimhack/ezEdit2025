import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import ftpRouter from '../../src/routes/ftp';
import { Client } from 'basic-ftp';

// Mock basic-ftp
vi.mock('basic-ftp', () => {
  const uploadFromMock = vi.fn();
  const accessMock = vi.fn();
  const closeMock = vi.fn();
  
  return {
    Client: vi.fn().mockImplementation(() => ({
      access: accessMock,
      uploadFrom: uploadFromMock,
      close: closeMock,
      ftp: {
        verbose: true
      }
    })),
    accessMock,
    uploadFromMock,
    closeMock
  };
});

// Mock stream
vi.mock('stream', () => {
  return {
    Readable: {
      from: (data: any) => data
    }
  };
});

describe('FTP Router', () => {
  let app: express.Application;
  const mockClient = new Client();
  
  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/ftp', ftpRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PUT /ftp/content', () => {
    const validCredentials = {
      host: 'test.ftp.com',
      username: 'user',
      password: 'pass',
      port: 21,
      secure: false
    };
    
    const validRequestBody = {
      credentials: validCredentials,
      path: '/test/file.txt',
      content: 'File content'
    };

    it('should upload file content successfully', async () => {
      // Setup mocks
      (mockClient.access as any).mockResolvedValueOnce(undefined);
      (mockClient.uploadFrom as any).mockResolvedValueOnce(undefined);
      
      // Make request
      const response = await request(app)
        .put('/ftp/content')
        .send(validRequestBody);
      
      // Assert response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.path).toBe(validRequestBody.path);
      
      // Assert mocks were called correctly
      expect(mockClient.access).toHaveBeenCalledWith({
        host: validCredentials.host,
        user: validCredentials.username,
        password: validCredentials.password,
        port: validCredentials.port,
        secure: validCredentials.secure
      });
      expect(mockClient.uploadFrom).toHaveBeenCalledTimes(1);
      expect(mockClient.close).toHaveBeenCalledTimes(1);
    });

    it('should retry upload on failure with exponential backoff', async () => {
      // Setup clock to test timing
      vi.useFakeTimers();
      
      // Setup mocks - access succeeds, but upload fails twice then succeeds
      (mockClient.access as any).mockResolvedValue(undefined);
      (mockClient.uploadFrom as any)
        .mockRejectedValueOnce(new Error('Upload failed'))
        .mockRejectedValueOnce(new Error('Upload failed again'))
        .mockResolvedValueOnce(undefined);
      
      // Start the request but don't await it yet
      const responsePromise = request(app)
        .put('/ftp/content')
        .send(validRequestBody);
      
      // Let the first attempt fail
      await vi.runAllTimersAsync();
      
      // Let the second attempt (first retry) happen and fail
      await vi.advanceTimersByTimeAsync(1000);
      
      // Let the third attempt (second retry) happen and succeed
      await vi.advanceTimersByTimeAsync(1500);
      
      // Now await the response
      const response = await responsePromise;
      
      // Assert response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Assert mocks were called correctly
      expect(mockClient.access).toHaveBeenCalledTimes(1);
      expect(mockClient.uploadFrom).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(mockClient.close).toHaveBeenCalledTimes(1);
      
      // Restore real timers
      vi.useRealTimers();
    });
    
    it('should fail after maximum retries', async () => {
      // Setup mocks - access succeeds, but upload always fails
      (mockClient.access as any).mockResolvedValue(undefined);
      (mockClient.uploadFrom as any).mockRejectedValue(new Error('Persistent upload failure'));
      
      // Make request
      const response = await request(app)
        .put('/ftp/content')
        .send(validRequestBody);
      
      // Assert response indicates failure
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Persistent upload failure');
      
      // Assert upload was attempted the expected number of times (initial + 5 retries = 6)
      expect(mockClient.uploadFrom).toHaveBeenCalledTimes(6);
      expect(mockClient.close).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if request format is invalid', async () => {
      const response = await request(app)
        .put('/ftp/content')
        .send({
          credentials: { host: 'test.ftp.com' }, // Missing required fields
          path: '/test/file.txt',
          content: 'File content'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request format');
    });
  });
});
