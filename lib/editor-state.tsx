/**
 * EditorState context provider for three-pane editor
 * Manages global state for file editing, layout, and FTP operations
 */

'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  EditorState,
  EditorAction,
  INITIAL_EDITOR_STATE,
  FTPFileNode,
  PaneVisibility,
  LayoutConfig,
  EditorSession,
  FileContent,
  FilePreview,
  validateLayoutConfig,
  validatePaneVisibility
} from './editor-types';

/**
 * Editor context interface
 */
interface EditorContextType {
  state: EditorState;
  actions: {
    // Connection management
    setConnection: (connectionId: string, session: EditorSession) => void;
    disconnect: () => void;

    // File tree operations
    loadFileTree: (connectionId: string) => Promise<void>;
    expandDirectory: (path: string) => Promise<void>;
    collapseDirectory: (path: string) => void;

    // File operations
    selectFile: (path: string) => void;
    loadFile: (path: string) => Promise<void>;
    saveFile: () => Promise<void>;
    updateFileContent: (content: string) => void;

    // Layout management
    updatePaneVisibility: (visibility: Partial<PaneVisibility>) => void;
    updateLayout: (layout: Partial<LayoutConfig>) => void;
    resetLayout: () => void;

    // Preview operations
    loadFilePreview: (path: string) => Promise<FilePreview | null>;

    // Error handling
    setError: (error: string | null) => void;
    clearError: () => void;

    // Session management
    saveLayoutToSession: () => Promise<void>;
    loadLayoutFromSession: () => Promise<void>;
  };
}

/**
 * Editor state reducer
 */
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_CONNECTION':
      return {
        ...state,
        connectionId: action.payload.connectionId,
        session: action.payload.session,
        error: null
      };

    case 'SET_FILE_TREE':
      return {
        ...state,
        fileTree: action.payload,
        isLoading: false,
        error: null
      };

    case 'SELECT_FILE':
      return {
        ...state,
        selectedFile: action.payload,
        error: null
      };

    case 'LOAD_FILE_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        currentFile: action.payload
      };

    case 'LOAD_FILE_SUCCESS':
      return {
        ...state,
        currentFile: action.payload.file,
        fileContent: action.payload.content,
        isLoading: false,
        isDirty: false,
        error: null
      };

    case 'LOAD_FILE_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        currentFile: null
      };

    case 'UPDATE_FILE_CONTENT':
      return {
        ...state,
        fileContent: action.payload,
        isDirty: state.fileContent !== action.payload
      };

    case 'SAVE_FILE_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'SAVE_FILE_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isDirty: false,
        lastSaved: action.payload,
        error: null
      };

    case 'SAVE_FILE_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    case 'UPDATE_PANE_VISIBILITY':
      const newVisibility = { ...state.paneVisibility, ...action.payload };
      if (!validatePaneVisibility(newVisibility)) {
        return { ...state, error: 'At least one pane must be visible' };
      }
      return {
        ...state,
        paneVisibility: newVisibility,
        error: null
      };

    case 'UPDATE_LAYOUT':
      if (!validateLayoutConfig(action.payload)) {
        return { ...state, error: 'Invalid layout configuration' };
      }
      return {
        ...state,
        layout: { ...state.layout, ...action.payload },
        error: null
      };

    case 'EXPAND_DIRECTORY':
      return {
        ...state,
        fileTree: updateFileTreeNode(state.fileTree, action.payload.path, {
          isExpanded: true,
          isLoaded: true,
          children: action.payload.children
        })
      };

    case 'COLLAPSE_DIRECTORY':
      return {
        ...state,
        fileTree: updateFileTreeNode(state.fileTree, action.payload, {
          isExpanded: false
        })
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'RESET_STATE':
      return {
        ...INITIAL_EDITOR_STATE
      };

    default:
      return state;
  }
}

/**
 * Utility function to update a node in the file tree
 */
function updateFileTreeNode(
  nodes: FTPFileNode[],
  path: string,
  updates: Partial<FTPFileNode>
): FTPFileNode[] {
  return nodes.map(node => {
    if (node.path === path) {
      return { ...node, ...updates };
    }
    if (node.children) {
      return {
        ...node,
        children: updateFileTreeNode(node.children, path, updates)
      };
    }
    return node;
  });
}

/**
 * Editor context
 */
const EditorContext = createContext<EditorContextType | null>(null);

/**
 * Editor context provider
 */
export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, INITIAL_EDITOR_STATE);

  // API base URL
  const apiBase = '/api/ftp/editor';

  /**
   * Connection management
   */
  const setConnection = useCallback((connectionId: string, session: EditorSession) => {
    dispatch({
      type: 'SET_CONNECTION',
      payload: { connectionId, session }
    });
  }, []);

  const disconnect = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  /**
   * Load file tree from FTP server
   */
  const loadFileTree = useCallback(async (websiteId: string, retryCount = 0) => {
    const MAX_RETRIES = 2; // Limit retries to prevent infinite loops

    if (retryCount > MAX_RETRIES) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to connect after multiple attempts. Please check your connection and try again later.'
      });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log(`[Editor] Loading file tree for website: ${websiteId}, attempt ${retryCount + 1}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      // Get website to use its path if configured
      const websiteResponse = await fetch(`/api/websites/${websiteId}`);
      let initialPath = '/';
      if (websiteResponse.ok) {
        const websiteData = await websiteResponse.json();
        if (websiteData.website?.path) {
          initialPath = websiteData.website.path || '/';
        }
      }

      const response = await fetch('/api/ftp/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, path: initialPath }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`[Editor] FTP list response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        const errorDetails = errorData.details || '';
        const errorCode = errorData.errorCode || '';

        console.error(`[Editor] FTP list error:`, {
          status: response.status,
          error: errorMessage,
          details: errorDetails,
          errorCode: errorCode
        });

        // Provide specific user-friendly error messages
        if (response.status === 404) {
          throw new Error('Website not found. Please check your connection settings.');
        } else if (response.status === 401 || errorCode === '530') {
          // Authentication errors - provide actionable guidance
          const authError = errorMessage + (errorDetails ? ` ${errorDetails}` : '');
          throw new Error(authError + ' You can update your credentials in the website settings.');
        } else if (response.status === 503) {
          throw new Error('Cannot connect to FTP server. Please check if the server is available.');
        } else if (response.status === 429) {
          // For rate limiting, suggest a longer wait
          throw new Error('Too many requests. The server is busy. Please wait 30 seconds and try again.');
        } else {
          throw new Error(`Failed to connect: ${errorMessage}${errorDetails ? ` ${errorDetails}` : ''}`);
        }
      }

      const result = await response.json();

      console.log(`[Editor] FTP list response:`, {
        success: result.success,
        fileCount: result.files?.length || 0,
        path: result.path,
        connectionId: result.connectionId
      });

      // Check if the response has the expected structure
      if (!result.success) {
        console.error(`[Editor] API returned success=false:`, result);
        throw new Error(result.error || 'Failed to load file tree from server');
      }
      
      if (!Array.isArray(result.files)) {
        console.error(`[Editor] Invalid response structure - files is not an array:`, {
          files: result.files,
          filesType: typeof result.files,
          fullResult: result
        });
        throw new Error('Invalid response from server: files is not an array');
      }

      // Debug: Log raw files before processing
      console.log(`[Editor] Raw files from API:`, {
        fileCount: result.files?.length || 0,
        files: result.files?.slice(0, 5), // Log first 5 files for debugging
        path: result.path,
        originalPath: result.originalPath
      });

      // Ensure we have an array
      const rawFiles = Array.isArray(result.files) ? result.files : [];
      
      // Process files with better error handling
      const fileTree: FTPFileNode[] = rawFiles
        .map((item: any, index: number) => {
          try {
            // Validate required fields
            if (!item) {
              console.warn(`[Editor] Skipping null/undefined item at index ${index}`);
              return null;
            }
            
            if (!item.name) {
              console.warn(`[Editor] Skipping item without name at index ${index}:`, item);
              return null;
            }
            
            if (!item.path) {
              console.warn(`[Editor] Item missing path, using name:`, item.name);
              // Try to construct path from name and result path
              const basePath = result.path || result.originalPath || '/';
              item.path = basePath === '/' ? `/${item.name}` : `${basePath}/${item.name}`;
            }

            return {
              path: item.path,
              name: item.name || 'unknown',
              type: item.type === 'directory' ? 'directory' : 'file',
              size: Number(item.size) || 0,
              modified: new Date(item.modified || Date.now()),
              permissions: item.permissions || '',
              isExpanded: false,
              isLoaded: item.type === 'directory' ? false : true,
              children: item.type === 'directory' ? [] : undefined
            };
          } catch (error) {
            console.error(`[Editor] Error processing file item at index ${index}:`, error, item);
            return null;
          }
        })
        .filter((item: any) => item !== null); // Filter out null items

      console.log(`[Editor] File tree loaded successfully:`, {
        rawFileCount: rawFiles.length,
        processedFileCount: fileTree.length,
        directories: fileTree.filter(f => f.type === 'directory').length,
        files: fileTree.filter(f => f.type === 'file').length,
        sampleFiles: fileTree.slice(0, 3).map(f => ({ name: f.name, path: f.path, type: f.type }))
      });

      // Always set the file tree, even if empty (to clear loading state)
      dispatch({ type: 'SET_FILE_TREE', payload: fileTree });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // If no files found, log a warning but don't throw an error
      if (fileTree.length === 0) {
        console.warn(`[Editor] File tree is empty after processing`, {
          rawFileCount: rawFiles.length,
          path: result.path,
          originalPath: result.originalPath,
          websiteId
        });
      }
    } catch (error) {
      console.error('[Editor] Failed to load file tree:', error);
      dispatch({ type: 'SET_LOADING', payload: false });

      if (error instanceof Error && error.name === 'AbortError') {
        dispatch({
          type: 'SET_ERROR',
          payload: 'Connection timed out. The server may be busy or unavailable.'
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load file tree';
        
        // Retry if not authentication error
        if (retryCount < MAX_RETRIES && !errorMessage.includes('Authentication')) {
          console.log(`[Editor] Retrying file tree load (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
          setTimeout(() => {
            loadFileTree(websiteId, retryCount + 1);
          }, 2000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        dispatch({
          type: 'SET_ERROR',
          payload: errorMessage
        });
      }
    }
  }, []);

  /**
   * Expand directory and load children with retry logic
   */
  const expandDirectory = useCallback(async (path: string) => {
    if (!state.connectionId) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    const MAX_RETRIES = 3;
    let retries = MAX_RETRIES;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch('/api/ftp/list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ websiteId: state.connectionId, path }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          
          // Don't retry on certain errors
          if (response.status === 401 || response.status === 403 || response.status === 404) {
            throw new Error(errorMessage);
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();

        // Check if the response has the expected structure
        if (!result.success || !Array.isArray(result.files)) {
          throw new Error('Invalid response from server. Please try again.');
        }

        const children: FTPFileNode[] = (result.files || []).map((item: any) => ({
          path: item.path,
          name: item.name,
          type: item.type === 'directory' ? 'directory' : 'file',
          size: Number(item.size) || 0,
          modified: new Date(item.modified || Date.now()),
          permissions: item.permissions || '',
          isExpanded: false,
          isLoaded: item.type === 'directory' ? false : true,
          children: item.type === 'directory' ? [] : undefined
        }));
        
        dispatch({
          type: 'EXPAND_DIRECTORY',
          payload: { path, children }
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        retries--;

        if (retries > 0 && !(error instanceof Error && error.name === 'AbortError')) {
          // Wait before retry (exponential backoff)
          const delay = (MAX_RETRIES - retries) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    // All retries failed
    dispatch({ type: 'SET_LOADING', payload: false });
    
    if (lastError instanceof Error && lastError.name === 'AbortError') {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Connection timed out while loading directory. Please try again.'
      });
    } else {
      dispatch({
        type: 'SET_ERROR',
        payload: lastError instanceof Error ? lastError.message : 'Failed to expand directory'
      });
    }
  }, [state.connectionId]);

  /**
   * Collapse directory
   */
  const collapseDirectory = useCallback((path: string) => {
    dispatch({ type: 'COLLAPSE_DIRECTORY', payload: path });
  }, []);

  /**
   * Select file in tree
   */
  const selectFile = useCallback((path: string) => {
    dispatch({ type: 'SELECT_FILE', payload: path });
  }, []);

  /**
   * Load file content for editing
   */
  const loadFile = useCallback(async (path: string) => {
    if (!state.connectionId) {
      console.error('[Editor] Cannot load file: No connection ID');
      return;
    }

    console.log('[Editor] Loading file:', path);
    dispatch({ type: 'LOAD_FILE_START', payload: path });

    try {
      const response = await fetch(`${apiBase}/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: state.connectionId,
          filePath: path
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to load file: ${response.statusText}`);
      }

      const fileContent: FileContent = await response.json();
      // Handle both response formats: { content } and { content, path, ... }
      const content = fileContent.content || (fileContent as any).content || '';
      
      console.log('[Editor] File loaded successfully:', {
        path,
        contentLength: content.length,
        hasContent: !!content
      });
      
      dispatch({
        type: 'LOAD_FILE_SUCCESS',
        payload: { content, file: path }
      });
    } catch (error) {
      console.error('[Editor] Failed to load file:', error);
      dispatch({
        type: 'LOAD_FILE_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to load file'
      });
    }
  }, [state.connectionId, apiBase]);

  /**
   * Save current file
   */
  const saveFile = useCallback(async () => {
    if (!state.connectionId || !state.currentFile) return;

    dispatch({ type: 'SAVE_FILE_START' });

    try {
      const response = await fetch(`${apiBase}/file`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: state.connectionId,
          filePath: state.currentFile,
          content: state.fileContent
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`);
      }

      const result = await response.json();
      dispatch({
        type: 'SAVE_FILE_SUCCESS',
        payload: new Date(result.lastModified)
      });
    } catch (error) {
      dispatch({
        type: 'SAVE_FILE_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to save file'
      });
    }
  }, [state.connectionId, state.currentFile, state.fileContent, apiBase]);

  /**
   * Update file content
   */
  const updateFileContent = useCallback((content: string) => {
    dispatch({ type: 'UPDATE_FILE_CONTENT', payload: content });
  }, []);

  /**
   * Update pane visibility
   */
  const updatePaneVisibility = useCallback((visibility: Partial<PaneVisibility>) => {
    dispatch({ type: 'UPDATE_PANE_VISIBILITY', payload: visibility });
  }, []);

  /**
   * Update layout configuration
   */
  const updateLayout = useCallback((layout: Partial<LayoutConfig>) => {
    dispatch({ type: 'UPDATE_LAYOUT', payload: layout });
  }, []);

  /**
   * Reset layout to defaults
   */
  const resetLayout = useCallback(() => {
    dispatch({
      type: 'UPDATE_LAYOUT',
      payload: INITIAL_EDITOR_STATE.layout
    });
    dispatch({
      type: 'UPDATE_PANE_VISIBILITY',
      payload: INITIAL_EDITOR_STATE.paneVisibility
    });
  }, []);

  /**
   * Load file preview
   */
  const loadFilePreview = useCallback(async (path: string): Promise<FilePreview | null> => {
    if (!state.connectionId) return null;

    try {
      const response = await fetch(`${apiBase}/preview?websiteId=${state.connectionId}&filePath=${encodeURIComponent(path)}`);
      if (!response.ok) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to load file preview:', error);
      return null;
    }
  }, [state.connectionId, apiBase]);

  /**
   * Error handling
   */
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  /**
   * Save layout to session
   */
  const saveLayoutToSession = useCallback(async () => {
    if (!state.connectionId) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      await fetch(`${apiBase}/layout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: state.connectionId,
          paneVisibility: state.paneVisibility,
          layout: state.layout
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Layout save request timed out');
      } else {
        console.error('Failed to save layout:', error);
      }
    }
  }, [state.connectionId, state.paneVisibility, state.layout, apiBase]);

  /**
   * Load layout from session
   */
  const loadLayoutFromSession = useCallback(async () => {
    if (!state.connectionId) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${apiBase}/layout?websiteId=${state.connectionId}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const layout = await response.json();
        if (layout.paneVisibility) {
          dispatch({ type: 'UPDATE_PANE_VISIBILITY', payload: layout.paneVisibility });
        }
        if (layout.layout) {
          dispatch({ type: 'UPDATE_LAYOUT', payload: layout.layout });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Layout load request timed out');
      } else {
        console.error('Failed to load layout:', error);
      }
      // Don't propagate layout loading errors to prevent infinite retries
    }
  }, [state.connectionId, apiBase]);

  // Auto-save layout changes (disabled to prevent infinite retries)
  // useEffect(() => {
  //   if (state.connectionId) {
  //     const timer = setTimeout(() => {
  //       saveLayoutToSession();
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [state.paneVisibility, state.layout, saveLayoutToSession]);

  const contextValue: EditorContextType = {
    state,
    actions: {
      setConnection,
      disconnect,
      loadFileTree,
      expandDirectory,
      collapseDirectory,
      selectFile,
      loadFile,
      saveFile,
      updateFileContent,
      updatePaneVisibility,
      updateLayout,
      resetLayout,
      loadFilePreview,
      setError,
      clearError,
      saveLayoutToSession,
      loadLayoutFromSession
    }
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

/**
 * Hook to use editor context
 */
export function useEditor(): EditorContextType {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}

/**
 * Hook for file operations
 */
export function useFileOperations() {
  const { state, actions } = useEditor();

  return {
    currentFile: state.currentFile,
    selectedFile: state.selectedFile,
    fileContent: state.fileContent,
    isDirty: state.isDirty,
    isLoading: state.isLoading,
    lastSaved: state.lastSaved,
    selectFile: actions.selectFile,
    loadFile: actions.loadFile,
    saveFile: actions.saveFile,
    updateContent: actions.updateFileContent
  };
}

/**
 * Hook for layout management
 */
export function useLayout() {
  const { state, actions } = useEditor();

  return {
    paneVisibility: state.paneVisibility,
    layout: state.layout,
    updatePaneVisibility: actions.updatePaneVisibility,
    updateLayout: actions.updateLayout,
    resetLayout: actions.resetLayout
  };
}

/**
 * Hook for file tree operations
 */
export function useFileTree() {
  const { state, actions } = useEditor();

  return {
    fileTree: state.fileTree,
    isLoading: state.isLoading,
    expandDirectory: actions.expandDirectory,
    collapseDirectory: actions.collapseDirectory,
    loadFileTree: actions.loadFileTree
  };
}