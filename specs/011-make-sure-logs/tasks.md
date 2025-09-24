# Tasks: Enhanced Logging for FTP and Editor Troubleshooting

**Input**: Design documents from `/specs/011-make-sure-logs/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: Next.js 14, TypeScript, Pino, PostgreSQL
   → Structure: Web application (ezedit/ directory)
2. Load design documents ✓:
   → data-model.md: 5 entities → model enhancement tasks
   → contracts/logs-api.yaml: 4 endpoints → contract test tasks
   → research.md: Pino + tiered storage decisions → setup tasks
3. Generate tasks by category:
   → Setup: Enhanced logging library, dependencies
   → Tests: contract tests, integration tests
   → Core: data models, logging services, API endpoints
   → Integration: FTP client logging, editor logging, streaming
   → Polish: performance tests, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph ✓
7. Validate task completeness ✓
8. Return: SUCCESS (36 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `ezedit/` (Next.js application)
- **Tests**: `ezedit/tests/contract/`, `ezedit/tests/integration/`, `ezedit/tests/unit/`
- **Source**: `ezedit/lib/`, `ezedit/app/api/`, `ezedit/components/`

## Phase 3.1: Setup & Dependencies

- [ ] T001 [P] Install enhanced logging dependencies (pino-pretty@10.3.1, zlib, lz-string@1.5.0) in ezedit/package.json
- [ ] T002 [P] Create logging type definitions in ezedit/lib/logging/types.ts (LogLevel, LogCategory, LogSource, FTPOperation, EditorOperation enums)
- [ ] T003 [P] Set up database migration for enhanced logging tables in ezedit/supabase/migrations/002_enhanced_logging.sql

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] T004 [P] Contract test GET /api/logs with advanced filtering in ezedit/tests/contract/logs-get.test.ts
- [ ] T005 [P] Contract test GET /api/logs/stream (SSE) in ezedit/tests/contract/logs-stream.test.ts
- [ ] T006 [P] Contract test POST /api/logs/export with format options in ezedit/tests/contract/logs-export.test.ts
- [ ] T007 [P] Contract test DELETE /api/logs/{id} with authorization in ezedit/tests/contract/logs-delete.test.ts

### Integration Tests (User Scenarios)
- [ ] T008 [P] Integration test for Scenario 1: FTP connection troubleshooting workflow in ezedit/tests/integration/ftp-connection-troubleshooting.test.ts
- [ ] T009 [P] Integration test for Scenario 2: FTP file operations logging in ezedit/tests/integration/ftp-file-operations.test.ts
- [ ] T010 [P] Integration test for Scenario 3: Editor operation troubleshooting in ezedit/tests/integration/editor-operations.test.ts
- [ ] T011 [P] Integration test for Scenario 4: Real-time log streaming in ezedit/tests/integration/log-streaming.test.ts
- [ ] T012 [P] Integration test for Scenario 5: Advanced filtering and search in ezedit/tests/integration/log-filtering.test.ts
- [ ] T013 [P] Integration test for Scenario 6: Log export and data recovery in ezedit/tests/integration/log-export.test.ts

## Phase 3.3: Core Implementation (Data Models & Services)

### Data Model Implementation
- [ ] T014 Create ApplicationLog entity and database schema in ezedit/lib/logging/models/ApplicationLog.ts
- [ ] T015 Create FTPOperationLog entity extending ApplicationLog in ezedit/lib/logging/models/FTPOperationLog.ts
- [ ] T016 Create EditorOperationLog entity extending ApplicationLog in ezedit/lib/logging/models/EditorOperationLog.ts
- [ ] T017 Create ErrorEvent entity with error categorization in ezedit/lib/logging/models/ErrorEvent.ts
- [ ] T018 Create PerformanceMetrics entity for quantitative measurements in ezedit/lib/logging/models/PerformanceMetrics.ts

### Core Logging Service
- [ ] T019 Enhance existing logger service with tiered storage support in ezedit/lib/logging/logger.ts
- [ ] T020 Create log sanitization service for credential redaction in ezedit/lib/logging/sanitizer.ts
- [ ] T021 Implement correlation ID tracking service in ezedit/lib/logging/correlation.ts
- [ ] T022 Create log storage tier management service in ezedit/lib/logging/storage-tiers.ts
- [ ] T023 Implement PostgreSQL full-text search indexing in ezedit/lib/logging/search-indexer.ts

## Phase 3.4: API Implementation

- [ ] T024 Enhance GET /api/logs endpoint with advanced filtering in ezedit/app/api/logs/route.ts
- [ ] T025 Create GET /api/logs/stream endpoint for SSE streaming in ezedit/app/api/logs/stream/route.ts
- [ ] T026 Create POST /api/logs/export endpoint for data export in ezedit/app/api/logs/export/route.ts
- [ ] T027 Create DELETE /api/logs/{id} endpoint for log deletion in ezedit/app/api/logs/[id]/route.ts

## Phase 3.5: Integration with FTP & Editor

### FTP Integration
- [ ] T028 Enhance FTP client with comprehensive operation logging in ezedit/lib/ftp-client.ts
- [ ] T029 Add FTP connection pool logging and monitoring in ezedit/lib/ftp-connections.ts
- [ ] T030 Integrate FTP error handling with ErrorEvent logging in ezedit/app/api/ftp/list/route.ts

### Editor Integration
- [ ] T031 Add editor operation logging to three-pane editor in ezedit/components/editor/ThreePaneEditor.tsx
- [ ] T032 Integrate editor state change tracking in ezedit/lib/editor-state.tsx
- [ ] T033 Add performance metrics to editor file operations in ezedit/app/api/ftp/editor/file/route.ts

## Phase 3.6: Polish & Documentation

- [ ] T034 [P] Create log viewer UI enhancements with filtering controls in ezedit/app/logs/page.tsx
- [ ] T035 [P] Add performance monitoring dashboard widget in ezedit/components/dashboard/PerformanceWidget.tsx
- [ ] T036 [P] Update CLAUDE.md with enhanced logging documentation in ezedit/CLAUDE.md

## Dependency Graph
```
Setup (T001-T003) ──┐
                     ├──> Tests (T004-T013) ──┐
                     │                         ├──> Core (T014-T023) ──┐
                     │                         │                        ├──> API (T024-T027) ──┐
                     │                         │                        │                      ├──> Integration (T028-T033) ──┐
                     │                         │                        │                      │                               ├──> Polish (T034-T036)
```

## Parallel Execution Examples

### Example 1: Running all setup tasks in parallel
```bash
# These can all run simultaneously as they touch different files
Task agent --parallel T001 T002 T003
```

### Example 2: Running all contract tests in parallel (after setup)
```bash
# All contract tests can run in parallel as they're in different files
Task agent --parallel T004 T005 T006 T007
```

### Example 3: Running all integration tests in parallel (after setup)
```bash
# Integration tests in separate files can run concurrently
Task agent --parallel T008 T009 T010 T011 T012 T013
```

### Example 4: Running polish tasks in parallel (after all implementation)
```bash
# UI enhancements and documentation can be done simultaneously
Task agent --parallel T034 T035 T036
```

## Critical Path (Sequential Dependencies)
1. **Setup must complete first**: T001-T003
2. **Tests before implementation**: T004-T013 before T014-T033
3. **Core models before services**: T014-T018 before T019-T023
4. **Services before API**: T019-T023 before T024-T027
5. **API before integration**: T024-T027 before T028-T033
6. **Everything before polish**: All before T034-T036

## Task Execution Notes

### For Task Executors
- Each task includes specific file paths - create them if they don't exist
- Follow TDD strictly - tests MUST fail before implementation
- Use existing patterns from current codebase
- Maintain backward compatibility with existing /logs endpoint
- All sensitive data must be sanitized before logging

### Quality Checklist Per Task
- [ ] Unit tests written (where applicable)
- [ ] TypeScript types properly defined
- [ ] Error handling implemented
- [ ] Performance considerations addressed
- [ ] Documentation/comments added

## Estimated Timeline
- **Phase 3.1 (Setup)**: 30 minutes
- **Phase 3.2 (Tests)**: 2 hours
- **Phase 3.3 (Core)**: 3 hours
- **Phase 3.4 (API)**: 2 hours
- **Phase 3.5 (Integration)**: 3 hours
- **Phase 3.6 (Polish)**: 1 hour
- **Total Estimate**: 11.5 hours

## Success Metrics
- All 36 tasks completed
- All tests passing (100% coverage on new code)
- Performance goals met (<100ms write, <500ms query)
- No regression in existing functionality
- Documentation complete and accurate

---
*Generated from feature specification 011-make-sure-logs*
*Template: .specify/templates/tasks-template.md*