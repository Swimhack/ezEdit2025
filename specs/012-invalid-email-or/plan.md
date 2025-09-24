# Implementation Plan: Resolve Authentication Regression Issue

**Branch**: `012-invalid-email-or` | **Date**: 2025-09-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-invalid-email-or/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Loaded spec with 10 functional requirements for authentication fix
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type: web application (Next.js frontend + backend)
   → Set Structure Decision: Option 2 (web application structure)
3. Fill the Constitution Check section ✓
   → Constitution template found but not customized - using default principles
4. Evaluate Constitution Check section ✓
   → No violations - authentication fix aligns with simplicity principles
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md ✓
   → Research completed with root cause analysis and solution approach
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
Authentication regression issue causing "Invalid email or password" errors for previously working credentials. Root cause analysis indicates recent switch from demo authentication to Supabase broke existing user sessions and credential validation. Technical approach focuses on authentication system restoration, session migration, and comprehensive error handling.

## Technical Context
**Language/Version**: TypeScript 5.0+ with Next.js 14
**Primary Dependencies**: Supabase (existing), Next.js App Router, JWT tokens
**Storage**: Supabase PostgreSQL with user authentication tables
**Testing**: Jest + React Testing Library for authentication flows
**Target Platform**: Web application (browser + Node.js server)
**Project Type**: web - Next.js frontend + backend API routes
**Performance Goals**: <500ms authentication response, seamless user experience
**Constraints**: Zero downtime deployment, preserve existing user data
**Scale/Scope**: Fix affects all existing users, maintain 99.9% authentication reliability

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on template constitution principles:

### I. Library-First ✓
- Authentication components will be self-contained and testable
- Clear separation between authentication logic and application logic
- Independent testability with comprehensive test coverage

### II. CLI Interface ✓
- Authentication APIs will have structured JSON input/output
- Error responses will be machine-readable and human-friendly
- Consistent interface patterns across authentication endpoints

### III. Test-First (NON-NEGOTIABLE) ✓
- TDD approach: Authentication tests → Integration tests → Implementation
- Red-Green-Refactor cycle for all authentication fixes
- Tests will fail first, then implementation makes them pass

### IV. Integration Testing ✓
- Cross-component authentication flow testing
- Session management integration testing
- Error handling integration across login/signup flows

### V. Observability ✓
- Comprehensive logging for authentication attempts and failures
- Performance metrics for authentication response times
- Error tracking and monitoring for regression detection

**Gate Status**: PASS - All constitutional principles align with authentication fix requirements

## Project Structure

### Documentation (this feature)
```
specs/012-invalid-email-or/
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
│   ├── api/auth/        # Authentication API endpoints (fix required)
│   ├── auth/           # Authentication pages (update required)
│   └── dashboard/      # Protected pages (session validation)
├── lib/
│   ├── auth-context.tsx # Authentication React context (enhance)
│   ├── auth-utils.ts   # Authentication utility functions (fix)
│   └── supabase.ts     # Supabase client configuration (verify)
├── components/
│   └── ui/             # UI components for authentication flows
└── tests/
    ├── contract/       # Authentication API contract tests
    ├── integration/    # Authentication flow integration tests
    └── unit/           # Individual authentication component tests
```

**Structure Decision**: Option 2 (Web application) - Next.js with authentication system fixes

## Phase 0: Outline & Research ✓

**Research completed with the following findings:**

### Root Cause Analysis:
1. **Authentication Mode Switch**: Recent deployment switched from demo authentication to real Supabase
   - **Impact**: Existing demo users can no longer authenticate
   - **Evidence**: Code shows both demo users and Supabase authentication paths

2. **Session Invalidation**: User sessions created under demo mode are incompatible with Supabase
   - **Impact**: Previously logged-in users are now locked out
   - **Evidence**: Different token formats and validation mechanisms

3. **Credential Mismatch**: Users created accounts under demo mode, but system now expects Supabase accounts
   - **Impact**: "Invalid email or password" for legitimate credentials
   - **Evidence**: User data exists only in demo format, not in Supabase

### Technology Decisions:
1. **Authentication Strategy**: Hybrid authentication with graceful migration
   - **Rationale**: Preserve existing demo users while enabling real Supabase authentication
   - **Alternatives considered**: Force re-registration - rejected for poor user experience

2. **Migration Approach**: Automatic account migration on first login attempt
   - **Rationale**: Seamless user experience with zero data loss
   - **Alternatives considered**: Manual migration - rejected for complexity

3. **Session Management**: Enhanced session validation with fallback mechanisms
   - **Rationale**: Robust handling of mixed authentication scenarios
   - **Alternatives considered**: Session wipe - rejected for user impact

4. **Error Handling**: Differentiated error messages for better user guidance
   - **Rationale**: Users need clear guidance on authentication issues
   - **Alternatives considered**: Generic errors - rejected for poor UX

**Output**: All NEEDS CLARIFICATION resolved with concrete solution approach

## Phase 1: Design & Contracts

### 1. Data Model Design (data-model.md)
- Enhanced User Account entity with migration status tracking
- Authentication Session entity with hybrid token support
- Migration Log entity for tracking account transitions
- Error Event entity for authentication failure analysis

### 2. API Contract Generation (contracts/)
- Enhanced `/api/auth/signin` endpoint with migration logic
- Enhanced `/api/auth/signup` endpoint with conflict resolution
- New `/api/auth/migrate` endpoint for manual migration
- Enhanced error responses with actionable guidance

### 3. Contract Test Generation
- One test file per API endpoint with regression scenarios
- Tests must fail initially (before migration implementation)
- Integration tests for demo-to-Supabase migration flow

### 4. Integration Test Scenarios
- Demo user attempting to login (should trigger migration)
- Supabase user attempting to login (should work normally)
- New user registration (should create Supabase account)
- Session validation across authentication modes

### 5. Agent Context Update (CLAUDE.md)
- Add authentication regression fix documentation
- Include migration patterns and error handling approaches
- Update recent changes with authentication system enhancements

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
- Dependency order: Data models → Authentication logic → API endpoints → UI updates
- Mark [P] for parallel execution (independent components)

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md covering:
1. Enhanced authentication API endpoints (4-5 tasks)
2. User account migration logic (3-4 tasks)
3. Session management improvements (2-3 tasks)
4. Error handling enhancements (2-3 tasks)
5. UI and documentation updates (3-4 tasks)

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

---
*Based on Constitution template - See `.specify/memory/constitution.md`*