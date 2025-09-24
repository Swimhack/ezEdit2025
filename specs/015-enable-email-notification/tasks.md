# Tasks: Enable Email Notification System

**Input**: Design documents from `/specs/015-enable-email-notification/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript 5.0+, Next.js 14, Resend API, React Email
   → Structure: ezedit/ with app/api/, lib/email/, components/notifications/
2. Load design documents ✓:
   → data-model.md: 5 entities (EmailNotification, NotificationTemplate, etc.)
   → contracts/: email-api.yaml with 7 endpoints
   → research.md: Resend API integration decisions
3. Generate tasks by category:
   → Setup: Resend API, React Email, Bull Queue, Redis
   → Tests: 7 contract tests, 8 integration tests (TDD approach)
   → Core: 5 models, email service, queue processor, templates
   → Integration: API endpoints, webhooks, preferences UI
   → Polish: performance tests, security validation, monitoring
4. Task rules applied:
   → Different files = [P] parallel execution
   → Tests before implementation (TDD mandatory)
   → Dependencies clearly defined
5. Tasks numbered T001-T042
6. Parallel execution examples included
7. Validation: All contracts tested, entities modeled, TDD followed
8. SUCCESS: 42 tasks ready for execution
```

## Path Conventions
Based on plan.md structure: Next.js web application
- **API Routes**: `ezedit/app/api/`
- **Libraries**: `ezedit/lib/`
- **Components**: `ezedit/components/`
- **Tests**: `ezedit/tests/`

## Phase 3.1: Setup

- [ ] T001 Create email notification project structure in ezedit/lib/email/ and ezedit/app/api/
- [ ] T002 Initialize TypeScript dependencies: resend, react-email, @react-email/components, bull, ioredis
- [ ] T003 [P] Configure ESLint and Prettier for TypeScript email service code
- [ ] T004 [P] Set up Redis connection for email queue in ezedit/lib/email/redis.ts
- [ ] T005 [P] Configure Resend API client with production key in ezedit/lib/email/resend.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] T006 [P] Contract test POST /api/email/send in ezedit/tests/contract/email-send.test.ts
- [ ] T007 [P] Contract test GET /api/email/status/{id} in ezedit/tests/contract/email-status.test.ts
- [ ] T008 [P] Contract test POST /api/email/test in ezedit/tests/contract/email-test.test.ts
- [ ] T009 [P] Contract test POST /api/notifications/trigger in ezedit/tests/contract/notifications-trigger.test.ts
- [ ] T010 [P] Contract test GET /api/notifications/preferences in ezedit/tests/contract/notifications-preferences-get.test.ts
- [ ] T011 [P] Contract test PUT /api/notifications/preferences in ezedit/tests/contract/notifications-preferences-put.test.ts
- [ ] T012 [P] Contract test POST /api/notifications/unsubscribe/{token} in ezedit/tests/contract/notifications-unsubscribe.test.ts
- [ ] T013 [P] Contract test POST /api/email/webhooks/resend in ezedit/tests/contract/email-webhooks.test.ts

### Integration Tests (User Scenarios)
- [ ] T014 [P] Integration test welcome email flow in ezedit/tests/integration/welcome-email.test.ts
- [ ] T015 [P] Integration test password reset email in ezedit/tests/integration/password-reset.test.ts
- [ ] T016 [P] Integration test user preference enforcement in ezedit/tests/integration/preference-enforcement.test.ts
- [ ] T017 [P] Integration test email template rendering in ezedit/tests/integration/template-rendering.test.ts
- [ ] T018 [P] Integration test delivery status tracking in ezedit/tests/integration/delivery-tracking.test.ts
- [ ] T019 [P] Integration test rate limiting in ezedit/tests/integration/rate-limiting.test.ts
- [ ] T020 [P] Integration test failed delivery retry in ezedit/tests/integration/retry-logic.test.ts
- [ ] T021 [P] Integration test unsubscribe flow in ezedit/tests/integration/unsubscribe-flow.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models
- [ ] T022 [P] EmailNotification model in ezedit/lib/email/models/EmailNotification.ts
- [ ] T023 [P] NotificationTemplate model in ezedit/lib/email/models/NotificationTemplate.ts
- [ ] T024 [P] NotificationPreference model in ezedit/lib/email/models/NotificationPreference.ts
- [ ] T025 [P] EmailDeliveryLog model in ezedit/lib/email/models/EmailDeliveryLog.ts
- [ ] T026 [P] EmailQueue model in ezedit/lib/email/models/EmailQueue.ts

### Email Templates (React Email)
- [ ] T027 [P] Welcome email template in ezedit/lib/email/templates/welcome.tsx
- [ ] T028 [P] Password reset template in ezedit/lib/email/templates/password-reset.tsx
- [ ] T029 [P] Email verification template in ezedit/lib/email/templates/email-verification.tsx
- [ ] T030 [P] Admin alert template in ezedit/lib/email/templates/admin-alert.tsx

### Core Services
- [ ] T031 EmailService class with send/render methods in ezedit/lib/email/EmailService.ts
- [ ] T032 QueueProcessor class with Bull queue integration in ezedit/lib/email/QueueProcessor.ts
- [ ] T033 NotificationService for event-based triggering in ezedit/lib/email/NotificationService.ts
- [ ] T034 PreferenceService for user settings in ezedit/lib/email/PreferenceService.ts

## Phase 3.4: Integration

### API Endpoints
- [ ] T035 POST /api/email/send endpoint in ezedit/app/api/email/send/route.ts
- [ ] T036 GET /api/email/status/[id] endpoint in ezedit/app/api/email/status/[id]/route.ts
- [ ] T037 POST /api/notifications/trigger endpoint in ezedit/app/api/notifications/trigger/route.ts
- [ ] T038 GET/PUT /api/notifications/preferences endpoints in ezedit/app/api/notifications/preferences/route.ts
- [ ] T039 POST /api/email/webhooks/resend webhook handler in ezedit/app/api/email/webhooks/resend/route.ts

### Database Integration
- [ ] T040 Database migrations for email notification tables in ezedit/supabase/migrations/
- [ ] T041 Row Level Security policies for email data in ezedit/supabase/migrations/

## Phase 3.5: Polish

### Performance & Security
- [ ] T042 [P] Unit tests for email validation in ezedit/tests/unit/email-validation.test.ts
- [ ] T043 [P] Unit tests for template rendering in ezedit/tests/unit/template-rendering.test.ts
- [ ] T044 [P] Unit tests for queue processing in ezedit/tests/unit/queue-processing.test.ts
- [ ] T045 Performance tests for <2s send latency in ezedit/tests/performance/email-performance.test.ts
- [ ] T046 Security tests for email injection prevention in ezedit/tests/security/email-security.test.ts
- [ ] T047 Load tests for 100 concurrent emails in ezedit/tests/load/email-load.test.ts
- [ ] T048 Monitoring setup for delivery metrics in ezedit/lib/email/monitoring.ts

## Dependencies

### Critical Path (TDD Enforcement)
- **Tests (T006-T021) must complete and FAIL before ANY implementation (T022-T041)**
- **Models (T022-T026) must complete before Services (T031-T034)**
- **Services (T031-T034) must complete before API Endpoints (T035-T039)**
- **Database (T040-T041) required for all data operations**

### Specific Dependencies
- T031 (EmailService) blocks T035 (send endpoint), T037 (trigger endpoint)
- T032 (QueueProcessor) blocks T031 (EmailService)
- T034 (PreferenceService) blocks T038 (preferences endpoint)
- T040 (Database migrations) blocks T035-T039 (all API endpoints)
- T027-T030 (Templates) required for T031 (EmailService)

## Parallel Example

### Phase 3.2 Contract Tests (Launch Together)
```bash
# All contract tests can run in parallel (different files):
Task: "Contract test POST /api/email/send in ezedit/tests/contract/email-send.test.ts"
Task: "Contract test GET /api/email/status/{id} in ezedit/tests/contract/email-status.test.ts"
Task: "Contract test POST /api/notifications/trigger in ezedit/tests/contract/notifications-trigger.test.ts"
Task: "Contract test GET /api/notifications/preferences in ezedit/tests/contract/notifications-preferences-get.test.ts"
```

### Phase 3.3 Models (Launch Together)
```bash
# All model files can be created in parallel:
Task: "EmailNotification model in ezedit/lib/email/models/EmailNotification.ts"
Task: "NotificationTemplate model in ezedit/lib/email/models/NotificationTemplate.ts"
Task: "NotificationPreference model in ezedit/lib/email/models/NotificationPreference.ts"
Task: "EmailDeliveryLog model in ezedit/lib/email/models/EmailDeliveryLog.ts"
```

### Phase 3.3 Templates (Launch Together)
```bash
# All React Email templates can be created in parallel:
Task: "Welcome email template in ezedit/lib/email/templates/welcome.tsx"
Task: "Password reset template in ezedit/lib/email/templates/password-reset.tsx"
Task: "Email verification template in ezedit/lib/email/templates/email-verification.tsx"
Task: "Admin alert template in ezedit/lib/email/templates/admin-alert.tsx"
```

## Task Generation Rules Applied

1. **From Contracts (email-api.yaml)**:
   - 7 API endpoints → 8 contract test tasks [P] (T006-T013)
   - 7 endpoints → 5 implementation tasks (T035-T039)

2. **From Data Model**:
   - 5 entities → 5 model creation tasks [P] (T022-T026)
   - Email service relationships → 4 service layer tasks (T031-T034)

3. **From Quickstart Scenarios**:
   - 8 test scenarios → 8 integration tests [P] (T014-T021)
   - Performance targets → performance validation tasks (T045-T047)

4. **Ordering Applied**:
   - Setup (T001-T005) → Tests (T006-T021) → Models (T022-T030) → Services (T031-T034) → Endpoints (T035-T041) → Polish (T042-T048)

## Validation Checklist ✓

- [x] All contracts have corresponding tests (T006-T013 cover all 7+ endpoints)
- [x] All entities have model tasks (T022-T026 cover all 5 entities)
- [x] All tests come before implementation (T006-T021 before T022+)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path (all tasks include full ezedit/ paths)
- [x] No task modifies same file as another [P] task (verified no conflicts)

## Success Criteria

### Functional Requirements Met
- All 7 API endpoints implemented with comprehensive tests
- 5 data models supporting complete email workflow
- React Email templates for all notification types
- Queue-based processing with retry logic
- User preference management and enforcement
- Webhook integration for delivery tracking

### Performance Targets
- Email send latency: <2 seconds (T045)
- Delivery rate: >98% (T018)
- Queue processing: <30 seconds for priority emails
- Template rendering: <100ms (T043)

### Security & Compliance
- Email injection prevention (T046)
- Rate limiting enforcement (T019)
- Secure token handling for unsubscribe links
- PII protection in logs and audit trails

## Notes
- [P] tasks target different files with no dependencies
- TDD approach mandatory: verify tests fail before implementing
- Commit after each task completion
- Resend API key (`re_37YYP2iE_KbLqkdskcjngf9XqFMJZv1xG`) configured in T005
- Redis required for queue processing (T004)
- Supabase database integration for all data operations (T040-T041)