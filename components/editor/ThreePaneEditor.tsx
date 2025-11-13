/**
 * ThreePaneEditor - Main three-pane editor component
 * VS Code/Cursor-style UI with activity bar, sidebar, editor, and secondary sidebar
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

  const [activeView, setActiveView] = useState<'explorer' | 'search' | 'settings'>('explorer');

  // Track if we've already initialized to prevent duplicate calls
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize connection and load file tree
  useEffect(() => {
    if (!connectionId || !connectionConfig || isInitialized) {
      return;
    }

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

      // Load initial file tree with timeout and retry logic
      const loadFileTreeWithTimeout = async () => {
        console.log('[Editor] Loading file tree...')
        
        let retries = 2
        let lastError: Error | null = null
        
        while (retries > 0) {
          try {
            await Promise.race([
              actions.loadFileTree(connectionId),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout. Please check your connection.')), 15000)
              )
            ])
            // Success - exit retry loop
            return
          } catch (error) {
            lastError = error instanceof Error ? error : new Error('Unknown error')
            retries--
            
            // Don't retry on authentication errors
            if (lastError.message.includes('Authentication failed') || lastError.message.includes('credentials')) {
              actions.setError(lastError.message)
              return
            }
            
            if (retries > 0) {
              // Wait before retry
              const delay = 1000 // 1 second
              await new Promise(resolve => setTimeout(resolve, delay))
            }
          }
        }
        
        // All retries failed
        if (lastError) {
          actions.setError(lastError.message)
        }
      }
      
      // Load immediately
      loadFileTreeWithTimeout()
    }
  }, [connectionId, connectionConfig]);

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
    const isAuthError = state.error.includes('Authentication') || state.error.includes('530') || state.error.includes('username and password');
    
    return (
      <div
        className={`flex items-center justify-center h-full bg-[#1e1e1e] text-[#cccccc] ${className}`}
        data-testid="editor-error"
      >
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2 text-[#f48771]">
              {isAuthError ? 'Authentication Failed' : 'Connection Failed'}
            </h3>
            <p className="mb-4 text-sm leading-relaxed">{state.error}</p>
            
            {/* Debug info */}
            <div className="mb-4 p-2 bg-[#2d2d30] rounded text-left text-xs font-mono">
              <div className="text-[#858585]">Debug Info:</div>
              <div className="text-[#cccccc]">Connection ID: {connectionId || 'None'}</div>
              <div className="text-[#cccccc]">Current File: {state.currentFile || 'None'}</div>
              <div className="text-[#cccccc]">File Tree: {state.fileTree.length} items</div>
            </div>
            
            {/* Show actionable suggestions for authentication errors */}
            {isAuthError && (
              <div className="mb-4 p-3 bg-[#3c3c3c] rounded text-left text-xs">
                <p className="font-semibold mb-2">Troubleshooting Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-[#cccccc]">
                  <li>Verify your FTP username and password are correct</li>
                  <li>Check if your FTP account is active and not locked</li>
                  <li>Ensure the FTP server allows connections from your IP address</li>
                  <li>Try connecting with an FTP client (FileZilla, WinSCP) to verify credentials</li>
                  <li>Update your website credentials in the settings if they've changed</li>
                </ol>
                <div className="mt-3 pt-3 border-t border-[#4a4a4a]">
                  <button
                    onClick={() => {
                      actions.clearError()
                      window.location.href = '/websites'
                    }}
                    className="text-[#0e639c] hover:text-[#1177bb] text-sm font-medium"
                  >
                    → Go to Website Settings
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-x-3">
              <button
                onClick={() => {
                  console.log('[Editor] Clearing error and reloading page...');
                  window.location.reload();
                }}
                className="px-4 py-2 bg-[#0e639c] text-white rounded hover:bg-[#1177bb] transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  console.log('[Editor] Clearing error and retrying...');
                  actions.clearError();
                  if (connectionId) {
                    actions.loadFileTree(connectionId);
                  }
                }}
                className="px-4 py-2 bg-[#3c3c3c] text-[#cccccc] rounded hover:bg-[#4a4a4a] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  console.log('[Editor] Dismissing error...');
                  actions.clearError();
                }}
                className="px-4 py-2 bg-[#3c3c3c] text-[#cccccc] rounded hover:bg-[#4a4a4a] transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
      </div>
    );
  }

  // Loading state
  if (state.isLoading && state.fileTree.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-full bg-[#1e1e1e] ${className}`}
        data-testid="editor-loading"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007acc] mx-auto mb-4"></div>
          <p className="text-[#cccccc]">Loading editor...</p>
        </div>
      </div>
    );
  }

  // VS Code-style layout
  return (
    <div
      className={`h-full flex bg-[#1e1e1e] ${className}`}
      data-testid="three-pane-editor"
    >
      {/* Activity Bar (VS Code style) */}
      <ActivityBar activeView={activeView} setActiveView={setActiveView} />

      {/* Sidebar */}
      {paneVisibility.tree && (
        <>
          <div
            className="bg-[#252526] border-r border-[#3e3e42] flex flex-col"
            style={{ width: layout.treeWidth }}
            data-testid="file-tree-pane"
          >
            {activeView === 'explorer' && <FileTreePane />}
            {activeView === 'search' && <SearchPane />}
            {activeView === 'settings' && <SettingsPane />}
          </div>

          {/* Resize Handle */}
          <div
            className="w-1 bg-[#1e1e1e] hover:bg-[#007acc] cursor-col-resize transition-colors group"
            onMouseDown={(e) => startResize('tree', e)}
            data-testid="tree-resize-handle"
          >
            <div className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]" data-testid="editor-pane">
        <EditorPane />
      </div>

      {/* Secondary Sidebar (Preview) */}
      {paneVisibility.preview && (
        <>
          {/* Resize Handle */}
          <div
            className="w-1 bg-[#1e1e1e] hover:bg-[#007acc] cursor-col-resize transition-colors group"
            onMouseDown={(e) => startResize('preview', e)}
            data-testid="preview-resize-handle"
          >
            <div className="w-full h-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div
            className="bg-[#252526] border-l border-[#3e3e42] flex flex-col"
            style={{ width: layout.previewWidth }}
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
 * Activity Bar (VS Code style) - Vertical icon bar on the far left
 */
function ActivityBar({ 
  activeView, 
  setActiveView 
}: { 
  activeView: string; 
  setActiveView: (view: 'explorer' | 'search' | 'settings') => void;
}) {
  const activities = [
    { id: 'explorer', icon: '📁', label: 'Explorer' },
    { id: 'search', icon: '🔍', label: 'Search' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ] as const;

  return (
    <div className="w-12 bg-[#2d2d30] flex flex-col items-center py-2 border-r border-[#3e3e42]">
      {activities.map((activity) => (
        <button
          key={activity.id}
          onClick={() => setActiveView(activity.id as any)}
          className={`w-10 h-10 mb-1 flex items-center justify-center rounded transition-colors ${
            activeView === activity.id
              ? 'bg-[#37373d] text-[#ffffff]'
              : 'text-[#cccccc] hover:bg-[#37373d]'
          }`}
          title={activity.label}
          data-testid={`activity-${activity.id}`}
        >
          <span className="text-xl">{activity.icon}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Search Pane Placeholder
 */
function SearchPane() {
  return (
    <div className="flex-1 flex flex-col bg-[#252526] text-[#cccccc]">
      <div className="p-4 border-b border-[#3e3e42]">
        <h3 className="text-sm font-semibold uppercase text-[#858585]">Search</h3>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[#858585]">Search functionality coming soon</p>
      </div>
    </div>
  );
}

/**
 * Settings Pane Placeholder
 */
function SettingsPane() {
  return (
    <div className="flex-1 flex flex-col bg-[#252526] text-[#cccccc]">
      <div className="p-4 border-b border-[#3e3e42]">
        <h3 className="text-sm font-semibold uppercase text-[#858585]">Settings</h3>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-[#858585]">Settings panel coming soon</p>
      </div>
    </div>
  );
}

/**
 * Status Bar (VS Code style) - Bottom bar
 */
function StatusBar() {
  const { state } = useEditor();

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-6 bg-[#007acc] text-white text-xs flex items-center px-4 z-50"
      data-testid="status-bar"
    >
      <div className="flex items-center space-x-2">
        <div
          className={`w-2 h-2 rounded-full ${state.connectionId ? 'bg-[#4ec9b0]' : 'bg-[#f48771]'}`}
          data-testid="connection-status"
        />
        <span className="font-medium">
          {state.connectionId ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {state.currentFile && (
        <>
          <span className="mx-2 text-[#ffffff80]">|</span>
          <span data-testid="current-file" className="font-medium">
            {state.currentFile.split('/').pop()}
          </span>
        </>
      )}

      {state.isDirty && (
        <>
          <span className="mx-2 text-[#ffffff80]">|</span>
          <span data-testid="dirty-indicator" className="text-[#ffcc00]">
            ● Unsaved
          </span>
        </>
      )}

      {state.lastSaved && (
        <>
          <span className="mx-2 text-[#ffffff80]">|</span>
          <span data-testid="last-saved" className="text-[#ffffff80]">
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
