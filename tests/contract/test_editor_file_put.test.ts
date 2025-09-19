/**
 * Contract test for PUT /api/ftp/editor/file endpoint
 * Tests saving edited file content back to FTP server
 */

describe('PUT /api/ftp/editor/file', () => {
  const endpoint = '/api/ftp/editor/file';

  const validFileSaveRequest = {
    connectionId: 'test-connection-123',
    filePath: '/test/sample.js',
    content: 'console.log("Hello, World!");'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save file content successfully', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validFileSaveRequest)
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('lastModified');

    expect(typeof data.success).toBe('boolean');
    expect(data.success).toBe(true);
    expect(typeof data.message).toBe('string');

    // lastModified should be valid ISO date string
    expect(() => new Date(data.lastModified)).not.toThrow();

    // Verify the timestamp is recent (within last minute)
    const timestamp = new Date(data.lastModified);
    const now = new Date();
    const diffMs = Math.abs(now.getTime() - timestamp.getTime());
    expect(diffMs).toBeLessThan(60000); // Less than 1 minute
  });

  it('should return 400 for missing connectionId', async () => {
    const requestWithoutConnectionId = {
      filePath: '/test/sample.js',
      content: 'console.log("test");'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
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
      connectionId: 'test-connection-123',
      content: 'console.log("test");'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
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

  it('should return 400 for missing content', async () => {
    const requestWithoutContent = {
      connectionId: 'test-connection-123',
      filePath: '/test/sample.js'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithoutContent)
    });

    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('content');
  });

  it('should return 403 for permission denied', async () => {
    const requestWithRestrictedFile = {
      connectionId: 'test-connection-123',
      filePath: '/restricted/readonly.txt',
      content: 'trying to write to readonly file'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
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

  it('should return 409 for file modified by another process', async () => {
    const requestWithConflictFile = {
      connectionId: 'test-connection-123',
      filePath: '/test/conflict-file.js',
      content: 'my changes'
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithConflictFile)
    });

    expect(response.status).toBe(409);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('modified');
  });

  it('should handle empty content', async () => {
    const requestWithEmptyContent = {
      connectionId: 'test-connection-123',
      filePath: '/test/empty.txt',
      content: ''
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithEmptyContent)
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle large file content', async () => {
    const largeContent = 'x'.repeat(10000); // 10KB content
    const requestWithLargeContent = {
      connectionId: 'test-connection-123',
      filePath: '/test/large.txt',
      content: largeContent
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithLargeContent)
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle special characters and unicode', async () => {
    const specialContent = 'Hello 世界! 🚀 Special chars: ñáéíóú åæø';
    const requestWithSpecialChars = {
      connectionId: 'test-connection-123',
      filePath: '/test/unicode.txt',
      content: specialContent
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestWithSpecialChars)
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should handle different file extensions', async () => {
    const fileTypes = [
      { path: '/test/script.js', content: 'console.log("test");' },
      { path: '/test/styles.css', content: 'body { margin: 0; }' },
      { path: '/test/page.html', content: '<html><body>Test</body></html>' },
      { path: '/test/data.json', content: '{"test": true}' },
      { path: '/test/readme.md', content: '# Test\n\nContent' }
    ];

    for (const fileType of fileTypes) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: 'test-connection-123',
          filePath: fileType.path,
          content: fileType.content
        })
      });

      expect([200, 403, 404]).toContain(response.status); // Allow for different file permissions
    }
  });

  it('should handle invalid JSON request body', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid-json'
    });

    expect(response.status).toBe(400);
  });
});