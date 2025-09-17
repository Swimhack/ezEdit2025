# Implementation Plan: FTP Browser Three-Pane Editor Fix

**Branch**: `004-the-ftp-browser` | **Date**: 2025-09-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-the-ftp-browser/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✅
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✅
   → Project Type: Web application (frontend+backend)
   → Structure Decision: Option 2 (frontend/backend)
3. Evaluate Constitution Check section below ✅
   → Initial simplicity assessment complete
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md ✅
   → Research unknowns and clarifications
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✅
6. Re-evaluate Constitution Check section ✅
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md) ✅
8. STOP - Ready for /tasks command ✅
```

## Summary
Fix the broken FTP browser three-pane editor interface that fails to load when users click "Edit files" on the dashboard card. The solution involves implementing a responsive three-pane layout that displays file navigation, content preview, and editing capabilities for FTP-connected files.

## Technical Context
**Language/Version**: TypeScript 5.0+, Next.js 14
**Primary Dependencies**: React 18, basic-ftp, Monaco Editor, Tailwind CSS
**Storage**: FTP servers (remote file systems)
**Testing**: Jest, React Testing Library, Playwright for E2E
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 85+, Safari 14+)
**Project Type**: Web application (frontend + backend API)
**Performance Goals**: <2s initial load, <500ms file switching, 60fps UI interactions
**Constraints**: Must work with legacy FTP servers, responsive design required
**Scale/Scope**: Support 1000+ files per directory, 10MB max file size for editing

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend components, backend API endpoints)
- Using framework directly? ✅ (Next.js App Router, React hooks)
- Single data model? ✅ (FTP file structure model)
- Avoiding patterns? ✅ (Direct API calls, no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? ✅ (FTP client lib, UI component lib)
- Libraries listed: [ftp-client + connection management, editor-components + three-pane layout]
- CLI per library: [--help/--version/--format for FTP operations]
- Library docs: llms.txt format planned? ✅

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✅ (Tests written first)
- Git commits show tests before implementation? ✅ (Enforced in workflow)
- Order: Contract→Integration→E2E→Unit strictly followed? ✅
- Real dependencies used? ✅ (Real FTP test server)
- Integration tests for: ✅ (FTP connection, file operations, UI interactions)
- FORBIDDEN: Implementation before test ✅

**Observability**:
- Structured logging included? ✅ (Pino logger integration)
- Frontend logs → backend? ✅ (Unified error reporting)
- Error context sufficient? ✅ (User-friendly error messages)

**Versioning**:
- Version number assigned? ✅ (Feature 004)
- BUILD increments on every change? ✅ (CI/CD pipeline)
- Breaking changes handled? ✅ (Backward compatible API)

## Project Structure

### Documentation (this feature)
```
specs/004-the-ftp-browser/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (frontend + backend)
app/
├── api/ftp/            # Backend FTP API endpoints
│   ├── files/          # File operations
│   └── editor/         # Editor-specific endpoints
├── dashboard/          # Frontend dashboard
└── editor/             # Frontend three-pane editor

components/
├── editor/             # Three-pane editor components
├── ftp/                # FTP file browser components
└── ui/                 # Shared UI components

lib/
├── ftp-client.ts       # FTP connection management
├── editor-state.ts    # Editor state management
└── file-operations.ts # File manipulation utilities

tests/
├── contract/           # API contract tests
├── integration/        # FTP + UI integration tests
├── e2e/               # Playwright end-to-end tests
└── unit/              # Component unit tests
```

**Structure Decision**: Option 2 (Web application) - Frontend components + Backend API endpoints

## Phase 0: Outline & Research

### Research Tasks Completed:
1. **FTP Browser Layout Patterns**: Analyzed VS Code, FileZilla, and WebStorm three-pane designs
2. **Monaco Editor Integration**: Researched React Monaco integration with FTP file loading
3. **Responsive Layout Strategies**: Investigated CSS Grid vs Flexbox for dynamic pane resizing
4. **FTP Error Handling**: Studied connection recovery and user feedback patterns
5. **Performance Optimization**: File caching strategies for large directory structures

### Research Findings:
- **Three-Pane Layout**: Left (file tree), Center (editor), Right (file details/preview)
- **Loading Strategy**: Progressive loading with skeleton states
- **Error Recovery**: Graceful degradation with retry mechanisms
- **Mobile Responsiveness**: Collapsible panes for smaller screens

**Output**: ✅ research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

### Data Model Created:
- **EditorState**: Current file, pane visibility, layout preferences
- **FTPFileNode**: File/directory structure with metadata
- **EditorSession**: User session with FTP connection details

### API Contracts Generated:
- `GET /api/ftp/editor/layout` - Get editor configuration
- `POST /api/ftp/editor/file` - Load file for editing
- `PUT /api/ftp/editor/file` - Save file changes
- `GET /api/ftp/editor/preview` - File preview/metadata

### Contract Tests Created:
- FTP file loading contract validation
- Editor state persistence contract
- Error response format validation

### Agent Context Updated:
- Added three-pane editor patterns to CLAUDE.md
- Updated FTP browser implementation notes
- Added Monaco Editor integration guidelines

**Output**: ✅ data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Contract tests for each API endpoint [P]
- Component creation tasks for three-pane layout [P]
- Integration tests for FTP + editor interaction
- E2E tests for complete user workflow

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: API contracts → FTP client → UI components → Integration
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 28-32 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations detected - simple, test-driven approach*

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*