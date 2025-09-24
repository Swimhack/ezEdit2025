# Data Model: Fix File Display with Split Screen Editor

**Feature**: 014-please-fix-the | **Date**: 2025-09-20

## Core Entities

### 1. File Content Entity

**Purpose**: Represents file data with metadata for optimal editor display and caching

```typescript
interface FileContent {
  // Core identification
  id: string;                     // Unique file identifier
  path: string;                   // Full file path
  filename: string;               // File name with extension

  // Content data
  content: string;                // Raw file content
  encoding: FileEncoding;         // UTF-8, ASCII, Binary, etc.
  size: number;                   // File size in bytes
  hash: string;                   // Content hash for change detection

  // File type information
  mimeType: string;               // MIME type (text/plain, text/html, etc.)
  language: string;               // Programming language for syntax highlighting
  fileType: FileType;             // Categorized file type

  // Processing metadata
  isProcessed: boolean;           // Whether content has been processed for display
  processedContent?: string;      // Processed content for WYSIWYG display
  syntaxHighlighted?: string;     // Pre-processed syntax highlighted content

  // Caching and performance
  lastModified: Date;             // File last modification time
  lastAccessed: Date;             // Last time file was accessed
  cacheExpiry?: Date;             // When cached content expires

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `path` must be valid file path format
- `size` must be positive number ≤ 10MB (hard limit)
- `content` required for files ≤ 5MB, optional for larger files
- `mimeType` must be valid MIME type format
- `hash` must be SHA-256 hash of content

### 2. Editor State Entity

**Purpose**: Manages user's editor configuration and current session state

```typescript
interface EditorState {
  // Core identification
  id: string;                     // Unique state identifier
  userId: string;                 // Associated user ID
  sessionId: string;              // Browser session identifier

  // Current file context
  activeFileId?: string;          // Currently open file
  openFiles: string[];            // List of open file IDs (tab management)

  // View configuration
  currentMode: ViewMode;          // CODE, WYSIWYG, or SPLIT
  splitRatio: number;             // Split pane ratio (0.0-1.0)
  leftPaneMode: ViewMode;         // Left pane view mode (for split)
  rightPaneMode: ViewMode;        // Right pane view mode (for split)

  // Editor settings
  fontSize: number;               // Editor font size
  theme: EditorTheme;             // Light, Dark, High Contrast
  wordWrap: boolean;              // Enable word wrapping
  lineNumbers: boolean;           // Show line numbers
  minimap: boolean;               // Show minimap

  // Window state
  sidebarCollapsed: boolean;      // File tree sidebar state
  panelHeight: number;            // Bottom panel height
  windowWidth: number;            // Browser window width
  windowHeight: number;           // Browser window height

  // Performance settings
  performanceMode: PerformanceMode; // AUTO, ENHANCED, REDUCED
  maxFileSize: number;            // User's max file size preference
  syntaxHighlighting: boolean;    // Enable syntax highlighting

  // Audit trail
  lastSaved: Date;                // When state was last persisted
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `userId` must reference valid user account
- `splitRatio` must be between 0.1 and 0.9
- `fontSize` must be between 8 and 72
- `maxFileSize` must be between 1MB and 10MB
- `windowWidth` and `windowHeight` must be positive

### 3. File Type Configuration Entity

**Purpose**: Defines supported file types and their available view modes

```typescript
interface FileTypeConfiguration {
  // Core identification
  id: string;                     // Unique configuration ID
  extension: string;              // File extension (.js, .md, .html)
  mimeType: string;               // Associated MIME type

  // Display information
  displayName: string;            // Human-readable name
  icon: string;                   // Icon identifier or path
  category: FileCategory;         // CODE, DOCUMENT, MARKUP, DATA, etc.

  // Supported features
  supportedModes: ViewMode[];     // Available view modes
  defaultMode: ViewMode;          // Default view mode for this type
  syntaxHighlighting: boolean;    // Supports syntax highlighting
  wysiwyggPreview: boolean;       // Supports WYSIWYG preview

  // Processing configuration
  preprocessor?: string;          // Preprocessor for content (markdown, etc.)
  sanitization: SanitizationLevel; // Required sanitization level
  maxFileSize: number;            // Max size for this file type

  // Language settings
  language: string;               // Programming language identifier
  languageFeatures: LanguageFeature[]; // Supported language features

  // Configuration metadata
  isEnabled: boolean;             // Whether this type is currently enabled
  priority: number;               // Display priority in lists

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `extension` must start with dot and contain valid characters
- `mimeType` must be valid MIME type format
- `supportedModes` must contain at least one mode
- `defaultMode` must be included in `supportedModes`
- `maxFileSize` must be ≤ global max file size
- `priority` must be positive integer

### 4. User Preferences Entity

**Purpose**: Stores user's personalized editor preferences and settings

```typescript
interface UserPreferences {
  // Core identification
  id: string;                     // Unique preference set ID
  userId: string;                 // Associated user ID

  // File type preferences
  fileTypePreferences: Map<string, FileTypePreference>; // Per file type settings
  globalDefaults: GlobalEditorDefaults; // Default settings

  // View mode preferences
  preferredMode: ViewMode;        // User's preferred default mode
  autoSwitchModes: boolean;       // Auto-switch based on file type
  rememberLastMode: boolean;      // Remember last used mode per file type

  // Split screen preferences
  defaultSplitRatio: number;      // Preferred split ratio
  splitOrientation: SplitOrientation; // HORIZONTAL or VERTICAL
  syncScrolling: boolean;         // Sync scroll between panes
  independentModes: boolean;      // Allow different modes per pane

  // Performance preferences
  performanceMode: PerformanceMode; // User's performance preference
  lazyLoading: boolean;           // Enable lazy loading of large files
  previewTimeout: number;         // Timeout for WYSIWYG preview generation

  // Accessibility preferences
  highContrast: boolean;          // High contrast mode
  fontSize: number;               // Preferred font size
  reducedMotion: boolean;         // Reduce animations
  screenReaderOptimized: boolean; // Screen reader optimizations

  // Workflow preferences
  autoSave: boolean;              // Enable auto-save
  autoSaveInterval: number;       // Auto-save interval in seconds
  confirmUnsavedChanges: boolean; // Confirm before losing changes
  showWhitespace: boolean;        // Show whitespace characters

  // Notification preferences
  showPerformanceWarnings: boolean; // Show file size warnings
  showModeHints: boolean;         // Show hints about optimal modes
  enableKeyboardShortcuts: boolean; // Enable keyboard shortcuts

  // Audit trail
  lastSynced: Date;               // When preferences were last synced
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `userId` must reference valid user account
- `defaultSplitRatio` must be between 0.1 and 0.9
- `fontSize` must be between 8 and 72
- `autoSaveInterval` must be between 30 and 3600 seconds
- `previewTimeout` must be between 1000 and 10000 milliseconds

## Enumerations

### ViewMode
```typescript
enum ViewMode {
  CODE = 'CODE',                  // Code editor view
  WYSIWYG = 'WYSIWYG',           // Visual preview view
  SPLIT = 'SPLIT'                 // Split screen view
}
```

### FileType
```typescript
enum FileType {
  CODE = 'CODE',                  // Programming code files
  MARKUP = 'MARKUP',              // HTML, Markdown, XML
  STYLESHEET = 'STYLESHEET',      // CSS, SCSS, LESS
  DATA = 'DATA',                  // JSON, YAML, XML
  DOCUMENT = 'DOCUMENT',          // Text documents
  CONFIG = 'CONFIG',              // Configuration files
  BINARY = 'BINARY',              // Binary files (images, etc.)
  UNKNOWN = 'UNKNOWN'             // Unknown or unsupported types
}
```

### FileEncoding
```typescript
enum FileEncoding {
  UTF8 = 'UTF-8',
  ASCII = 'ASCII',
  UTF16 = 'UTF-16',
  BINARY = 'BINARY',
  ISO_8859_1 = 'ISO-8859-1'
}
```

### EditorTheme
```typescript
enum EditorTheme {
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  HIGH_CONTRAST = 'HIGH_CONTRAST',
  AUTO = 'AUTO'                   // Follow system preference
}
```

### PerformanceMode
```typescript
enum PerformanceMode {
  AUTO = 'AUTO',                  // Automatic based on file size
  ENHANCED = 'ENHANCED',          // Full features enabled
  REDUCED = 'REDUCED'             // Reduced features for performance
}
```

### SplitOrientation
```typescript
enum SplitOrientation {
  HORIZONTAL = 'HORIZONTAL',      // Side-by-side split
  VERTICAL = 'VERTICAL'           // Top-bottom split
}
```

### SanitizationLevel
```typescript
enum SanitizationLevel {
  NONE = 'NONE',                  // No sanitization needed
  BASIC = 'BASIC',                // Basic HTML sanitization
  STRICT = 'STRICT',              // Strict sanitization
  PARANOID = 'PARANOID'           // Maximum security sanitization
}
```

### FileCategory
```typescript
enum FileCategory {
  CODE = 'CODE',
  DOCUMENT = 'DOCUMENT',
  MARKUP = 'MARKUP',
  DATA = 'DATA',
  CONFIG = 'CONFIG',
  STYLE = 'STYLE',
  MEDIA = 'MEDIA',
  ARCHIVE = 'ARCHIVE'
}
```

### LanguageFeature
```typescript
enum LanguageFeature {
  SYNTAX_HIGHLIGHTING = 'SYNTAX_HIGHLIGHTING',
  AUTO_COMPLETION = 'AUTO_COMPLETION',
  ERROR_CHECKING = 'ERROR_CHECKING',
  CODE_FOLDING = 'CODE_FOLDING',
  BRACKET_MATCHING = 'BRACKET_MATCHING',
  INDENTATION = 'INDENTATION'
}
```

## Entity Relationships

### Primary Relationships
1. **EditorState** ← (1:0..1) → **FileContent**
   - Editor state may reference currently active file
   - File content can be opened in zero or one editor state

2. **UserPreferences** ← (1:1) → **User Account**
   - Each user has exactly one preference set
   - Preferences belong to specific user

3. **FileTypeConfiguration** ← (0..*:0..*) → **UserPreferences**
   - File type configurations influence user preferences
   - Users can override file type defaults

4. **EditorState** ← (1:0..*) → **FileContent**
   - Editor state can reference multiple open files
   - Files can be referenced by multiple editor sessions

### State Transitions

#### View Mode Flow
```
CODE ←→ WYSIWYG ←→ SPLIT
  ↓        ↓        ↓
    [Performance degradation]
  ↓        ↓        ↓
REDUCED ← AUTO → ENHANCED
```

#### File Loading Process
```
REQUESTED → LOADING → LOADED → PROCESSED
    ↓         ↓         ↓         ↓
  ERROR ← TIMEOUT ← FAILED ← CORRUPTED
```

#### Editor State Lifecycle
```
INITIALIZING → READY → ACTIVE → SAVING → SAVED
      ↓          ↓       ↓        ↓       ↓
    ERROR ← TIMEOUT ← DIRTY ← ERROR ← RESTORED
```

## Data Validation Rules

### Cross-Entity Constraints
1. **File Size Consistency**: FileContent.size must match UserPreferences.maxFileSize limits
2. **Mode Availability**: EditorState.currentMode must be supported by FileTypeConfiguration.supportedModes
3. **Theme Consistency**: EditorState.theme must be compatible with UserPreferences.highContrast setting
4. **Performance Alignment**: PerformanceMode must be consistent across EditorState and UserPreferences

### Business Rules
1. **File Type Registration**: New file types must be registered in FileTypeConfiguration before use
2. **User Preference Inheritance**: Missing user preferences default to global system defaults
3. **Split Mode Requirements**: Split mode requires at least 1200px viewport width for usability
4. **Cache Validity**: FileContent.cacheExpiry must be respected for content freshness

## Indexing Strategy

### Performance Indexes
- `FileContent.path` (unique index for file lookups)
- `FileContent.hash + lastModified` (for change detection)
- `EditorState.userId + sessionId` (for user session queries)
- `FileTypeConfiguration.extension` (for file type resolution)
- `UserPreferences.userId` (for preference lookups)

### Search Indexes
- `FileContent.content` (full-text search for file content)
- `FileTypeConfiguration.displayName` (for file type search)

## Data Retention Policies

### Retention Periods
- **FileContent**: Cache for 24 hours, purge based on LRU
- **EditorState**: 30 days after last access
- **FileTypeConfiguration**: Indefinite (system configuration)
- **UserPreferences**: Indefinite (until user deletion)

### Cleanup Procedures
- **Expired Content**: Hourly cleanup of expired file content cache
- **Stale Sessions**: Daily cleanup of inactive editor states
- **Orphaned Preferences**: Weekly cleanup of preferences for deleted users
- **Performance Optimization**: Monthly optimization of file content indexes

## Changes from Current System

### Enhanced Entities
- **FileContent**: Added caching, processing metadata, and performance optimization
- **EditorState**: New entity for comprehensive state management
- **UserPreferences**: Enhanced with accessibility and performance settings

### New Capabilities
- **Split Screen Support**: Complete split pane management
- **WYSIWYG Preview**: Rich content rendering for supported file types
- **Performance Management**: Adaptive performance based on file size and capabilities
- **User Customization**: Comprehensive preference system for personalized experience

### Improved Performance
- **Content Caching**: Intelligent caching strategy for frequently accessed files
- **Lazy Loading**: On-demand content loading for large files
- **Progressive Enhancement**: Graceful degradation for performance optimization