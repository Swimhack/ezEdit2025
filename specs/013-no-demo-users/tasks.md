# Tasks: Remove Demo Users and Establish Proper Authentication

**Input**: Design documents from `/specs/013-no-demo-users/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extracted: TypeScript 5.0+ with Next.js 14, Supabase, JWT tokens
   → Structure: Next.js web application (ezedit/ directory)
2. Load optional design documents ✓
   → data-model.md: 4 entities → model tasks
   → contracts/: auth-api.yaml → 5 endpoint contract tests
   → research.md: Authentication decisions → cleanup tasks
3. Generate tasks by category ✓
   → Setup: demo user removal, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: authentication endpoints, error handling
   → Integration: session management, UI updates
   → Polish: unit tests, performance, docs
4. Apply task rules ✓
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓
   → All contracts have tests ✓
   → All entities have models ✓
   → All endpoints implemented ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `ezedit/app/`, `ezedit/lib/`, `ezedit/components/`, `ezedit/tests/`
- All paths relative to repository root

## Phase 3.1: Setup and Demo User Cleanup
- [ ] T001 Remove DEMO_USERS arrays from ezedit/app/api/auth/signin/route.ts
- [ ] T002 Remove demo authentication logic from ezedit/app/api/auth/signup/route.ts
- [ ] T003 [P] Configure TypeScript types for clean authentication in ezedit/lib/types/auth.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test POST /api/auth/signin in ezedit/tests/contract/auth-signin.test.ts
- [ ] T005 [P] Contract test POST /api/auth/signup in ezedit/tests/contract/auth-signup.test.ts
- [ ] T006 [P] Contract test POST /api/auth/signout in ezedit/tests/contract/auth-signout.test.ts
- [ ] T007 [P] Contract test GET /api/auth/me in ezedit/tests/contract/auth-me.test.ts
- [ ] T008 [P] Contract test POST /api/auth/password/reset in ezedit/tests/contract/auth-password-reset.test.ts
- [ ] T009 [P] Integration test new user registration flow in ezedit/tests/integration/user-registration.test.ts
- [ ] T010 [P] Integration test demo user removal in ezedit/tests/integration/demo-removal.test.ts
- [ ] T011 [P] Integration test session management in ezedit/tests/integration/session-management.test.ts
- [ ] T012 [P] Integration test error handling in ezedit/tests/integration/error-handling.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T013 [P] UserAccount entity type in ezedit/lib/types/user.ts
- [ ] T014 [P] AuthenticationSession entity type in ezedit/lib/types/session.ts
- [ ] T015 [P] RegistrationRequest entity type in ezedit/lib/types/registration.ts
- [ ] T016 [P] AuthenticationErrorEvent entity type in ezedit/lib/types/error.ts
- [ ] T017 Clean authentication service in ezedit/lib/services/auth-service.ts
- [ ] T018 Enhanced error handling service in ezedit/lib/services/error-service.ts
- [ ] T019 Implement clean POST /api/auth/signin endpoint in ezedit/app/api/auth/signin/route.ts
- [ ] T020 Implement enhanced POST /api/auth/signup endpoint in ezedit/app/api/auth/signup/route.ts
- [ ] T021 Implement POST /api/auth/signout endpoint in ezedit/app/api/auth/signout/route.ts
- [ ] T022 Implement GET /api/auth/me endpoint in ezedit/app/api/auth/me/route.ts
- [ ] T023 Implement POST /api/auth/password/reset endpoint in ezedit/app/api/auth/password/reset/route.ts

## Phase 3.4: Integration and UI Updates
- [ ] T024 Update authentication context in ezedit/lib/auth-context.tsx
- [ ] T025 Update authentication utilities in ezedit/lib/auth-utils.ts
- [ ] T026 Update signin page components in ezedit/app/auth/signin/page.tsx
- [ ] T027 Update signup page components in ezedit/app/auth/signup/page.tsx
- [ ] T028 Update dashboard session validation in ezedit/app/dashboard/page.tsx
- [ ] T029 Remove demo user references from UI components in ezedit/components/

## Phase 3.5: Polish and Validation
- [ ] T030 [P] Unit tests for authentication service in ezedit/tests/unit/auth-service.test.ts
- [ ] T031 [P] Unit tests for error handling in ezedit/tests/unit/error-service.test.ts
- [ ] T032 [P] Unit tests for user types in ezedit/tests/unit/user-types.test.ts
- [ ] T033 Performance tests for authentication endpoints (<500ms target)
- [ ] T034 Execute quickstart validation scenarios from specs/013-no-demo-users/quickstart.md
- [ ] T035 Update CLAUDE.md with authentication cleanup documentation
- [ ] T036 Remove any remaining demo user references from codebase

## Dependencies
```
Setup (T001-T003) → Tests (T004-T012) → Core (T013-T023) → Integration (T024-T029) → Polish (T030-T036)

Specific blocking relationships:
- T001,T002 must complete before T004-T008 (contract tests need clean endpoints)
- T013-T016 must complete before T017-T018 (services need entity types)
- T017-T018 must complete before T019-T023 (endpoints need services)
- T019-T023 must complete before T024-T029 (UI needs working endpoints)
- All implementation must complete before T033-T034 (performance and validation)
```

## Parallel Execution Examples

### Phase 3.2: Contract Tests (Launch Together)
```bash
# All contract tests can run in parallel since they're in different files
Task: "Contract test POST /api/auth/signin in ezedit/tests/contract/auth-signin.test.ts"
Task: "Contract test POST /api/auth/signup in ezedit/tests/contract/auth-signup.test.ts"
Task: "Contract test POST /api/auth/signout in ezedit/tests/contract/auth-signout.test.ts"
Task: "Contract test GET /api/auth/me in ezedit/tests/contract/auth-me.test.ts"
Task: "Contract test POST /api/auth/password/reset in ezedit/tests/contract/auth-password-reset.test.ts"
```

### Phase 3.2: Integration Tests (Launch Together)
```bash
# All integration tests can run in parallel since they're in different files
Task: "Integration test new user registration flow in ezedit/tests/integration/user-registration.test.ts"
Task: "Integration test demo user removal in ezedit/tests/integration/demo-removal.test.ts"
Task: "Integration test session management in ezedit/tests/integration/session-management.test.ts"
Task: "Integration test error handling in ezedit/tests/integration/error-handling.test.ts"
```

### Phase 3.3: Entity Types (Launch Together)
```bash
# All entity types can be created in parallel since they're in different files
Task: "UserAccount entity type in ezedit/lib/types/user.ts"
Task: "AuthenticationSession entity type in ezedit/lib/types/session.ts"
Task: "RegistrationRequest entity type in ezedit/lib/types/registration.ts"
Task: "AuthenticationErrorEvent entity type in ezedit/lib/types/error.ts"
```

### Phase 3.5: Unit Tests (Launch Together)
```bash
# All unit tests can run in parallel since they're in different files
Task: "Unit tests for authentication service in ezedit/tests/unit/auth-service.test.ts"
Task: "Unit tests for error handling in ezedit/tests/unit/error-service.test.ts"
Task: "Unit tests for user types in ezedit/tests/unit/user-types.test.ts"
```

## Task Details

### Critical Authentication Cleanup Tasks
- **T001-T002**: Remove all hardcoded DEMO_USERS arrays and demo authentication logic
- **T019**: Implement pure Supabase authentication without demo fallbacks
- **T020**: Enhanced signup with proper email verification requirements
- **T010**: Integration test to verify demo users completely removed

### Enhanced Error Handling Tasks
- **T018**: Implement structured error service with categorization
- **T012**: Integration test comprehensive error scenarios
- **T031**: Unit tests for error handling patterns

### Session Management Tasks
- **T014**: Clean session entity without demo/hybrid complexity
- **T022**: Session validation endpoint for frontend state management
- **T024**: Update authentication context to remove demo handling

### Validation Tasks
- **T034**: Execute all quickstart scenarios to verify functionality
- **T033**: Performance validation for <500ms authentication target
- **T036**: Final cleanup to ensure no demo references remain

## Notes
- [P] tasks = different files, no dependencies between them
- Verify all tests fail before implementing (TDD requirement)
- Commit after each task completion
- Focus on complete demo user removal while preserving existing functionality
- All authentication must go through Supabase exclusively

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T004-T008)
- [x] All entities have model tasks (T013-T016)
- [x] All tests come before implementation (T004-T012 before T013-T023)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Demo user removal is prioritized (T001-T002, T010)
- [x] Performance targets specified (T033: <500ms)
- [x] Complete validation coverage (T034: quickstart scenarios)