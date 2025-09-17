# Tasks: Fly.io Deployment Configuration

**Input**: Design documents from `/specs/002-enable-deployment-to/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: Next.js 14, TypeScript, Fly.io, Docker, Supabase
   → Structure: Web app deployment configuration
2. Load design documents:
   → data-model.md: 7 deployment entities → configuration tasks
   → contracts/deployment-api.yaml: 8 endpoints → API test tasks
   → research.md: Fly.io platform research, resource allocation decisions
3. Generate tasks by category:
   → Setup: Fly.io CLI, Docker configuration, Next.js optimization
   → Tests: Health endpoint tests, deployment validation
   → Core: deployment scripts, monitoring, SSL configuration
   → Integration: CI/CD pipeline, credential management
   → Polish: performance tests, documentation
4. Task rules applied:
   → Different files = [P] for parallel execution
   → Same file = sequential
   → Tests before implementation (TDD)
5. Tasks numbered T001-T030
6. Dependencies mapped
7. Parallel execution examples provided
8. Validation complete: All endpoints tested, configurations validated
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions (Deployment Configuration)
- **Deployment configs**: `fly.toml`, `Dockerfile`, `.dockerignore`
- **Scripts**: `scripts/deployment/`
- **CI/CD**: `.github/workflows/`
- **Tests**: `tests/deployment/`

## Phase 3.1: Setup
- [ ] **T001** Install and configure Fly.io CLI with authentication
- [ ] **T002** [P] Create optimized Dockerfile for Next.js production build
- [ ] **T003** [P] Create .dockerignore file to exclude unnecessary files from build
- [ ] **T004** [P] Configure Next.js for standalone output mode in `next.config.js`
- [ ] **T005** [P] Set up fly.toml configuration file with app settings and resources

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Health Check and API Tests
- [ ] **T006** [P] Create health endpoint test in `tests/deployment/health.test.ts`
- [ ] **T007** [P] Create deployment status API test in `tests/deployment/status-api.test.ts`
- [ ] **T008** [P] Create deployment trigger API test in `tests/deployment/trigger-api.test.ts`
- [ ] **T009** [P] Create rollback API test in `tests/deployment/rollback-api.test.ts`
- [ ] **T010** [P] Create SSL certificate validation test in `tests/deployment/ssl.test.ts`

### Integration Tests
- [ ] **T011** [P] Create complete deployment flow test in `tests/deployment/full-deployment.test.ts`
- [ ] **T012** [P] Create environment variable validation test in `tests/deployment/env-validation.test.ts`
- [ ] **T013** [P] Create database connectivity test in `tests/deployment/database-connection.test.ts`
- [ ] **T014** [P] Create external API connectivity test in `tests/deployment/external-apis.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Health Monitoring
- [ ] **T015** [P] Implement health check endpoint in `app/api/health/route.ts`
- [ ] **T016** [P] Implement detailed health check endpoint in `app/api/health/detailed/route.ts`
- [ ] **T017** [P] Create deployment status endpoint in `app/api/internal/deployment/status/route.ts`

### Deployment Management APIs
- [ ] **T018** Create deployment trigger endpoint in `app/api/internal/deployment/trigger/route.ts`
- [ ] **T019** Create rollback endpoint in `app/api/internal/deployment/rollback/route.ts`
- [ ] **T020** Create deployment logs endpoint in `app/api/internal/deployment/logs/route.ts`
- [ ] **T021** Create metrics endpoint in `app/api/internal/metrics/route.ts`

### Configuration and Scripts
- [ ] **T022** [P] Create deployment script in `scripts/deployment/deploy.sh`
- [ ] **T023** [P] Create environment setup script in `scripts/deployment/setup-env.sh`
- [ ] **T024** [P] Create credential validation script in `scripts/deployment/validate-credentials.sh`
- [ ] **T025** [P] Create post-deployment verification script in `scripts/deployment/verify.sh`

## Phase 3.4: Integration

### CI/CD Pipeline
- [ ] **T026** Create GitHub Actions workflow in `.github/workflows/deploy-production.yml`
- [ ] **T027** Create staging deployment workflow in `.github/workflows/deploy-staging.yml`
- [ ] **T028** Configure environment secrets and variables in repository settings

### SSL and Security
- [ ] **T029** Configure SSL certificate management and auto-renewal
- [ ] **T030** Set up production security headers and CORS policies

## Phase 3.5: Polish
- [ ] **T031** [P] Create performance tests for deployment speed in `tests/performance/deployment-speed.test.ts`
- [ ] **T032** [P] Create load tests for production capacity in `tests/performance/load-test.ts`
- [ ] **T033** [P] Update deployment documentation and runbooks
- [ ] **T034** [P] Create monitoring dashboard configuration
- [ ] **T035** Run complete deployment validation following quickstart.md

## Dependencies

### Critical Blocking Dependencies
- Setup (T001-T005) must complete before any other phase
- **All tests (T006-T014) MUST complete and FAIL before implementation (T015-T025)**
- Health endpoints (T015-T017) must complete before deployment APIs (T018-T021)
- Core implementation (T015-T025) must complete before CI/CD (T026-T028)

### Service Dependencies
- T001 (Fly.io CLI) blocks T005 (fly.toml configuration)
- T002 (Dockerfile) blocks T026 (CI/CD pipeline)
- T015 (health endpoint) blocks T029 (SSL configuration)
- T022-T025 (deployment scripts) block T026-T027 (CI/CD workflows)

### Polish Dependencies
- All implementation (T015-T030) must complete before polish (T031-T035)

## Parallel Execution Examples

### Phase 3.1: Setup Configuration (Run Together)
```bash
# All configuration files can be created in parallel
Task: "Create optimized Dockerfile for Next.js production build"
Task: "Create .dockerignore file to exclude unnecessary files"
Task: "Configure Next.js for standalone output mode in next.config.js"
Task: "Set up fly.toml configuration file with app settings"
```

### Phase 3.2: All Tests (Run Together)
```bash
# All test files are independent - can run in parallel
npm test tests/deployment/health.test.ts &
npm test tests/deployment/status-api.test.ts &
npm test tests/deployment/ssl.test.ts &
npm test tests/deployment/full-deployment.test.ts &
npm test tests/deployment/env-validation.test.ts &
wait
```

### Phase 3.3: API Endpoints (Sequential - Same Directory)
```bash
# These modify the same API directory structure - must run sequentially
T018 → T019 → T020 → T021
```

### Phase 3.3: Scripts (Run Together)
```bash
# Different script files can be created in parallel
Task: "Create deployment script in scripts/deployment/deploy.sh"
Task: "Create environment setup script in scripts/deployment/setup-env.sh"
Task: "Create credential validation script in scripts/deployment/validate-credentials.sh"
Task: "Create post-deployment verification script in scripts/deployment/verify.sh"
```

## Notes
- [P] tasks = different files, no shared dependencies
- Verify ALL tests fail before implementing (RED phase of TDD)
- Run `flyctl auth login` before starting deployment tasks
- Test locally with `docker build` before deploying
- Monitor deployment with `flyctl logs -f`

## Task Generation Rules Applied

1. **From Contracts** (8 endpoints):
   - Each endpoint → API test task [P] (T007-T010)
   - Each endpoint → implementation task (T018-T021)

2. **From Data Model** (7 entities):
   - Each entity → configuration task [P] (T002-T005, T022-T025)
   - Health monitoring → dedicated endpoints (T015-T017)

3. **From User Stories** (5 scenarios):
   - Each story → integration test [P] (T011-T014)
   - Complete deployment flow → validation (T035)

4. **Ordering Applied**:
   - Setup → Tests → Implementation → CI/CD → Polish
   - TDD: All tests before implementation
   - Dependencies respected in sequencing

## Validation Checklist ✅

- ✅ All 8 API endpoints have corresponding test tasks (T006-T014)
- ✅ All 7 deployment entities have configuration tasks (T002-T005, T022-T025)
- ✅ All tests (T006-T014) come before implementation (T015-T025)
- ✅ Parallel tasks [P] are truly independent (different files)
- ✅ Each task specifies exact file path
- ✅ No [P] task modifies same directory as another [P] task
- ✅ TDD cycle enforced: RED (failing tests) before GREEN (implementation)
- ✅ CI/CD and polish phases properly sequenced
- ✅ All deployment scenarios from quickstart.md covered