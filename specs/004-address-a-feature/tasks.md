# Tasks: Fix FTP Editor Loading Failure

**Input**: Design documents from `/specs/004-address-a-feature/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: Next.js 14, TypeScript, basic-ftp, Monaco Editor
   → Structure: Web app with app/ directory structure
2. Load optional design documents: ✅
   → data-model.md: EditorSession, FTPConnection, ErrorState entities
   → contracts/: Connection test, session management APIs
   → research.md: Storage alignment strategy, error handling patterns
3. Generate tasks by category: ✅
   → Setup: Storage alignment verification
   → Tests: Contract tests, integration scenarios
   → Core: Storage migration, error handling enhancements
   → Integration: FTP connection validation, session management
   → Polish: Performance validation, documentation
4. Apply task rules: ✅
   → Different files = mark [P] for parallel
   → Storage alignment must happen before error handling
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness: ✅
   → All contracts have tests
   → All storage alignment points covered
   → All error handling scenarios addressed
9. Return: SUCCESS (tasks ready for execution) ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `app/api/`, `app/editor/`, `lib/`, `components/`
- All paths relative to `ezedit/` directory
- TypeScript files with `.ts` or `.tsx` extensions

## Phase 3.1: Setup & Verification
- [ ] T001 Verify current storage system usage across FTP APIs in `app/api/ftp/`
- [ ] T002 [P] Backup existing storage implementations before changes
- [ ] T003 [P] Validate existing test suite runs without errors

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test GET /api/websites/{id} storage alignment in `tests/contract/test_websites_api.ts`
- [ ] T005 [P] Contract test POST /api/ftp/editor/connection/test in `tests/contract/test_ftp_connection.ts`
- [ ] T006 [P] Contract test POST /api/ftp/editor/session in `tests/contract/test_editor_session.ts`
- [ ] T007 [P] Integration test successful editor loading in `tests/integration/test_editor_loading.ts`
- [ ] T008 [P] Integration test authentication error handling in `tests/integration/test_auth_errors.ts`
- [ ] T009 [P] Integration test connection retry functionality in `tests/integration/test_connection_retry.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
### Storage System Alignment
- [ ] T010 Update FTP file API to use memory store in `app/api/ftp/editor/file/route.ts`
- [ ] T011 Update FTP list API to use memory store in `app/api/ftp/list/route.ts`
- [ ] T012 [P] Create error type definitions in `lib/types/editor-errors.ts`
- [ ] T013 [P] Create connection status enum in `lib/types/connection-status.ts`

### Error Handling Enhancement
- [ ] T014 Enhance FTP connection service with structured errors in `lib/ftp-connections.ts`
- [ ] T015 Update editor state context with error handling in `lib/editor-state.tsx`
- [ ] T016 Add connection validation endpoint in `app/api/ftp/editor/connection/test/route.ts`
- [ ] T017 Add session management endpoint in `app/api/ftp/editor/session/route.ts`

### UI/UX Improvements
- [ ] T018 Update ThreePaneEditor with error display in `components/editor/ThreePaneEditor.tsx`
- [ ] T019 [P] Create error dialog component in `components/editor/ErrorDialog.tsx`
- [ ] T020 [P] Create retry button component in `components/editor/RetryButton.tsx`

## Phase 3.4: Integration
- [ ] T021 Integrate connection validation in editor initialization flow
- [ ] T022 Add error state management to editor context provider
- [ ] T023 Implement retry mechanism with exponential backoff
- [ ] T024 Add detailed error logging for debugging

## Phase 3.5: Polish
- [ ] T025 [P] Unit tests for error categorization in `tests/unit/test_error_categorization.ts`
- [ ] T026 [P] Unit tests for connection validation in `tests/unit/test_connection_validation.ts`
- [ ] T027 Performance validation (<2s editor load time)
- [ ] T028 [P] Update documentation in `specs/004-address-a-feature/quickstart.md`
- [ ] T029 Run complete validation scenario from quickstart guide
- [ ] T030 Clean up unused imports and dead code

## Dependencies
### Critical Path
- T001-T003 (Setup) → T004-T009 (Tests) → T010-T020 (Implementation) → T021-T024 (Integration) → T025-T030 (Polish)

### Specific Dependencies
- T004-T009 must FAIL before T010-T020 (TDD requirement)
- T010-T011 (storage alignment) must complete before T014-T017 (error handling)
- T012-T013 (type definitions) can run parallel with storage updates
- T018 depends on T012-T013 (error types)
- T021-T024 depend on T010-T020 completion
- T025-T030 can run parallel once implementation is complete

## Parallel Execution Examples

### Phase 3.2: Test Creation
```bash
# Launch contract tests in parallel (different files):
Task: "Contract test GET /api/websites/{id} storage alignment in tests/contract/test_websites_api.ts"
Task: "Contract test POST /api/ftp/editor/connection/test in tests/contract/test_ftp_connection.ts"
Task: "Contract test POST /api/ftp/editor/session in tests/contract/test_editor_session.ts"

# Launch integration tests in parallel:
Task: "Integration test successful editor loading in tests/integration/test_editor_loading.ts"
Task: "Integration test authentication error handling in tests/integration/test_auth_errors.ts"
Task: "Integration test connection retry functionality in tests/integration/test_connection_retry.ts"
```

### Phase 3.3: Type Definitions and Components
```bash
# Create type definitions in parallel:
Task: "Create error type definitions in lib/types/editor-errors.ts"
Task: "Create connection status enum in lib/types/connection-status.ts"

# Create UI components in parallel:
Task: "Create error dialog component in components/editor/ErrorDialog.tsx"
Task: "Create retry button component in components/editor/RetryButton.tsx"
```

### Phase 3.5: Testing and Documentation
```bash
# Unit tests in parallel:
Task: "Unit tests for error categorization in tests/unit/test_error_categorization.ts"
Task: "Unit tests for connection validation in tests/unit/test_connection_validation.ts"
Task: "Update documentation in specs/004-address-a-feature/quickstart.md"
```

## Task Details

### T001: Verify Current Storage Usage
**Purpose**: Audit existing FTP API files to confirm storage system mismatch
**Files**: `app/api/ftp/editor/file/route.ts`, `app/api/ftp/list/route.ts`
**Expected**: Find imports from `@/lib/websites-store` (file-based)
**Validation**: Document which files need storage alignment

### T004: Contract Test - Website API Storage Alignment
**Purpose**: Ensure GET /api/websites/{id} works with memory store
**File**: `tests/contract/test_websites_api.ts`
**Test Cases**:
- Valid website ID returns correct data structure
- Invalid website ID returns 404 with proper error format
- Response schema matches OpenAPI contract
**Must Fail**: Before T010-T011 implementation

### T010: Update FTP File API Storage
**Purpose**: Change storage import to fix root cause of "Failed to fetch" error
**File**: `app/api/ftp/editor/file/route.ts`
**Change**: `import { getWebsite } from '@/lib/websites-store'` → `import { getWebsite } from '@/lib/websites-memory-store'`
**Validation**: API can find websites created via dashboard

### T018: Update ThreePaneEditor Error Handling
**Purpose**: Replace generic "Failed to fetch" with structured error display
**File**: `components/editor/ThreePaneEditor.tsx`
**Requirements**:
- Display specific error messages based on error type
- Show retry button for retryable errors
- Maintain loading states during retry attempts
- Preserve user context on error

### T027: Performance Validation
**Purpose**: Ensure bug fix doesn't impact editor load time
**Method**: Automated timing tests for editor initialization
**Target**: <2s initial load, <500ms retry operations
**Tools**: Browser performance APIs, automated testing

## Critical Success Criteria

### Functional Requirements
1. ✅ Editor loads without "Failed to fetch" error for valid websites
2. ✅ Specific error messages for different failure types (auth, connection, server)
3. ✅ Retry functionality works without page refresh
4. ✅ All existing functionality preserved

### Technical Requirements
1. ✅ All APIs use consistent storage system (memory-store)
2. ✅ Structured error handling with proper categorization
3. ✅ Performance targets maintained (<2s load time)
4. ✅ All tests pass (existing + new contract/integration tests)

### User Experience Requirements
1. ✅ Clear, actionable error messages
2. ✅ Obvious retry/recovery options
3. ✅ No regression in existing UI/UX
4. ✅ Proper loading state feedback

## Rollback Plan
If any task fails or causes regressions:
1. **T001-T011**: Revert storage changes, return to file-based system
2. **T012-T020**: Disable error enhancements, use original error handling
3. **T021-T030**: Skip integration/polish, deploy minimal fix

## Validation Checklist
*GATE: Checked before task completion*

- [x] All contracts have corresponding tests (T004-T006)
- [x] All storage alignment points covered (T010-T011)
- [x] All error handling scenarios have tests (T007-T009)
- [x] Parallel tasks truly independent (marked with [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD order enforced (tests before implementation)
- [x] Dependencies clearly documented
- [x] Performance requirements maintained