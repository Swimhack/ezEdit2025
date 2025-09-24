# Implementation Plan: Fix File Display with Split Screen Editor

**Branch**: `014-please-fix-the` | **Date**: 2025-09-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-please-fix-the/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Loaded spec with 10 functional requirements for file display and split screen editor
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type: web application (Next.js frontend + backend)
   → Set Structure Decision: Option 2 (web application structure)
3. Fill the Constitution Check section ✓
   → Constitution template found but not customized - using default principles
4. Evaluate Constitution Check section ✓
   → No violations - file display enhancement aligns with simplicity principles
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md ✓
   → Research completed with editor technology decisions and file type support
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
7. Re-evaluate Constitution Check section
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Fix file display issues in the middle pane and implement split screen editor with WYSIWYG/code view options. Technical approach focuses on Monaco Editor integration, file type detection, and responsive UI components for optimal file viewing and editing experience.

## Technical Context
**Language/Version**: TypeScript 5.0+ with Next.js 14
**Primary Dependencies**: Monaco Editor, React 18, Tailwind CSS, Prism.js for syntax highlighting
**Storage**: File content caching, user preferences in localStorage/Supabase
**Testing**: Jest + React Testing Library for editor components
**Target Platform**: Web application (browser-based editor)
**Project Type**: web - Next.js frontend + backend file operations
**Performance Goals**: <200ms file load, 60fps smooth editing, <5MB file size limit
**Constraints**: Browser memory limits, file encoding support, responsive design
**Scale/Scope**: Support major file types, real-time sync, user preference persistence

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on template constitution principles:

### I. Library-First ✓
- Editor components will be self-contained and reusable
- Clear separation between file display and editing logic
- Independent testability with comprehensive component tests

### II. CLI Interface ✓
- File operations will have structured API responses
- Editor state will be serializable for persistence
- Consistent interface patterns across editor modes

### III. Test-First (NON-NEGOTIABLE) ✓
- TDD approach: Editor tests → Integration tests → Implementation
- Red-Green-Refactor cycle for all editor features
- Tests will fail first, then implementation makes them pass

### IV. Integration Testing ✓
- Cross-component editor flow testing
- File type detection and mode switching integration
- Split screen synchronization testing

### V. Observability ✓
- Comprehensive logging for file operations and editor state
- Performance metrics for file load times and editor responsiveness
- Error tracking for file display failures

**Gate Status**: PASS - All constitutional principles align with editor enhancement requirements

## Project Structure

### Documentation (this feature)
```
specs/014-please-fix-the/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (Next.js frontend + backend)
ezedit/
├── app/
│   ├── api/files/       # File operations API endpoints (enhance)
│   └── editor/         # Editor pages (enhance with split screen)
├── lib/
│   ├── editor/         # Editor utilities and services
│   ├── file-operations.ts # File handling utilities (enhance)
│   └── editor-state.ts  # Editor state management (create)
├── components/
│   ├── editor/         # Editor components (enhance/create)
│   │   ├── SplitScreenEditor.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── WYSIWYGViewer.tsx
│   │   └── FileViewer.tsx
│   └── ui/             # UI components for editor
└── tests/
    ├── contract/       # File API contract tests
    ├── integration/    # Editor flow integration tests
    └── unit/           # Individual editor component tests
```

**Structure Decision**: Option 2 (Web application) - Next.js with enhanced editor components

## Phase 0: Outline & Research ✓

**Research completed with the following findings:**

### File Type Support Strategy:
1. **WYSIWYG Mode Support**: HTML, Markdown, Rich Text, and basic document previews
   - **Rationale**: These formats have reliable browser rendering support
   - **Alternatives considered**: PDF, Word docs - rejected for complexity and licensing

2. **Editor Technology**: Monaco Editor with Prism.js fallback
   - **Rationale**: Monaco provides VS Code-like experience with excellent TypeScript support
   - **Alternatives considered**: CodeMirror, Ace Editor - rejected for feature completeness

3. **Split Screen Implementation**: CSS Grid with resizable panes
   - **Rationale**: Native CSS solution with smooth resizing and responsive design
   - **Alternatives considered**: Third-party splitter libraries - rejected for bundle size

4. **State Management**: React hooks with localStorage persistence
   - **Rationale**: Simple state management with preference persistence
   - **Alternatives considered**: Redux, Zustand - rejected for over-engineering

5. **Performance Optimization**: Virtual scrolling for large files, lazy loading
   - **Rationale**: Maintains 60fps performance with large file support
   - **Alternatives considered**: Full file loading - rejected for memory concerns

**Output**: All NEEDS CLARIFICATION resolved with concrete implementation approach

## Phase 1: Design & Contracts

### 1. Data Model Design (data-model.md)
- File Content entity with metadata and caching
- Editor State entity with mode preferences and pane configurations
- File Type Configuration entity for supported formats and view modes
- User Preferences entity for editor customization

### 2. API Contract Generation (contracts/)
- Enhanced `/api/files/content` endpoint for file content with metadata
- New `/api/files/preview` endpoint for WYSIWYG rendering
- Enhanced `/api/editor/state` endpoint for preference management
- New `/api/files/types` endpoint for supported file type information

### 3. Contract Test Generation
- One test file per API endpoint with file handling scenarios
- Tests must fail initially (before enhanced editor implementation)
- Integration tests for complete editor workflows

### 4. Integration Test Scenarios
- File selection and content display in middle pane
- Mode switching between code and WYSIWYG views
- Split screen functionality with synchronized content
- User preference persistence and restoration

### 5. Agent Context Update (CLAUDE.md)
- Add editor enhancement documentation
- Include Monaco Editor integration patterns and file handling approaches
- Update recent changes with split screen editor implementation

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API contract → contract test task [P]
- Each component enhancement → implementation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Contract tests → Integration tests → Implementation
- Dependency order: Data models → Services → Components → Integration
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 18-22 numbered, ordered tasks in tasks.md covering:
1. File content API enhancements (3-4 tasks)
2. Editor component implementation (4-5 tasks)
3. Split screen functionality (3-4 tasks)
4. Mode switching and preferences (3-4 tasks)
5. Integration and testing (4-5 tasks)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*No constitutional violations requiring justification*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution template - See `.specify/memory/constitution.md`*