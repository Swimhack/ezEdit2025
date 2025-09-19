/**
 * Contract test for GET /api/ftp/editor/preview endpoint
 * Tests getting file metadata and preview content for right pane display
 */

describe('GET /api/ftp/editor/preview', () => {
  const endpoint = '/api/ftp/editor/preview';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return file preview with metadata', async () => {
    const connectionId = 'test-connection-123';
    const filePath = '/test/sample.js';

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}&filePath=${encodeURIComponent(filePath)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify response structure matches FilePreview schema
    expect(data).toHaveProperty('path');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('type');
    expect(data).toHaveProperty('size');
    expect(data).toHaveProperty('lastModified');

    expect(typeof data.path).toBe('string');
    expect(typeof data.name).toBe('string');
    expect(['file', 'directory']).toContain(data.type);
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

    // Preview object should exist and have correct structure
    if (data.preview) {
      expect(data.preview).toHaveProperty('available');
      expect(typeof data.preview.available).toBe('boolean');

      if (data.preview.content) {
        expect(typeof data.preview.content).toBe('string');
        expect(data.preview.content.length).toBeLessThanOrEqual(1000); // First 1000 chars
      }

      if (data.preview.thumbnail) {
        expect(typeof data.preview.thumbnail).toBe('string');
        // Should be base64 encoded
        expect(data.preview.thumbnail).toMatch(/^data:image\/[^;]+;base64,/);
      }
    }
  });

  it('should return 400 for missing connectionId', async () => {
    const filePath = '/test/sample.js';

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?filePath=${encodeURIComponent(filePath)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('connectionId');
  });

  it('should return 400 for missing filePath', async () => {
    const connectionId = 'test-connection-123';

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('filePath');
  });

  it('should return 404 for non-existent file', async () => {
    const connectionId = 'test-connection-123';
    const filePath = '/non/existent/file.txt';

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}&filePath=${encodeURIComponent(filePath)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.status).toBe(404);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('not found');
  });

  it('should handle includePreview parameter', async () => {
    const connectionId = 'test-connection-123';
    const filePath = '/test/sample.js';

    // Test with includePreview=false
    const responseWithoutPreview = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}&filePath=${encodeURIComponent(filePath)}&includePreview=false`, {
      method: 'GET'
    });

    expect(responseWithoutPreview.status).toBe(200);

    const dataWithoutPreview = await responseWithoutPreview.json();
    expect(dataWithoutPreview.preview.available).toBe(false);

    // Test with includePreview=true (default)
    const responseWithPreview = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}&filePath=${encodeURIComponent(filePath)}&includePreview=true`, {
      method: 'GET'
    });

    expect(responseWithPreview.status).toBe(200);

    const dataWithPreview = await responseWithPreview.json();
    if (dataWithPreview.preview.available) {
      expect(dataWithPreview.preview).toHaveProperty('content');
    }
  });

  it('should return correct file type for directories', async () => {
    const connectionId = 'test-connection-123';
    const dirPath = '/test/subdirectory';

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}&filePath=${encodeURIComponent(dirPath)}`, {
      method: 'GET'
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.type).toBe('directory');
    expect(data.preview.available).toBe(false); // Directories don't have content preview
  });

  it('should handle different file types correctly', async () => {
    const connectionId = 'test-connection-123';
    const fileTypes = [
      { path: '/test/image.jpg', expectsType: 'file', expectsThumbnail: true },
      { path: '/test/document.pdf', expectsType: 'file', expectsThumbnail: false },
      { path: '/test/script.js', expectsType: 'file', expectsContent: true },
      { path: '/test/styles.css', expectsType: 'file', expectsContent: true },
      { path: '/test/data.json', expectsType: 'file', expectsContent: true }
    ];

    for (const fileType of fileTypes) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}&filePath=${encodeURIComponent(fileType.path)}`, {
        method: 'GET'
      });

      if (response.status === 200) {
        const data = await response.json();
        expect(data.type).toBe(fileType.expectsType);

        if (fileType.expectsThumbnail && data.preview.available) {
          expect(data.preview).toHaveProperty('thumbnail');
        }

        if (fileType.expectsContent && data.preview.available) {
          expect(data.preview).toHaveProperty('content');
        }
      }
    }
  });

  it('should handle special characters in file paths', async () => {
    const connectionId = 'test-connection-123';
    const specialPaths = [
      '/test/file with spaces.txt',
      '/test/file-with-dashes.txt',
      '/test/file_with_underscores.txt',
      '/test/file.with.dots.txt',
      '/test/файл.txt', // Cyrillic
      '/test/文件.txt' // Chinese
    ];

    for (const filePath of specialPaths) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}&filePath=${encodeURIComponent(filePath)}`, {
        method: 'GET'
      });

      // Should not return 400 for valid path formats
      expect([200, 404]).toContain(response.status);
    }
  });

  it('should handle empty query parameters', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=&filePath=`, {
      method: 'GET'
    });

    expect(response.status).toBe(400);
  });

  it('should limit preview content length', async () => {
    const connectionId = 'test-connection-123';
    const filePath = '/test/large-file.txt'; // Assume this file exists and is large

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}&filePath=${encodeURIComponent(filePath)}`, {
      method: 'GET'
    });

    if (response.status === 200) {
      const data = await response.json();

      if (data.preview.available && data.preview.content) {
        // Preview content should be limited to 1000 characters
        expect(data.preview.content.length).toBeLessThanOrEqual(1000);
      }
    }
  });
});