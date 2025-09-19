/**
 * Contract test for GET /api/ftp/editor/layout endpoint
 * Tests retrieving editor layout configuration
 */

import { NextRequest } from 'next/server';

describe('GET /api/ftp/editor/layout', () => {
  const endpoint = '/api/ftp/editor/layout';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return layout configuration with valid connectionId', async () => {
    const connectionId = 'test-connection-123';
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.status).toBe(200);

    const data = await response.json();

    // Verify response structure matches EditorLayout schema
    expect(data).toHaveProperty('paneVisibility');
    expect(data.paneVisibility).toHaveProperty('tree');
    expect(data.paneVisibility).toHaveProperty('editor');
    expect(data.paneVisibility).toHaveProperty('preview');

    expect(data).toHaveProperty('layout');
    expect(data.layout).toHaveProperty('treeWidth');
    expect(data.layout).toHaveProperty('previewWidth');
    expect(data.layout).toHaveProperty('editorHeight');
    expect(data.layout).toHaveProperty('orientation');

    // Verify data types
    expect(typeof data.paneVisibility.tree).toBe('boolean');
    expect(typeof data.paneVisibility.editor).toBe('boolean');
    expect(typeof data.paneVisibility.preview).toBe('boolean');

    expect(typeof data.layout.treeWidth).toBe('number');
    expect(data.layout.treeWidth).toBeGreaterThanOrEqual(200);
    expect(data.layout.treeWidth).toBeLessThanOrEqual(800);

    expect(typeof data.layout.previewWidth).toBe('number');
    expect(data.layout.previewWidth).toBeGreaterThanOrEqual(200);
    expect(data.layout.previewWidth).toBeLessThanOrEqual(600);

    expect(typeof data.layout.editorHeight).toBe('number');
    expect(data.layout.editorHeight).toBeGreaterThanOrEqual(300);

    expect(['horizontal', 'vertical']).toContain(data.layout.orientation);
  });

  it('should return 400 for missing connectionId', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('error');
    expect(error.error).toContain('connection');
  });

  it('should return 404 for non-existent connection', async () => {
    const connectionId = 'non-existent-connection';
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}`, {
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

  it('should handle empty connection ID', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    expect(response.status).toBe(400);
  });

  it('should return consistent layout for same connection', async () => {
    const connectionId = 'test-connection-123';

    const response1 = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}`, {
      method: 'GET'
    });

    const response2 = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}`, {
      method: 'GET'
    });

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    const data1 = await response1.json();
    const data2 = await response2.json();

    // Layout should be consistent for the same connection
    expect(data1).toEqual(data2);
  });
});