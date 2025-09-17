# EzEdit.co - Claude Code Assistant Notes

## THREE-PANE FTP EDITOR IMPLEMENTATION (Feature 004)

### Current Focus: Fix FTP Browser Editor Loading
- **Problem**: "Edit files" button on dashboard card not loading three-pane editor
- **Solution**: Implement responsive three-pane layout with file tree, Monaco editor, and preview
- **Status**: Implementation planning complete, ready for task execution

### Three-Pane Layout Design
- **Left Pane**: File tree navigation with FTP directory expansion
- **Center Pane**: Monaco Editor with syntax highlighting for file editing
- **Right Pane**: File metadata, preview content, and minimap display
- **Responsive**: Collapsible panes for tablet/mobile (768px breakpoints)

### Technical Stack for Editor
- **Frontend**: Next.js 14 + React 18 + TypeScript 5.0+
- **Editor**: Monaco Editor (VS Code editor component)
- **Styling**: Tailwind CSS + CSS Grid for layout
- **FTP Client**: basic-ftp library for server connections
- **State Management**: React hooks + Context for editor state

### API Contracts Defined
- `GET /api/ftp/editor/layout` - Editor configuration
- `POST /api/ftp/editor/file` - Load file for editing
- `PUT /api/ftp/editor/file` - Save file changes
- `GET /api/ftp/editor/preview` - File metadata and preview

### Key Implementation Files
- **Frontend Components**: `components/editor/ThreePaneEditor.tsx`
- **API Routes**: `app/api/ftp/editor/` endpoints
- **State Management**: `lib/editor-state.ts`
- **FTP Operations**: `lib/file-operations.ts`

## EXISTING FTP INFRASTRUCTURE (Working)

### FTP List API Implementation ✅
- **Endpoint**: `/api/ftp/list` - Returns file directory tree structure
- **Features**: File vs directory detection, security validation, error handling
- **Integration**: Pino logger, connection pooling, legacy server support

### FTP Connection Management ✅
- **Library**: `lib/ftp-connections.ts` - Robust connection pooling
- **Features**: Keepalive, reconnection logic, cleanup, task queuing
- **Configuration**: `lib/ftp-config.ts` - Legacy server presets and timeouts

### File Type Detection ✅
- **Logic**: Extension-based authority (`type === 1` directory, `type === 0` file)
- **Security**: Server-side blocking of file-as-directory attempts
- **Validation**: Comprehensive error handling for FTP edge cases

## RECENT CHANGES (Latest Session)
- ✅ **FTP API Implementation**: Complete file listing endpoint with error handling
- ✅ **Connection Management**: Pooling, keepalive, and reconnection logic
- ✅ **Build Fixes**: Resolved TypeScript compilation errors for deployment
- ✅ **Deployment**: Successfully deployed to https://ezedit-co.fly.dev
- 🔄 **Current**: Working on three-pane editor implementation for dashboard

## DEVELOPMENT PATTERNS

### Test-Driven Development
- **Order**: Contract tests → Integration tests → E2E tests → Unit tests
- **Requirement**: Tests MUST fail before implementation (RED-GREEN-Refactor)
- **Tools**: Jest + React Testing Library + Playwright for E2E

### Performance Targets
- **Load Time**: <2s initial editor load, <500ms file switching
- **Directory Loading**: <1s for 1000+ files
- **UI Interactions**: 60fps smooth interactions
- **File Size**: Support up to 10MB for editing

### Error Handling Patterns
- **Connection Loss**: Auto-retry with exponential backoff
- **Large Files**: Warning with read-only option
- **Permissions**: Clear error messages with suggested actions
- **Timeouts**: Retry button with connection status indicator

## PROJECT STRUCTURE
```
app/
├── api/ftp/           # FTP API endpoints (working)
├── dashboard/         # Dashboard UI (needs editor integration)
└── editor/           # Three-pane editor (to implement)

components/
├── editor/           # Three-pane editor components (to implement)
├── ftp/             # FTP browser components (working)
└── ui/              # Shared UI components

lib/
├── ftp-client.ts    # FTP connection management (working)
├── ftp-config.ts    # FTP configuration (working)
├── editor-state.ts  # Editor state management (to implement)
└── file-operations.ts # File utilities (to implement)
```

## NEXT TASKS (Ready for /tasks command)
1. Implement three-pane editor React components
2. Create editor API endpoints for file operations
3. Integrate Monaco Editor with FTP file loading
4. Add responsive layout with CSS Grid
5. Implement file save/load workflows
6. Add comprehensive error handling and user feedback

---
*Feature 004 Planning Complete - Ready for task execution phase*