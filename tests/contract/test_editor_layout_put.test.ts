/**
 * Contract test for PUT /api/ftp/editor/layout endpoint
 * Tests updating editor layout configuration
 */

describe('PUT /api/ftp/editor/layout', () => {
  const endpoint = '/api/ftp/editor/layout';

  const validLayout = {
    paneVisibility: {
      tree: true,
      editor: true,
      preview: false
    },
    layout: {
      treeWidth: 300,
      previewWidth: 400,
      editorHeight: 500,
      orientation: 'horizontal' as const
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update layout configuration successfully', async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validLayout)
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
  });

  it('should return 400 for invalid layout structure', async () => {
    const invalidLayout = {
      paneVisibility: {
        tree: 'not-a-boolean', // Invalid type
        editor: true,
        preview: false
      },
      layout: {
        treeWidth: 300,
        previewWidth: 400,
        editorHeight: 500,
        orientation: 'horizontal'
      }
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidLayout)
    });

    expect(response.status).toBe(400);

    const error = await response.json();
    expect(error).toHaveProperty('error');
  });

  it('should return 400 for treeWidth out of range', async () => {
    const invalidLayout = {
      ...validLayout,
      layout: {
        ...validLayout.layout,
        treeWidth: 100 // Below minimum of 200
      }
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidLayout)
    });

    expect(response.status).toBe(400);
  });

  it('should return 400 for previewWidth out of range', async () => {
    const invalidLayout = {
      ...validLayout,
      layout: {
        ...validLayout.layout,
        previewWidth: 700 // Above maximum of 600
      }
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidLayout)
    });

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid orientation', async () => {
    const invalidLayout = {
      ...validLayout,
      layout: {
        ...validLayout.layout,
        orientation: 'diagonal' // Invalid orientation
      }
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidLayout)
    });

    expect(response.status).toBe(400);
  });

  it('should return 400 for missing required fields', async () => {
    const incompleteLayout = {
      paneVisibility: {
        tree: true,
        editor: true
        // Missing preview
      },
      layout: {
        treeWidth: 300,
        previewWidth: 400,
        editorHeight: 500,
        orientation: 'horizontal'
      }
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incompleteLayout)
    });

    expect(response.status).toBe(400);
  });

  it('should persist layout changes', async () => {
    const connectionId = 'test-connection-123';

    // Update layout
    const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validLayout,
        connectionId
      })
    });

    expect(updateResponse.status).toBe(200);

    // Verify layout persisted by getting it
    const getResponse = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}${endpoint}?connectionId=${connectionId}`, {
      method: 'GET'
    });

    expect(getResponse.status).toBe(200);

    const layout = await getResponse.json();
    expect(layout.paneVisibility).toEqual(validLayout.paneVisibility);
    expect(layout.layout).toEqual(validLayout.layout);
  });
});