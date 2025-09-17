# Research: FTP Browser Three-Pane Editor

## Research Questions Resolved

### 1. Three-Pane Editor Layout Design
**Decision**: Left (file tree) + Center (editor) + Right (preview/metadata)
**Rationale**:
- Industry standard in VS Code, WebStorm, FileZilla
- Logical workflow: navigate → edit → preview
- Efficient screen real estate utilization
**Alternatives considered**:
- Top/bottom split: Poor for file trees
- Two-pane only: Missing preview functionality
- Tabs instead of panes: Reduces multitasking efficiency

### 2. Monaco Editor Integration Strategy
**Decision**: React Monaco Editor with custom FTP file provider
**Rationale**:
- Full-featured editor with syntax highlighting
- Existing integration with React ecosystem
- Supports large files with virtual scrolling
- Built-in diff view for file comparisons
**Alternatives considered**:
- CodeMirror: Less feature-rich
- Textarea with syntax highlighting: Poor UX
- ACE Editor: Legacy, less maintainability

### 3. FTP Error Handling & Loading States
**Decision**: Progressive loading with optimistic UI and graceful degradation
**Rationale**:
- FTP connections can be slow/unreliable
- Users need immediate feedback
- Skeleton states prevent layout shifts
**Alternatives considered**:
- Blocking load screens: Poor UX
- Silent failures: Confusing for users
- Infinite retry: Resource wasteful

### 4. Responsive Layout Strategy
**Decision**: CSS Grid with collapsible panes via React state
**Rationale**:
- CSS Grid handles complex layouts efficiently
- React state enables smooth pane show/hide
- Maintains accessibility across devices
**Alternatives considered**:
- Flexbox only: Difficult complex layouts
- CSS-only responsive: Limited interactivity
- Third-party layout library: Unnecessary dependency

### 5. File Caching and Performance
**Decision**: Client-side LRU cache with server-side connection pooling
**Rationale**:
- Reduces FTP roundtrips for recently accessed files
- Connection pooling minimizes connection overhead
- LRU prevents memory bloat
**Alternatives considered**:
- No caching: Poor performance
- Server-side only: Network overhead
- Aggressive caching: Stale data issues

## Technical Specifications

### Pane Responsibilities
- **Left Pane**: File tree navigation, directory expansion, file selection
- **Center Pane**: Monaco editor, syntax highlighting, file editing
- **Right Pane**: File metadata, preview for images/docs, minimap

### Breakpoint Behavior
- Desktop (1200px+): All three panes visible
- Tablet (768-1199px): Left pane collapsible, center+right visible
- Mobile (<768px): Single pane view with navigation

### Performance Targets
- Initial load: <2 seconds
- File switching: <500ms
- Smooth interactions: 60fps
- Directory loading: <1 second for 1000+ files

### Error Recovery Patterns
- Connection lost: Auto-retry with exponential backoff
- File too large: Warning with option to view read-only
- Permission denied: Clear error message with suggested actions
- Timeout: Retry button with connection status indicator