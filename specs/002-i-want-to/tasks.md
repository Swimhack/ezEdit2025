# Tasks: Fluid Sign-In with Email Validation and Dashboard State Persistence

**Input**: Design documents from `/specs/002-i-want-to/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✓ Found: Next.js 14, TypeScript, JWT, nodemailer
   → ✓ Structure: Web application (ezedit/ directory)
2. Load optional design documents:
   → data-model.md: User, EmailValidationToken, DashboardState entities
   → contracts/: 5 API endpoints for validation and state
   → research.md: 24hr token expiry, server-side state, debounced saves
3. Generate tasks by category:
   → Setup: environment variables, email config
   → Tests: 5 contract tests, 5 integration tests
   → Core: 3 models, 3 services, 5 endpoints
   → Integration: email service, state persistence
   → Polish: unit tests, performance validation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T028)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✓ All contracts have tests
   → ✓ All entities have models
   → ✓ All endpoints implemented
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Next.js App**: `ezedit/app/`, `ezedit/lib/`, `ezedit/tests/`
- All paths relative to repository root

## Phase 3.1: Setup
- [ ] T001 Configure email environment variables in ezedit/.env.local (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM)
- [ ] T002 Install dependencies: npm install nodemailer @types/nodemailer jsonwebtoken crypto
- [ ] T003 [P] Create directory structure: ezedit/lib/auth/, ezedit/lib/email/, ezedit/lib/state/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [ ] T004 [P] Contract test POST /api/auth/validate in ezedit/tests/contract/auth-validate.test.ts
- [ ] T005 [P] Contract test POST /api/auth/resend in ezedit/tests/contract/auth-resend.test.ts
- [ ] T006 [P] Contract test GET /api/dashboard/state in ezedit/tests/contract/dashboard-state-get.test.ts
- [ ] T007 [P] Contract test POST /api/dashboard/state in ezedit/tests/contract/dashboard-state-post.test.ts
- [ ] T008 [P] Contract test DELETE /api/dashboard/state/reset in ezedit/tests/contract/dashboard-state-reset.test.ts

### Integration Tests
- [ ] T009 [P] Integration test: New user registration with immediate dashboard access in ezedit/tests/integration/registration-flow.test.ts
- [ ] T010 [P] Integration test: Email validation token flow in ezedit/tests/integration/email-validation.test.ts
- [ ] T011 [P] Integration test: Dashboard state persistence across sessions in ezedit/tests/integration/state-persistence.test.ts
- [ ] T012 [P] Integration test: Rate limiting on resend endpoint in ezedit/tests/integration/rate-limiting.test.ts
- [ ] T013 [P] Integration test: Cross-device state synchronization in ezedit/tests/integration/cross-device.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models & Storage
- [ ] T014 [P] Enhance User model with validation fields in ezedit/data/users.json structure
- [ ] T015 [P] Create EmailValidationToken storage in ezedit/data/validation-tokens.json
- [ ] T016 [P] Create DashboardState storage in ezedit/data/dashboard-states.json

### Service Libraries
- [ ] T017 [P] Email validation service in ezedit/lib/auth/validation.ts (generateToken, hashToken, verifyToken, checkExpiry)
- [ ] T018 [P] Email sender service in ezedit/lib/email/sender.ts (sendValidationEmail, configureTransport, retryLogic)
- [ ] T019 [P] Dashboard state manager in ezedit/lib/state/dashboard.ts (saveState, loadState, mergeStates, compressState)

### API Endpoints
- [ ] T020 POST /api/auth/validate endpoint in ezedit/app/api/auth/validate/route.ts
- [ ] T021 POST /api/auth/resend endpoint in ezedit/app/api/auth/resend/route.ts
- [ ] T022 GET /api/dashboard/state endpoint in ezedit/app/api/dashboard/state/route.ts (GET handler)
- [ ] T023 POST /api/dashboard/state endpoint in ezedit/app/api/dashboard/state/route.ts (POST handler)
- [ ] T024 DELETE /api/dashboard/state/reset endpoint in ezedit/app/api/dashboard/state/reset/route.ts

### UI Components
- [ ] T025 Email verification page in ezedit/app/auth/verify/page.tsx
- [ ] T026 Dashboard state persistence hooks in ezedit/app/dashboard/page.tsx (useStateRestore, useStateSave)

## Phase 3.4: Integration
- [ ] T027 Update signup flow to send validation email in ezedit/app/api/auth/signup/route.ts
- [ ] T028 Add email verification indicator to dashboard in ezedit/app/dashboard/page.tsx
- [ ] T029 Implement debounced state saving (500ms) in dashboard hooks
- [ ] T030 Add rate limiting middleware to resend endpoint (5 min cooldown)

## Phase 3.5: Polish
- [ ] T031 [P] Unit tests for token generation and hashing in ezedit/tests/unit/validation.test.ts
- [ ] T032 [P] Unit tests for state compression in ezedit/tests/unit/state-compression.test.ts
- [ ] T033 Performance validation: Dashboard load <500ms, state restore <100ms
- [ ] T034 [P] Update CLAUDE.md with implementation details
- [ ] T035 Manual testing following quickstart.md scenarios

## Dependencies
- Setup (T001-T003) must complete first
- All tests (T004-T013) before any implementation (T014-T026)
- Models (T014-T016) before services (T017-T019)
- Services before endpoints (T020-T024)
- Endpoints before UI components (T025-T026)
- Core implementation before integration (T027-T030)
- Everything before polish (T031-T035)

## Parallel Execution Examples

### Launch all contract tests together (T004-T008):
```
Task: "Contract test POST /api/auth/validate in ezedit/tests/contract/auth-validate.test.ts"
Task: "Contract test POST /api/auth/resend in ezedit/tests/contract/auth-resend.test.ts"
Task: "Contract test GET /api/dashboard/state in ezedit/tests/contract/dashboard-state-get.test.ts"
Task: "Contract test POST /api/dashboard/state in ezedit/tests/contract/dashboard-state-post.test.ts"
Task: "Contract test DELETE /api/dashboard/state/reset in ezedit/tests/contract/dashboard-state-reset.test.ts"
```

### Launch all integration tests together (T009-T013):
```
Task: "Integration test new user registration flow in ezedit/tests/integration/registration-flow.test.ts"
Task: "Integration test email validation token flow in ezedit/tests/integration/email-validation.test.ts"
Task: "Integration test dashboard state persistence in ezedit/tests/integration/state-persistence.test.ts"
Task: "Integration test rate limiting on resend in ezedit/tests/integration/rate-limiting.test.ts"
Task: "Integration test cross-device sync in ezedit/tests/integration/cross-device.test.ts"
```

### Launch all service libraries together (T017-T019):
```
Task: "Create email validation service in ezedit/lib/auth/validation.ts"
Task: "Create email sender service in ezedit/lib/email/sender.ts"
Task: "Create dashboard state manager in ezedit/lib/state/dashboard.ts"
```

## Notes
- [P] tasks operate on different files with no dependencies
- Verify all tests fail before implementing (RED phase of TDD)
- Commit after each task completion
- State endpoints (T022-T023) share file but different HTTP methods
- Dashboard updates (T026, T028) are sequential on same file
- Rate limiting uses existing patterns from codebase

## Success Criteria
- [ ] All 10 tests written and failing before implementation
- [ ] 5 API endpoints functional with contract compliance
- [ ] Email validation working with 24-hour tokens
- [ ] Dashboard state persists across sessions
- [ ] Performance targets met (<500ms load, <100ms restore)
- [ ] Manual testing passes all quickstart.md scenarios

---
*Generated from design documents in /specs/002-i-want-to/*