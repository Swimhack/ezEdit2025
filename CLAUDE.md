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

## ENHANCED LOGGING SYSTEM (Feature 011) ✅

### Comprehensive Logging Design Complete
- **Specification**: Enhanced logging for FTP and editor troubleshooting completed
- **Research**: Technology decisions finalized (Pino + tiered storage + SSE streaming)
- **Data Model**: Complete entity design with FTP/Editor specific log types
- **API Contracts**: OpenAPI specification for enhanced /logs endpoints
- **Testing**: Logs endpoint validated at https://ezeditapp.fly.dev/logs?pass=1234

### Current Logging Infrastructure ✅
- **Endpoint**: `/logs?pass=1234` - Production-ready with authentication
- **API**: `/api/logs` - Returns JSON log data with bearer token auth
- **Security**: Proper password protection and unauthorized access prevention
- **UI**: Terminal-style interface with refresh functionality
- **Performance**: 898ms load time, responsive design across devices

### Implementation Status (Feature 011)
- ✅ **Phase 0**: Research complete with technology decisions
- ✅ **Phase 1**: Design complete with data model and contracts
- ✅ **Testing**: E2E tests created and passed (11/11 tests)
- ⏭️ **Phase 2**: Ready for /tasks command to generate implementation tasks

## RECENT CHANGES (Latest Session)
- ✅ **Enhanced Logging Design**: Complete specification and planning for Feature 011
- ✅ **Logs Endpoint Testing**: Comprehensive E2E validation with Playwright
- ✅ **API Contracts**: OpenAPI spec for enhanced logging endpoints
- ✅ **Data Model**: FTP and Editor specific log entity design
- ✅ **Research**: Technology stack decisions for production logging
- ✅ **Existing Logs**: Validated current /logs functionality works correctly
- 🔄 **Current**: Ready to implement enhanced logging features (Feature 011)
- 📋 **Next**: Three-pane FTP editor improvements (Feature 004)

## CRITICAL BUG FIX (Current Priority)

### Storage System Mismatch Issue
- **Problem**: FTP editor shows "Editor Error - Failed to fetch" when loading
- **Root Cause**: Website API uses `websites-memory-store.ts`, FTP editor uses `websites-store.ts`
- **Impact**: Websites added via dashboard not found by editor APIs
- **Solution**: Align all APIs to use `websites-memory-store.ts`

### Key Files Requiring Updates
- **`app/api/ftp/editor/file/route.ts`**: Change import to memory store
- **`app/api/ftp/list/route.ts`**: Change import to memory store
- **`lib/editor-state.tsx`**: Enhanced error handling with structured errors
- **`components/editor/ThreePaneEditor.tsx`**: Improved error UI with retry functionality

### Error Handling Enhancement
- **Structured Errors**: Categorized error types (connection, auth, server, config)
- **User-Friendly Messages**: Specific error messages with suggested actions
- **Retry Mechanisms**: "Try Again" functionality without page refresh
- **Connection Testing**: Validate FTP connection before editor initialization

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

## SPECIFICATION CONSOLIDATION SYSTEM (Feature 006)

### Project Documentation Management
- **Problem**: Multiple specification files scattered across project require unified view
- **Solution**: Automated aggregation system to combine all spec files into single document
- **Status**: Design phase complete, ready for task generation

### Key Features Planned
- **Automatic Discovery**: Scan `specs/` directory for all specification files
- **Cross-Reference Resolution**: Convert feature references into navigable links
- **Table of Contents**: Hierarchical navigation structure for easy browsing
- **Requirement Matrix**: Consolidated view of all functional requirements
- **Dependency Mapping**: Visual representation of feature relationships
- **Format Consistency**: Unified formatting and structure across all content

### Technical Implementation
- **Processing Engine**: Node.js with markdown-it parser for spec file processing
- **Template System**: Handlebars for consistent document generation
- **Output Formats**: Primary markdown output with optional HTML generation
- **Cross-Reference Engine**: Pattern matching and link resolution system
- **Validation**: Comprehensive checking for broken references and malformed content

### Current Specifications to Consolidate
1. **001-authentication-login-password**: User authentication system
2. **002-i-want-to**: User story specification
3. **003-please-save-application**: Application data persistence
4. **004-address-a-feature**: FTP editor loading bug fix
5. **005-failed-to-fetch**: Authentication error resolution and application logging (Complete - Phase 1)
6. **005-remember-websites-profile**: Website profile data persistence
7. **006-combine-all-spec**: This specification consolidation feature

## AUTHENTICATION ERROR RESOLUTION & LOGGING (Feature 005) ✅

### Phase 1 Complete - Ready for Implementation
- **Problem**: "Failed to fetch" errors during login/signup, need comprehensive logging
- **Solution**: Enhanced auth endpoints with retry logic + structured logging system
- **Status**: Design phase complete, ready for /tasks command

### Technical Architecture Defined
- **Error Handling**: Hierarchical error boundaries with exponential backoff retry
- **Logging System**: Pino-based structured logging with correlation IDs
- **Security**: Role-based log access (developer/admin/superadmin) with data sanitization
- **Data Retention**: 12 months auth logs, 90 days application errors
- **Monitoring**: Grafana + Loki integration for cost-effective log aggregation

### API Contracts Completed
- `POST /api/auth/signin` - Enhanced authentication with comprehensive error handling
- `POST /api/auth/signup` - Robust registration with input validation and retry logic
- `GET /api/logs` - Secure log access endpoint with role-based authorization
- `POST /api/logs` - Internal log creation endpoint for application events

### Key Components Designed
- **Enhanced Logger**: Pino-based with correlation IDs and structured JSON output
- **Error Boundaries**: App Router file convention for granular error handling
- **Retry Logic**: Network failure recovery with exponential backoff
- **Security**: Multi-layered auth (MFA + RBAC + IP restrictions) for log access
- **Data Model**: Authentication requests, error logs, audit trails with proper relationships

### Contract Tests Ready (Must Fail First)
- `tests/contract/auth-signin.test.ts` - Complete authentication endpoint validation
- `tests/contract/auth-signup.test.ts` - Registration flow with security testing
- `tests/contract/logs-api.test.ts` - Secure log access with role-based authorization

## NEXT TASKS (Ready for /tasks command)

### PRIORITY 1: Authentication Error Resolution (Feature 005)
1. Implement enhanced authentication API endpoints with retry logic
2. Create structured logging system with Pino and correlation IDs
3. Build secure log access endpoint with role-based authorization
4. Add error boundaries and network failure recovery to auth pages
5. Implement comprehensive input validation and sanitization
6. Set up log retention policies and data sanitization

### PRIORITY 2: Three-Pane FTP Editor (Feature 004)
1. Implement three-pane editor React components
2. Create editor API endpoints for file operations
3. Integrate Monaco Editor with FTP file loading
4. Add responsive layout with CSS Grid
5. Implement file save/load workflows
6. Add comprehensive error handling and user feedback

### PRIORITY 3: Specification Consolidation (Feature 006)
1. Implement spec file discovery and parsing system
2. Create cross-reference resolution engine
3. Build template-based document generation
4. Add validation and error handling for malformed specs
5. Generate consolidated documentation with navigation
6. Integrate with development workflow and CI/CD

---
*Feature 005 design complete - Implementation ready to begin*