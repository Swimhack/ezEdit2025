# Tasks: Autonomous AI Technology Engine (EzEdit)

**Input**: Design documents from `/specs/001-your-goal-is/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 14, TypeScript, Supabase, Stripe, OpenAI/Anthropic
   → Structure: Web app (Next.js full-stack)
2. Load design documents:
   → data-model.md: 10 entities identified → model tasks
   → contracts/openapi.yaml: 14 endpoints → contract test tasks
   → research.md: Dual AI model approach, validation system
3. Generate tasks by category:
   → Setup: Next.js project, dependencies, Supabase
   → Tests: API contract tests, integration scenarios
   → Core: models, services, AI integration
   → Integration: auth, payments, database
   → Polish: unit tests, performance, docs
4. Task rules applied:
   → Different files = [P] for parallel execution
   → Same file = sequential
   → Tests before implementation (TDD)
5. Tasks numbered T001-T045
6. Dependencies mapped
7. Parallel execution examples provided
8. Validation complete: All contracts tested, entities modeled, endpoints implemented
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions (Next.js full-stack)
- **API routes**: `app/api/*/route.ts`
- **Libraries**: `lib/*/index.ts`
- **Components**: `components/*/index.tsx`
- **Tests**: `tests/*/`

## Phase 3.1: Setup
- [ ] **T001** Create Next.js project structure in repository root with TypeScript, Tailwind CSS, ESLint
- [ ] **T002** Install and configure dependencies: @supabase/supabase-js, stripe, openai, @anthropic-ai/sdk, zustand, zod
- [ ] **T003** [P] Configure ESLint, Prettier, and TypeScript strict mode in respective config files
- [ ] **T004** [P] Set up Jest and Playwright testing frameworks with configurations
- [ ] **T005** Run Supabase migration `supabase/migrations/001_initial_schema.sql` and verify database setup

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Endpoints)
- [ ] **T006** [P] Contract test POST /ai/generate in `tests/contract/ai-generate.test.ts`
- [ ] **T007** [P] Contract test POST /sites in `tests/contract/sites-post.test.ts`
- [ ] **T008** [P] Contract test GET /sites in `tests/contract/sites-get.test.ts`
- [ ] **T009** [P] Contract test PUT /sites/{siteId} in `tests/contract/sites-put.test.ts`
- [ ] **T010** [P] Contract test POST /sites/{siteId}/publish in `tests/contract/sites-publish.test.ts`
- [ ] **T011** [P] Contract test POST /memberships in `tests/contract/memberships-post.test.ts`
- [ ] **T012** [P] Contract test GET /memberships in `tests/contract/memberships-get.test.ts`
- [ ] **T013** [P] Contract test POST /memberships/{id}/cancel in `tests/contract/memberships-cancel.test.ts`
- [ ] **T014** [P] Contract test POST /payments/checkout in `tests/contract/payments-checkout.test.ts`
- [ ] **T015** [P] Contract test POST /payments/webhook in `tests/contract/payments-webhook.test.ts`
- [ ] **T016** [P] Contract test POST /content in `tests/contract/content-post.test.ts`
- [ ] **T017** [P] Contract test GET /content/{id} in `tests/contract/content-get.test.ts`
- [ ] **T018** [P] Contract test GET /programs/{id}/progress in `tests/contract/programs-progress-get.test.ts`
- [ ] **T019** [P] Contract test POST /programs/{id}/progress in `tests/contract/programs-progress-post.test.ts`

### Integration Tests (User Scenarios)
- [ ] **T020** [P] Integration test: Complete site generation flow in `tests/integration/site-generation.test.ts`
- [ ] **T021** [P] Integration test: Membership subscription flow in `tests/integration/membership-flow.test.ts`
- [ ] **T022** [P] Integration test: Content access control in `tests/integration/content-access.test.ts`
- [ ] **T023** [P] Integration test: Program progress tracking in `tests/integration/program-progress.test.ts`
- [ ] **T024** [P] Integration test: Payment processing end-to-end in `tests/integration/payment-e2e.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Models and Types
- [ ] **T025** [P] User profile model and types in `lib/database/models/user.ts`
- [ ] **T026** [P] Organization model and validation in `lib/database/models/organization.ts`
- [ ] **T027** [P] Site model with configuration schema in `lib/database/models/site.ts`
- [ ] **T028** [P] Membership model with tier validation in `lib/database/models/membership.ts`
- [ ] **T029** [P] Content model with access control in `lib/database/models/content.ts`
- [ ] **T030** [P] Program model extending content in `lib/database/models/program.ts`
- [ ] **T031** [P] Program progress tracking model in `lib/database/models/program-progress.ts`
- [ ] **T032** [P] AI prompt model and validation in `lib/database/models/ai-prompt.ts`
- [ ] **T033** [P] Stripe subscription model in `lib/database/models/stripe-subscription.ts`
- [ ] **T034** [P] Audit log model in `lib/database/models/audit-log.ts`

### Core Services
- [ ] **T035** [P] Authentication service with Supabase integration in `lib/auth/index.ts`
- [ ] **T036** [P] AI service with dual-model support (OpenAI/Anthropic) in `lib/ai/index.ts`
- [ ] **T037** [P] Website generator service with template engine in `lib/generator/index.ts`
- [ ] **T038** [P] Membership service with access control in `lib/membership/index.ts`
- [ ] **T039** [P] Payment service with Stripe integration in `lib/payment/index.ts`
- [ ] **T040** [P] Database service with RLS policies in `lib/database/index.ts`

### API Route Implementation
- [ ] **T041** Implement POST /api/ai/generate route with prompt validation and AI integration
- [ ] **T042** Implement site management routes: POST, GET, PUT /api/sites with proper authorization
- [ ] **T043** Implement POST /api/sites/[id]/publish route with status transitions
- [ ] **T044** Implement membership routes: POST, GET /api/memberships with Stripe integration
- [ ] **T045** Implement POST /api/memberships/[id]/cancel with subscription cleanup
- [ ] **T046** Implement payment routes: POST /api/payments/checkout and webhook handler
- [ ] **T047** Implement content management routes: POST, GET /api/content with access control
- [ ] **T048** Implement program progress routes: GET, POST /api/programs/[id]/progress

## Phase 3.4: Integration
- [ ] **T049** Configure Supabase client with Row Level Security policies
- [ ] **T050** Implement authentication middleware for protected routes
- [ ] **T051** Set up Stripe webhook signature verification and event processing
- [ ] **T052** Configure AI hallucination prevention with validation layers
- [ ] **T053** Implement structured logging with request tracking
- [ ] **T054** Set up error handling and monitoring integration
- [ ] **T055** Configure CORS and security headers for production

## Phase 3.5: Polish
- [ ] **T056** [P] Unit tests for AI service validation in `tests/unit/ai-service.test.ts`
- [ ] **T057** [P] Unit tests for payment processing in `tests/unit/payment-service.test.ts`
- [ ] **T058** [P] Unit tests for website generator in `tests/unit/generator.test.ts`
- [ ] **T059** [P] Performance tests: API response times <200ms in `tests/performance/api-performance.test.ts`
- [ ] **T060** [P] Performance tests: Page load times <2s in `tests/performance/page-load.test.ts`
- [ ] **T061** [P] Update API documentation with generated OpenAPI spec
- [ ] **T062** [P] Create CLI commands for testing and deployment
- [ ] **T063** Code quality: Remove duplication and optimize bundle size
- [ ] **T064** Run complete quickstart.md validation scenario
- [ ] **T065** Security audit: verify RLS policies and input sanitization

## Dependencies

### Critical Blocking Dependencies
- Setup (T001-T005) must complete before any other phase
- **All tests (T006-T024) MUST complete and FAIL before implementation (T025-T048)**
- Models (T025-T034) must complete before services (T035-T040)
- Services (T035-T040) must complete before API routes (T041-T048)

### Service Dependencies
- T049 (Supabase config) blocks T050 (auth middleware)
- T039 (payment service) blocks T051 (webhook setup)
- T036 (AI service) blocks T052 (hallucination prevention)
- T040 (database service) blocks T025-T034 (model implementations)

### Polish Dependencies
- All implementation (T025-T055) must complete before polish (T056-T065)

## Parallel Execution Examples

### Phase 3.2: All Contract Tests (Run Together)
```bash
# Launch all contract tests simultaneously - they test different endpoints
npm test tests/contract/ai-generate.test.ts &
npm test tests/contract/sites-post.test.ts &
npm test tests/contract/sites-get.test.ts &
npm test tests/contract/memberships-post.test.ts &
npm test tests/contract/payments-checkout.test.ts &
wait
```

### Phase 3.3: Model Creation (Run Together)
```bash
# All models are independent files - can be created in parallel
Task: "User profile model and types in lib/database/models/user.ts"
Task: "Organization model and validation in lib/database/models/organization.ts"
Task: "Site model with configuration schema in lib/database/models/site.ts"
Task: "Membership model with tier validation in lib/database/models/membership.ts"
Task: "Content model with access control in lib/database/models/content.ts"
```

### Phase 3.5: Unit Tests (Run Together)
```bash
# Different test files can run in parallel
npm test tests/unit/ai-service.test.ts &
npm test tests/unit/payment-service.test.ts &
npm test tests/unit/generator.test.ts &
npm test tests/performance/api-performance.test.ts &
wait
```

## Notes
- [P] tasks = different files, no shared state dependencies
- Verify ALL tests fail before implementing (RED phase of TDD)
- Commit after each completed task
- Run `npm run typecheck` after each TypeScript file
- Run `npm run lint` before each commit

## Task Generation Rules Applied
*Executed during main() processing*

1. **From Contracts** (14 endpoints):
   - Each endpoint → contract test task [P] (T006-T019)
   - Each endpoint → implementation task (T041-T048)

2. **From Data Model** (10 entities):
   - Each entity → model creation task [P] (T025-T034)
   - Services cover entity relationships (T035-T040)

3. **From User Stories** (5 scenarios):
   - Each story → integration test [P] (T020-T024)
   - Quickstart validation → T064

4. **Ordering Applied**:
   - Setup → Tests → Models → Services → Endpoints → Integration → Polish
   - TDD: All tests before implementation
   - Dependencies respected in sequencing

## Validation Checklist ✅
*GATE: Verified before task completion*

- ✅ All 14 API contracts have corresponding test tasks (T006-T019)
- ✅ All 10 entities have model creation tasks (T025-T034)
- ✅ All tests (T006-T024) come before implementation (T025-T048)
- ✅ Parallel tasks [P] are truly independent (different files)
- ✅ Each task specifies exact file path
- ✅ No [P] task modifies same file as another [P] task
- ✅ TDD cycle enforced: RED (failing tests) before GREEN (implementation)
- ✅ Integration and polish phases properly sequenced
- ✅ All user scenarios from quickstart.md covered in integration tests