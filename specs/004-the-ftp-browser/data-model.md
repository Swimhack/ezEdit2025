# Data Model: FTP Browser Three-Pane Editor

## Core Entities

### EditorState
Primary application state for the three-pane editor interface.

**Fields**:
- `currentFile: string | null` - Path to currently open file
- `selectedFile: string | null` - Path to currently selected file in tree
- `paneVisibility: PaneVisibility` - Which panes are currently visible
- `layout: LayoutConfig` - Current pane sizes and arrangement
- `connectionId: string` - Active FTP connection identifier
- `isDirty: boolean` - Whether current file has unsaved changes
- `lastSaved: Date | null` - Timestamp of last save operation

**Relationships**:
- Has one active FTP connection
- References one or more FTPFileNode entities
- Maintains one LayoutConfig

**Validation Rules**:
- `currentFile` must exist in connected FTP server if not null
- `connectionId` must reference valid, active FTP connection
- `selectedFile` must be valid FTP path format

**State Transitions**:
- `LOADING` → `READY` → `EDITING` → `SAVING` → `READY`
- `ERROR` state possible from any state

### FTPFileNode
Represents a file or directory in the FTP server file system.

**Fields**:
- `path: string` - Full FTP path to file/directory
- `name: string` - Display name (filename or directory name)
- `type: 'file' | 'directory'` - Node type
- `size: number` - File size in bytes (0 for directories)
- `modified: Date` - Last modification timestamp
- `permissions: string` - FTP permissions string
- `children: FTPFileNode[]` - Child nodes (for directories)
- `isExpanded: boolean` - Whether directory is expanded in UI
- `isLoaded: boolean` - Whether children have been loaded from FTP

**Relationships**:
- Parent-child hierarchy through `children` array
- References FTP connection for operations

**Validation Rules**:
- `path` must be valid FTP path format
- `type === 'directory'` required for nodes with children
- `size >= 0` always
- `permissions` must match FTP permission format

### EditorSession
Manages user session state and FTP connection details.

**Fields**:
- `sessionId: string` - Unique session identifier
- `ftpConnection: FTPConnectionConfig` - Connection configuration
- `workingDirectory: string` - Current FTP working directory
- `recentFiles: string[]` - Recently accessed file paths (max 10)
- `preferences: EditorPreferences` - User UI preferences
- `createdAt: Date` - Session creation timestamp
- `lastActivity: Date` - Last user activity timestamp

**Relationships**:
- Has one EditorState
- References multiple FTPFileNode entities
- Maintains FTP connection pool

**Validation Rules**:
- `sessionId` must be unique across active sessions
- `workingDirectory` must be valid FTP directory path
- `recentFiles` maximum 10 items, valid paths only
- Session expires after 8 hours of inactivity

## Supporting Types

### PaneVisibility
```typescript
interface PaneVisibility {
  tree: boolean;      // Left pane - file tree
  editor: boolean;    // Center pane - Monaco editor
  preview: boolean;   // Right pane - file preview/metadata
}
```

### LayoutConfig
```typescript
interface LayoutConfig {
  treeWidth: number;      // Left pane width (pixels)
  previewWidth: number;   // Right pane width (pixels)
  editorHeight: number;   // Editor pane height (pixels)
  orientation: 'horizontal' | 'vertical';
}
```

### FTPConnectionConfig
```typescript
interface FTPConnectionConfig {
  host: string;
  port: number;
  username: string;
  protocol: 'ftp' | 'ftps' | 'sftp';
  timeout: number;
  passive: boolean;
}
```

### EditorPreferences
```typescript
interface EditorPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  showMinimap: boolean;
  autoSave: boolean;
  autoSaveDelay: number; // milliseconds
}
```

## Data Flow

### File Loading Sequence
1. User selects file in tree → Update `selectedFile` in EditorState
2. User double-clicks file → Load file content via FTP API
3. File content received → Update `currentFile` and Monaco editor
4. Editor ready → Set state to `READY`

### File Saving Sequence
1. User edits file → Set `isDirty: true` in EditorState
2. User saves (Ctrl+S) → Set state to `SAVING`
3. Send content to FTP API → Update file on server
4. Save successful → Set `isDirty: false`, update `lastSaved`

### Directory Expansion
1. User clicks directory → Check `isLoaded` flag
2. If not loaded → Fetch children via FTP API
3. Populate `children` array → Set `isLoaded: true`
4. Set `isExpanded: true` → Update UI display