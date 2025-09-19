/**
 * Core types for the three-pane FTP editor
 * Based on data model specification
 */

/**
 * Visibility state for the three editor panes
 */
export interface PaneVisibility {
  tree: boolean;      // Left pane - file tree
  editor: boolean;    // Center pane - Monaco editor
  preview: boolean;   // Right pane - file preview/metadata
}

/**
 * Layout configuration for pane sizing and arrangement
 */
export interface LayoutConfig {
  treeWidth: number;      // Left pane width (pixels)
  previewWidth: number;   // Right pane width (pixels)
  editorHeight: number;   // Editor pane height (pixels)
  orientation: 'horizontal' | 'vertical';
}

/**
 * Complete editor layout state
 */
export interface EditorLayout {
  paneVisibility: PaneVisibility;
  layout: LayoutConfig;
}

/**
 * FTP file or directory node
 */
export interface FTPFileNode {
  path: string;                 // Full FTP path
  name: string;                 // Display name
  type: 'file' | 'directory';   // Node type
  size: number;                 // File size in bytes (0 for directories)
  modified: Date;               // Last modification timestamp
  permissions: string;          // FTP permissions string
  children?: FTPFileNode[];     // Child nodes (for directories)
  isExpanded?: boolean;         // Whether directory is expanded in UI
  isLoaded?: boolean;           // Whether children have been loaded from FTP
}

/**
 * FTP connection configuration
 */
export interface FTPConnectionConfig {
  host: string;
  port: number;
  username: string;
  protocol: 'ftp' | 'ftps' | 'sftp';
  timeout: number;
  passive: boolean;
}

/**
 * Editor preferences
 */
export interface EditorPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  showMinimap: boolean;
  autoSave: boolean;
  autoSaveDelay: number; // milliseconds
}

/**
 * Current editor session state
 */
export interface EditorSession {
  sessionId: string;
  ftpConnection: FTPConnectionConfig;
  workingDirectory: string;
  recentFiles: string[];          // Recently accessed file paths (max 10)
  preferences: EditorPreferences;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Main editor state management interface
 */
export interface EditorState {
  currentFile: string | null;        // Path to currently open file
  selectedFile: string | null;       // Path to currently selected file in tree
  paneVisibility: PaneVisibility;    // Which panes are currently visible
  layout: LayoutConfig;              // Current pane sizes and arrangement
  connectionId: string;              // Active FTP connection identifier
  isDirty: boolean;                  // Whether current file has unsaved changes
  lastSaved: Date | null;            // Timestamp of last save operation
  session: EditorSession | null;     // Current editor session
  fileTree: FTPFileNode[];           // Loaded file tree
  fileContent: string;               // Current file content in editor
  isLoading: boolean;                // Loading state
  error: string | null;              // Current error message
}

/**
 * Editor state actions for reducer
 */
export type EditorAction =
  | { type: 'SET_CONNECTION'; payload: { connectionId: string; session: EditorSession } }
  | { type: 'SET_FILE_TREE'; payload: FTPFileNode[] }
  | { type: 'SELECT_FILE'; payload: string }
  | { type: 'LOAD_FILE_START'; payload: string }
  | { type: 'LOAD_FILE_SUCCESS'; payload: { content: string; file: string } }
  | { type: 'LOAD_FILE_ERROR'; payload: string }
  | { type: 'UPDATE_FILE_CONTENT'; payload: string }
  | { type: 'SAVE_FILE_START' }
  | { type: 'SAVE_FILE_SUCCESS'; payload: Date }
  | { type: 'SAVE_FILE_ERROR'; payload: string }
  | { type: 'UPDATE_PANE_VISIBILITY'; payload: Partial<PaneVisibility> }
  | { type: 'UPDATE_LAYOUT'; payload: Partial<LayoutConfig> }
  | { type: 'EXPAND_DIRECTORY'; payload: { path: string; children: FTPFileNode[] } }
  | { type: 'COLLAPSE_DIRECTORY'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'RESET_STATE' };

/**
 * File content response from API
 */
export interface FileContent {
  path: string;
  content: string;
  encoding: 'utf-8' | 'binary' | 'ascii';
  size: number;
  lastModified: string;
  permissions?: string;
  mimeType?: string;
}

/**
 * File preview response from API
 */
export interface FilePreview {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  lastModified: string;
  permissions?: string;
  mimeType?: string;
  preview?: {
    available: boolean;
    content?: string;          // First 1000 chars for text files
    thumbnail?: string;        // Base64 thumbnail for images
  };
}

/**
 * Default values for editor configuration
 */
export const DEFAULT_PANE_VISIBILITY: PaneVisibility = {
  tree: true,
  editor: true,
  preview: true
};

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  treeWidth: 300,
  previewWidth: 350,
  editorHeight: 600,
  orientation: 'horizontal'
};

export const DEFAULT_EDITOR_PREFERENCES: EditorPreferences = {
  theme: 'dark',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  showMinimap: true,
  autoSave: false,
  autoSaveDelay: 2000
};

/**
 * Initial editor state
 */
export const INITIAL_EDITOR_STATE: EditorState = {
  currentFile: null,
  selectedFile: null,
  paneVisibility: DEFAULT_PANE_VISIBILITY,
  layout: DEFAULT_LAYOUT_CONFIG,
  connectionId: '',
  isDirty: false,
  lastSaved: null,
  session: null,
  fileTree: [],
  fileContent: '',
  isLoading: false,
  error: null
};

/**
 * Validation utilities
 */
export const validateLayoutConfig = (layout: Partial<LayoutConfig>): boolean => {
  if (layout.treeWidth && (layout.treeWidth < 200 || layout.treeWidth > 800)) {
    return false;
  }
  if (layout.previewWidth && (layout.previewWidth < 200 || layout.previewWidth > 600)) {
    return false;
  }
  if (layout.editorHeight && layout.editorHeight < 300) {
    return false;
  }
  if (layout.orientation && !['horizontal', 'vertical'].includes(layout.orientation)) {
    return false;
  }
  return true;
};

export const validatePaneVisibility = (visibility: Partial<PaneVisibility>): boolean => {
  // At least one pane must be visible
  const visible = Object.values(visibility).filter(Boolean);
  return visible.length > 0;
};