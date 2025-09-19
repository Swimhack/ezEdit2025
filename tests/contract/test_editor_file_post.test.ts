/**
 * Contract test for POST /api/ftp/editor/file endpoint
 * Tests loading file for editing from FTP server
 */

describe('POST /api/ftp/editor/file', () => {
  const endpoint = '/api/ftp/editor/file';

  const validFileRequest = {
    connectionId: 'test-connection-123',
    filePath: '/test/sample.js'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load file content successfully', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validFileRequest)
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify response structure matches FileContent schema
    expect(data).toHaveProperty('path');
    expect(data).toHaveProperty('content');
    expect(data).toHaveProperty('encoding');
    expect(data).toHaveProperty('size');
    expect(data).toHaveProperty('lastModified');

    expect(typeof data.path).toBe('string');
    expect(typeof data.content).toBe('string');
    expect(['utf-8', 'binary', 'ascii']).toContain(data.encoding);
    expect(typeof data.size).toBe('number');
    expect(data.size).toBeGreaterThanOrEqual(0);

    // lastModified should be valid ISO date string
    expect(() => new Date(data.lastModified)).not.toThrow();

    // Optional properties
    if (data.permissions) {
      expect(typeof data.permissions).toBe('string');
    }
    if (data.mimeType) {
      expect(typeof data.mimeType).toBe('string');
    }
  });

  it('should return 400 for missing connectionId', async () => {
    const requestWithoutConnectionId = {
      filePath: '/test/sample.js'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithoutConnectionId)
    });

    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('connectionId');
  });

  it('should return 400 for missing filePath', async () => {
    const requestWithoutFilePath = {
      connectionId: 'test-connection-123'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithoutFilePath)
    });

    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('filePath');
  });

  it('should return 404 for non-existent file', async () => {
    const requestWithInvalidFile = {
      connectionId: 'test-connection-123',
      filePath: '/non/existent/file.txt'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithInvalidFile)
    });

    expect(response.status).toBe(404);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('not found');
  });

  it('should return 403 for permission denied', async () => {
    const requestWithRestrictedFile = {
      connectionId: 'test-connection-123',
      filePath: '/restricted/file.txt'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithRestrictedFile)
    });

    expect(response.status).toBe(403);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('Permission denied');
  });

  it('should return 413 for file too large', async () => {
    const requestWithLargeFile = {
      connectionId: 'test-connection-123',
      filePath: '/large/massive-file.log'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithLargeFile)
    });

    expect(response.status).toBe(413);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('too large');
  });

  it('should handle different file types', async () => {
    const fileTypes = [
      { path: '/test/script.js', mimeType: 'application/javascript' },
      { path: '/test/styles.css', mimeType: 'text/css' },
      { path: '/test/page.html', mimeType: 'text/html' },
      { path: '/test/data.json', mimeType: 'application/json' },
      { path: '/test/readme.md', mimeType: 'text/markdown' }
    ];

    for (const fileType of fileTypes) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: 'test-connection-123',
          filePath: fileType.path
        })
      });

      if (response.status === 200) {
        const data = await response.json();
        if (data.mimeType) {
          expect(data.mimeType).toBe(fileType.mimeType);
        }
      }
    }
  });

  it('should handle invalid JSON request body', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid-json'
    });

    expect(response.status).toBe(400);
  });
});