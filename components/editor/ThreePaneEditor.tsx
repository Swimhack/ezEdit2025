/**
 * ThreePaneEditor - Main three-pane editor component
 * Orchestrates the file tree, editor, and preview panes with responsive layout
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, useLayout } from '@/lib/editor-state';
import { FTPConnectionConfig } from '@/lib/editor-types';
import FileTreePane from './FileTreePane';
import EditorPane from './EditorPane';
import PreviewPane from './PreviewPane';

interface ThreePaneEditorProps {
  connectionId: string;
  connectionConfig: FTPConnectionConfig;
  className?: string;
}

export default function ThreePaneEditor({
  connectionId,
  connectionConfig,
  className = ''
}: ThreePaneEditorProps) {
  const { state, actions } = useEditor();
  const { paneVisibility, layout, updateLayout } = useLayout();

  const [isResizing, setIsResizing] = useState(false);
  const [resizeState, setResizeState] = useState<{
    type: 'tree' | 'preview';
    startX: number;
    startWidth: number;
  } | null>(null);

  // Responsive breakpoints
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const isDesktop = viewportWidth >= 1200;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1200;
  const isMobile = viewportWidth < 768;

  // Track if we've already initialized to prevent duplicate calls
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize connection and load file tree
  useEffect(() => {
    // Prevent duplicate initialization
    if (!connectionId || !connectionConfig || isInitialized) {
      return;
    }

    // Mark as initialized immediately
    setIsInitialized(true);

    if (connectionId && connectionConfig) {
      actions.setConnection(connectionId, {
        sessionId: `session-${Date.now()}`,
        ftpConnection: connectionConfig,
        workingDirectory: '/',
        recentFiles: [],
        preferences: {
          theme: 'dark',
          fontSize: 14,
          tabSize: 2,
          wordWrap: true,
          showMinimap: true,
          autoSave: false,
          autoSaveDelay: 2000
        },
        createdAt: new Date(),
        lastActivity: new Date()
      });

      // Load initial file tree with timeout
      const loadFileTreeWithTimeout = async () => {
        try {
          await Promise.race([
            actions.loadFileTree(connectionId),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Connection timeout. The FTP server may be unavailable or the credentials may be incorrect.')), 30000)
            )
          ]);
        } catch (error) {
          actions.setError(error instanceof Error ? error.message : 'Connection failed');
        }
      };

      // Add a small delay to prevent race conditions
      const timer = setTimeout(() => {
        loadFileTreeWithTimeout();
      }, 100);

      // Load saved layout (disabled to prevent infinite retries)
      // actions.loadLayoutFromSession();

      // Cleanup function
      return () => {
        clearTimeout(timer);
      };
    }
  }, [connectionId, connectionConfig]); // Remove actions from dependencies to prevent re-runs

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse move for resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeState) return;

    const deltaX = e.clientX - resizeState.startX;

    if (resizeState.type === 'tree') {
      const newWidth = Math.max(200, Math.min(800, resizeState.startWidth + deltaX));
      updateLayout({ treeWidth: newWidth });
    } else if (resizeState.type === 'preview') {
      const newWidth = Math.max(200, Math.min(600, resizeState.startWidth - deltaX));
      updateLayout({ previewWidth: newWidth });
    }
  }, [resizeState, updateLayout]);

  // Handle mouse up for resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeState(null);
  }, []);

  // Set up mouse event listeners for resizing
  useEffect(() => {
    if (resizeState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizeState, handleMouseMove, handleMouseUp]);

  // Start resizing
  const startResize = (type: 'tree' | 'preview', e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeState({
      type,
      startX: e.clientX,
      startWidth: type === 'tree' ? layout.treeWidth : layout.previewWidth
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        actions.saveFile();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '\\') {
        e.preventDefault();
        actions.updatePaneVisibility({
          tree: !paneVisibility.tree
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actions, paneVisibility.tree]);

  // Error display
  if (state.error) {
    return (
      <div
        className={`flex items-center justify-center h-full bg-red-50 text-red-800 ${className}`}
        data-testid="editor-error"
      >
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
          <p className="mb-6 text-sm leading-relaxed">{state.error}</p>
          <div className="space-x-3">
            <button
              onClick={() => {
                actions.clearError();
                if (connectionId) {
                  actions.loadFileTree(connectionId);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => actions.clearError()}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-600">
            Check your FTP connection settings if the problem persists
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (state.isLoading && state.fileTree.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-full ${className}`}
        data-testid="editor-loading"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div
        className={`h-full flex flex-col bg-gray-100 ${className}`}
        data-testid="three-pane-editor"
      >
        <MobilePaneSelector />
        <div className="flex-1 overflow-hidden">
          {paneVisibility.tree && <FileTreePane />}
          {paneVisibility.editor && <EditorPane />}
          {paneVisibility.preview && <PreviewPane />}
        </div>
      </div>
    );
  }

  // Desktop and tablet layout
  return (
    <div
      className={`h-full flex bg-gray-100 ${className}`}
      data-testid="three-pane-editor"
      style={{
        gridTemplateColumns: isDesktop
          ? `${paneVisibility.tree ? layout.treeWidth : 0}px 1fr ${paneVisibility.preview ? layout.previewWidth : 0}px`
          : 'auto 1fr auto'
      }}
    >
      {/* File Tree Pane */}
      {paneVisibility.tree && (
        <>
          <div
            className={`border-r border-gray-300 ${isTablet ? 'absolute left-0 top-0 bottom-0 z-10 bg-white shadow-lg' : ''}`}
            style={{ width: isDesktop ? layout.treeWidth : 300 }}
            data-testid="file-tree-pane"
          >
            <FileTreePane />
          </div>

          {/* Tree Resize Handle */}
          {isDesktop && (
            <div
              className="w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize transition-colors"
              onMouseDown={(e) => startResize('tree', e)}
              data-testid="tree-resize-handle"
            />
          )}
        </>
      )}

      {/* Editor Pane */}
      {paneVisibility.editor && (
        <div
          className="flex-1 border-r border-gray-300"
          data-testid="editor-pane"
        >
          <EditorPane />
        </div>
      )}

      {/* Preview Pane */}
      {paneVisibility.preview && (
        <>
          {/* Preview Resize Handle */}
          {isDesktop && (
            <div
              className="w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize transition-colors"
              onMouseDown={(e) => startResize('preview', e)}
              data-testid="preview-resize-handle"
            />
          )}

          <div
            className="border-l border-gray-300"
            style={{ width: isDesktop ? layout.previewWidth : 350 }}
            data-testid="preview-pane"
          >
            <PreviewPane />
          </div>
        </>
      )}

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

/**
 * Mobile pane selector component
 */
function MobilePaneSelector() {
  const { paneVisibility, updatePaneVisibility } = useLayout();

  const tabs = [
    { key: 'tree', label: 'Files', icon: '📁' },
    { key: 'editor', label: 'Editor', icon: '📝' },
    { key: 'preview', label: 'Preview', icon: '👁️' }
  ] as const;

  const activeTab = tabs.find(tab => paneVisibility[tab.key]) || tabs[1];

  return (
    <div className="flex border-b border-gray-300 bg-white" data-testid="pane-toggle-menu">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => {
            const newVisibility = { tree: false, editor: false, preview: false };
            newVisibility[tab.key] = true;
            updatePaneVisibility(newVisibility);
          }}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
            paneVisibility[tab.key]
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          data-testid={`mobile-tab-${tab.key}`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Status bar component
 */
function StatusBar() {
  const { state } = useEditor();

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-6 bg-blue-600 text-white text-xs flex items-center px-4 space-x-4"
      data-testid="status-bar"
    >
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${state.connectionId ? 'bg-green-400' : 'bg-red-400'}`}
          data-testid="connection-status"
        />
        <span>
          {state.connectionId ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {state.currentFile && (
        <>
          <span>|</span>
          <span data-testid="current-file">{state.currentFile}</span>
        </>
      )}

      {state.isDirty && (
        <>
          <span>|</span>
          <span data-testid="dirty-indicator">● Unsaved changes</span>
        </>
      )}

      {state.lastSaved && (
        <>
          <span>|</span>
          <span data-testid="last-saved">
            Saved {state.lastSaved.toLocaleTimeString()}
          </span>
        </>
      )}

      <div className="flex-1" />

      {state.isLoading && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-white" />
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
}