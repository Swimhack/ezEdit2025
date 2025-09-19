/**
 * FTP Editor Layout Persistence API
 * Handles saving and loading editor layout preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/logger';

// In-memory storage for demo purposes
// In production, this would be stored in a database per user
const layoutStorage = new Map<string, any>();

/**
 * GET - Load editor layout configuration
 */
export async function GET(request: NextRequest) {
  const apiLogger = createRequestLogger(request);

  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');

    // Temporary user
    const userId = 'demo-user';

    if (!websiteId) {
      return NextResponse.json(
        { error: 'Missing websiteId query parameter' },
        { status: 400 }
      );
    }

    // Create storage key
    const storageKey = `${userId}:${websiteId}`;

    // Get saved layout or return defaults
    const savedLayout = layoutStorage.get(storageKey) || {
      paneVisibility: {
        tree: true,
        editor: true,
        preview: true
      },
      layout: {
        treeWidth: 300,
        previewWidth: 350,
        editorHeight: 600,
        orientation: 'horizontal'
      }
    };

    apiLogger.info({
      userId,
      websiteId,
      operation: 'LOAD_LAYOUT'
    }, 'Layout configuration loaded');

    return NextResponse.json(savedLayout);

  } catch (error) {
    apiLogger.error({
      error: error instanceof Error ? error.message : error,
      operation: 'LOAD_LAYOUT'
    }, 'Layout load operation failed');

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Save editor layout configuration
 */
export async function PUT(request: NextRequest) {
  const apiLogger = createRequestLogger(request);

  try {
    const body = await request.json();
    const { websiteId, paneVisibility, layout } = body;

    // Temporary user
    const userId = 'demo-user';

    // Validate request
    if (!websiteId) {
      return NextResponse.json(
        { error: 'Missing websiteId' },
        { status: 400 }
      );
    }

    // Validate layout structure
    if (paneVisibility && !isValidPaneVisibility(paneVisibility)) {
      return NextResponse.json(
        { error: 'Invalid pane visibility configuration' },
        { status: 400 }
      );
    }

    if (layout && !isValidLayoutConfig(layout)) {
      return NextResponse.json(
        { error: 'Invalid layout configuration' },
        { status: 400 }
      );
    }

    // Create storage key
    const storageKey = `${userId}:${websiteId}`;

    // Get existing layout or create new one
    const existingLayout = layoutStorage.get(storageKey) || {
      paneVisibility: {
        tree: true,
        editor: true,
        preview: true
      },
      layout: {
        treeWidth: 300,
        previewWidth: 350,
        editorHeight: 600,
        orientation: 'horizontal'
      }
    };

    // Update with new values
    const updatedLayout = {
      paneVisibility: paneVisibility ? { ...existingLayout.paneVisibility, ...paneVisibility } : existingLayout.paneVisibility,
      layout: layout ? { ...existingLayout.layout, ...layout } : existingLayout.layout
    };

    // Save to storage
    layoutStorage.set(storageKey, updatedLayout);

    apiLogger.info({
      userId,
      websiteId,
      paneVisibility: updatedLayout.paneVisibility,
      layout: updatedLayout.layout,
      operation: 'SAVE_LAYOUT'
    }, 'Layout configuration saved');

    return NextResponse.json({
      success: true,
      layout: updatedLayout
    });

  } catch (error) {
    apiLogger.error({
      error: error instanceof Error ? error.message : error,
      operation: 'SAVE_LAYOUT'
    }, 'Layout save operation failed');

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate pane visibility configuration
 */
function isValidPaneVisibility(visibility: any): boolean {
  if (typeof visibility !== 'object' || visibility === null) {
    return false;
  }

  // Check that it has boolean values for known panes
  const validPanes = ['tree', 'editor', 'preview'];
  for (const [key, value] of Object.entries(visibility)) {
    if (!validPanes.includes(key) || typeof value !== 'boolean') {
      return false;
    }
  }

  // Ensure at least one pane is visible
  const visiblePanes = Object.values(visibility).filter(Boolean);
  return visiblePanes.length > 0;
}

/**
 * Validate layout configuration
 */
function isValidLayoutConfig(layout: any): boolean {
  if (typeof layout !== 'object' || layout === null) {
    return false;
  }

  // Check numeric values within reasonable ranges
  if (layout.treeWidth !== undefined) {
    if (typeof layout.treeWidth !== 'number' || layout.treeWidth < 200 || layout.treeWidth > 800) {
      return false;
    }
  }

  if (layout.previewWidth !== undefined) {
    if (typeof layout.previewWidth !== 'number' || layout.previewWidth < 200 || layout.previewWidth > 600) {
      return false;
    }
  }

  if (layout.editorHeight !== undefined) {
    if (typeof layout.editorHeight !== 'number' || layout.editorHeight < 300) {
      return false;
    }
  }

  if (layout.orientation !== undefined) {
    if (!['horizontal', 'vertical'].includes(layout.orientation)) {
      return false;
    }
  }

  return true;
}