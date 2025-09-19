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
8. Return: SUCCESS (30 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `ezedit/` (Next.js application)
- **Tests**: `ezedit/tests/contract/`, `ezedit/tests/integration/`, `ezedit/tests/unit/`
- **Source**: `ezedit/lib/`, `ezedit/app/api/`, `ezedit/components/`

## Phase 3.1: Setup & Dependencies

- [ ] T001 [P] Install enhanced logging dependencies (pino, pino-pretty, compression libraries) in ezedit/package.json
- [ ] T002 [P] Create enhanced logging configuration types in ezedit/lib/logging/types.ts
- [ ] T003 [P] Set up database migration for logging tables in ezedit/supabase/migrations/002_enhanced_logging.sql

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] T004 [P] Contract test GET /api/logs with advanced filtering in ezedit/tests/contract/logs-get.test.ts
- [ ] T005 [P] Contract test GET /api/logs/stream (SSE) in ezedit/tests/contract/logs-stream.test.ts
- [ ] T006 [P] Contract test POST /api/logs/export in ezedit/tests/contract/logs-export.test.ts
- [ ] T007 [P] Contract test GET /api/logs/stats in ezedit/tests/contract/logs-stats.test.ts

### Integration Tests (Cross-Component)
- [ ] T008 [P] Integration test FTP operation logging workflow in ezedit/tests/integration/ftp-logging.test.ts
- [ ] T009 [P] Integration test editor operation logging workflow in ezedit/tests/integration/editor-logging.test.ts
- [ ] T010 [P] Integration test correlation ID tracking across components in ezedit/tests/integration/correlation-tracking.test.ts
- [ ] T011 [P] Integration test log tier migration and cleanup in ezedit/tests/integration/log-lifecycle.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models & Types
- [ ] T012 [P] Enhanced ApplicationLog interface in ezedit/lib/logging/models/application-log.ts
- [ ] T013 [P] FTPOperationLog specialized model in ezedit/lib/logging/models/ftp-operation-log.ts
- [ ] T014 [P] EditorOperationLog specialized model in ezedit/lib/logging/models/editor-operation-log.ts
- [ ] T015 [P] ErrorEvent model with categorization in ezedit/lib/logging/models/error-event.ts
- [ ] T016 [P] PerformanceMetrics model in ezedit/lib/logging/models/performance-metrics.ts

### Core Logging Services
- [ ] T017 Enhanced Logger class with FTP/Editor context in ezedit/lib/logging/enhanced-logger.ts
- [ ] T018 [P] Data sanitization service for sensitive information in ezedit/lib/logging/sanitizer.ts
- [ ] T019 [P] Correlation ID manager for operation tracking in ezedit/lib/logging/correlation-manager.ts
- [ ] T020 Tiered storage manager (hot/warm/cold) in ezedit/lib/logging/storage-manager.ts

### API Endpoints
- [ ] T021 Enhanced GET /api/logs with advanced filtering in ezedit/app/api/logs/route.ts
- [ ] T022 GET /api/logs/stream SSE endpoint in ezedit/app/api/logs/stream/route.ts
- [ ] T023 POST /api/logs/export endpoint in ezedit/app/api/logs/export/route.ts
- [ ] T024 GET /api/logs/stats aggregation endpoint in ezedit/app/api/logs/stats/route.ts

## Phase 3.4: Integration & Component Enhancement

### FTP Client Integration
- [ ] T025 Enhance FTP client with comprehensive operation logging in ezedit/lib/ftp-client.ts
- [ ] T026 [P] FTP connection pool logging integration in ezedit/lib/ftp-connections.ts

### Editor Integration
- [ ] T027 [P] Editor state change logging in ezedit/lib/editor-state.ts
- [ ] T028 [P] Three-pane editor operation logging in ezedit/components/editor/ThreePaneEditor.tsx

### Real-time Features
- [ ] T029 Real-time log streaming service with SSE in ezedit/lib/logging/log-stream.ts

## Phase 3.5: Polish & Optimization

- [ ] T030 [P] Performance optimization and memory management in ezedit/lib/logging/performance-optimizer.ts
- [ ] T031 [P] Log retention and cleanup jobs in ezedit/lib/logging/cleanup-service.ts
- [ ] T032 [P] Enhanced logs UI with filtering and search in ezedit/app/logs/page.tsx
- [ ] T033 [P] Unit tests for sanitization service in ezedit/tests/unit/sanitizer.test.ts
- [ ] T034 [P] Unit tests for correlation manager in ezedit/tests/unit/correlation-manager.test.ts
- [ ] T035 Performance tests for high-volume logging in ezedit/tests/performance/logging-load.test.ts
- [ ] T036 [P] Update CLAUDE.md with enhanced logging documentation
- [ ] T037 Validate quickstart scenarios and fix any issues

## Dependencies

### Sequential Dependencies (Must Complete in Order)
- **Setup Phase**: T001 → T002 → T003
- **Core Models**: T012 → T013, T014, T015, T016 (base model before specialized)
- **Logging Service**: T017 depends on T012-T016 (models before service)
- **Storage Manager**: T020 depends on T017 (logger before storage)
- **API Endpoints**: T021-T024 depend on T017, T020 (services before endpoints)
- **Integrations**: T025-T029 depend on T017 (enhanced logger before integrations)

### Parallel Blocks (Can Run Simultaneously)
- **Contract Tests**: T004-T007 (different test files)
- **Integration Tests**: T008-T011 (different test files)
- **Specialized Models**: T013-T016 (different model files, after T012)
- **Support Services**: T018, T019 (different service files)
- **FTP Integration**: T025, T026 (different FTP files)
- **Editor Integration**: T027, T028 (different editor files)
- **Polish Tasks**: T030-T036 (different files and concerns)

## Parallel Execution Examples

### Block 1: Contract Tests (After T003)
```bash
# Launch T004-T007 together:
Task: "Contract test GET /api/logs with advanced filtering in ezedit/tests/contract/logs-get.test.ts"
Task: "Contract test GET /api/logs/stream (SSE) in ezedit/tests/contract/logs-stream.test.ts"
Task: "Contract test POST /api/logs/export in ezedit/tests/contract/logs-export.test.ts"
Task: "Contract test GET /api/logs/stats in ezedit/tests/contract/logs-stats.test.ts"
```

### Block 2: Integration Tests (After T007)
```bash
# Launch T008-T011 together:
Task: "Integration test FTP operation logging workflow in ezedit/tests/integration/ftp-logging.test.ts"
Task: "Integration test editor operation logging workflow in ezedit/tests/integration/editor-logging.test.ts"
Task: "Integration test correlation ID tracking across components in ezedit/tests/integration/correlation-tracking.test.ts"
Task: "Integration test log tier migration and cleanup in ezedit/tests/integration/log-lifecycle.test.ts"
```

### Block 3: Specialized Models (After T012)
```bash
# Launch T013-T016 together:
Task: "FTPOperationLog specialized model in ezedit/lib/logging/models/ftp-operation-log.ts"
Task: "EditorOperationLog specialized model in ezedit/lib/logging/models/editor-operation-log.ts"
Task: "ErrorEvent model with categorization in ezedit/lib/logging/models/error-event.ts"
Task: "PerformanceMetrics model in ezedit/lib/logging/models/performance-metrics.ts"
```

## Critical Success Factors

### TDD Compliance ⚠️
1. **ALL** contract tests (T004-T007) MUST be written and MUST FAIL
2. **ALL** integration tests (T008-T011) MUST be written and MUST FAIL
3. No implementation code until tests are failing
4. Each implementation task must make corresponding tests pass

### Performance Requirements
- Log write latency: < 100ms (T017, T020)
- Query response time: < 500ms for recent logs (T021)
- Stream latency: < 2 seconds (T022, T029)
- Memory usage: < 100MB additional overhead (T030)

### Security Requirements
- Sensitive data sanitization: 100% coverage (T018)
- Authentication: All log endpoints protected (T021-T024)
- Data privacy: PII redaction implemented (T018)
- Access control: Role-based permissions (T021)

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T004-T007 → T021-T024)
- [x] All entities have model tasks (T012-T016 from data-model.md)
- [x] All tests come before implementation (T004-T011 before T012+)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Integration points identified (FTP client, editor, streaming)
- [x] Performance and security requirements specified

## Estimated Timeline
- **Phase 3.1 (Setup)**: 1-2 days
- **Phase 3.2 (Tests)**: 3-4 days
- **Phase 3.3 (Core)**: 5-7 days
- **Phase 3.4 (Integration)**: 3-4 days
- **Phase 3.5 (Polish)**: 2-3 days
- **Total**: 14-20 days for complete implementation

## Risk Mitigation
- **Performance Risk**: Load testing in T035 before production
- **Security Risk**: Comprehensive sanitization testing in T033
- **Integration Risk**: Cross-component tests in T008-T011
- **Data Risk**: Backup/restore procedures in cleanup service T031