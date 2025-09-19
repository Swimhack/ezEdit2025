# Implementation Plan: Enhanced Logging for FTP and Editor Troubleshooting

**Branch**: `011-make-sure-logs` | **Date**: 2025-09-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-make-sure-logs/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Loaded spec with 15 functional requirements for comprehensive logging
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type: web application (Next.js frontend + backend)
   → Set Structure Decision: Option 2 (web application structure)
3. Fill the Constitution Check section ✓
   → Constitution template found but not customized - using default principles
4. Evaluate Constitution Check section ✓
   → No violations - logging aligns with observability principles
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md ✓
   → Research completed with concrete technology recommendations
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
Enhanced logging system for FTP and editor operations to enable comprehensive troubleshooting through the /logs endpoint. The system will capture all FTP connection attempts, file operations, editor state changes, and performance metrics with real-time streaming capabilities and advanced filtering. Technical approach leverages existing Pino logger infrastructure with tiered storage and correlation ID tracking.

## Technical Context
**Language/Version**: TypeScript 5.0+ with Next.js 14
**Primary Dependencies**: Pino (existing), Next.js App Router, Supabase PostgreSQL
**Storage**: Hybrid approach - Hot/Warm/Cold tiers with PostgreSQL and file system
**Testing**: Jest + React Testing Library + Playwright for E2E
**Target Platform**: Web application (browser + Node.js server)
**Project Type**: web - Next.js frontend + backend API routes
**Performance Goals**: <100ms log write latency, <500ms log query response, real-time streaming
**Constraints**: <2GB hot storage, 90-day warm retention, secure credential sanitization
**Scale/Scope**: High-volume logging (1000+ operations/hour), real-time streaming to 100+ concurrent users

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on template constitution principles:

### I. Library-First ✓
- Logging components will be self-contained libraries
- Clear separation between core logging, FTP logging, and editor logging
- Independent testability with comprehensive contract tests

### II. CLI Interface ✓
- Logging libraries expose functionality via internal APIs
- Structured JSON input/output for log entries
- Human-readable formats for debugging and exports

### III. Test-First (NON-NEGOTIABLE) ✓
- TDD approach: Contract tests → Integration tests → Implementation
- Red-Green-Refactor cycle for all logging components
- Tests will fail first, then implementation makes them pass

### IV. Integration Testing ✓
- FTP operation logging integration with existing FTP client
- Editor state logging integration with existing editor components
- Log streaming integration with /logs endpoint
- Cross-component correlation ID tracking

### V. Observability ✓
- Structured logging with correlation IDs
- Performance metrics and error tracking
- Real-time monitoring capabilities

**Gate Status**: PASS - All constitutional principles align with logging feature requirements

## Project Structure

### Documentation (this feature)
```
specs/011-make-sure-logs/
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
│   ├── api/logs/        # Enhanced log API endpoints
│   ├── logs/            # Enhanced log viewing UI
│   └── api/ftp/         # Enhanced FTP endpoints with logging
├── lib/
│   ├── logging/         # Enhanced logging library (existing)
│   ├── ftp-client.ts    # Enhanced with comprehensive logging
│   └── editor-state.ts  # Enhanced with state change logging
├── components/
│   ├── logs/            # Log filtering and viewing components
│   └── editor/          # Enhanced editor with operation logging
└── tests/
    ├── contract/        # Logging API contract tests
    ├── integration/     # Cross-component logging tests
    └── unit/            # Individual logging component tests
```

**Structure Decision**: Option 2 (Web application) - Next.js with enhanced logging across frontend and backend components

## Phase 0: Outline & Research ✓

**Research completed with the following findings:**

### Technology Decisions:
1. **Logging Framework**: Continue with Pino + Enhanced Application Logger
   - **Rationale**: Pino provides 5-10x better performance than alternatives, existing investment
   - **Alternatives considered**: Winston, Bunyan - rejected for performance and complexity

2. **Storage Strategy**: Hybrid Hot/Warm/Cold tiered storage
   - **Rationale**: Balances performance, cost, and retention requirements
   - **Alternatives considered**: Single-tier storage - rejected for scalability

3. **Real-time Streaming**: Server-Sent Events (SSE) with connection pooling
   - **Rationale**: Better browser compatibility than WebSockets, simpler infrastructure
   - **Alternatives considered**: WebSockets, polling - rejected for complexity/inefficiency

4. **Search Implementation**: PostgreSQL full-text search with ts_vector
   - **Rationale**: Leverages existing database, excellent performance for structured logs
   - **Alternatives considered**: Elasticsearch - rejected for infrastructure complexity

5. **Correlation ID Strategy**: UUID with operation context and session tracking
   - **Rationale**: Enables tracing across FTP sessions and editor operations
   - **Alternatives considered**: Sequential IDs - rejected for distributed system concerns

**Output**: All NEEDS CLARIFICATION resolved with concrete technology choices

## Phase 1: Design & Contracts

### 1. Data Model Design (data-model.md)
- Enhanced LogEntry entity with FTP/editor-specific metadata
- FTP Operation Log with connection details and performance metrics
- Editor Operation Log with file metadata and state changes
- Error Event with categorized error types and recovery suggestions
- Performance Metric with quantitative measurements

### 2. API Contract Generation (contracts/)
- Enhanced `/api/logs` endpoint with advanced filtering
- New `/api/logs/stream` for real-time SSE streaming
- New `/api/logs/export` for data export capabilities
- Enhanced FTP endpoints with comprehensive operation logging
- Enhanced editor endpoints with state change logging

### 3. Contract Test Generation
- One test file per API endpoint with request/response validation
- Tests must fail initially (no enhanced implementation yet)
- Integration tests for cross-component correlation ID tracking

### 4. Integration Test Scenarios
- FTP connection failure troubleshooting workflow
- Editor file loading error diagnosis workflow
- Multi-user concurrent operation logging and filtering
- Log retention and cleanup verification

### 5. Agent Context Update (CLAUDE.md)
- Add enhanced logging system documentation
- Include FTP and editor logging patterns
- Update recent changes with logging feature

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API contract → contract test task [P]
- Each entity enhancement → model update task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Contract tests → Integration tests → Implementation
- Dependency order: Core logging → FTP logging → Editor logging → UI enhancements
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md covering:
1. Enhanced logging library updates (5-7 tasks)
2. FTP operation logging integration (4-5 tasks)
3. Editor state logging integration (3-4 tasks)
4. API endpoint enhancements (4-5 tasks)
5. UI filtering and streaming features (4-5 tasks)

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
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)
- [x] Existing logs endpoint tested and validated (Grade: A-)

---
*Based on Constitution template - See `.specify/memory/constitution.md`*