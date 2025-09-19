# Implementation Plan: Fluid Sign-In with Email Validation and Dashboard State Persistence

**Branch**: `002-i-want-to` | **Date**: 2025-09-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-i-want-to/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✓ Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detected Project Type: web (Next.js frontend + backend)
   → Structure Decision: Option 2 (Web application)
3. Evaluate Constitution Check section below
   → Minor violations documented in Complexity Tracking
   → Justifications provided
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → Research email validation best practices
   → Research dashboard state persistence patterns
   → Research token expiration standards
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
6. Re-evaluate Constitution Check section
   → No new violations
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implementing a fluid sign-in system that allows immediate dashboard access without email validation, while providing email verification as a background process. Dashboard state will persist across sessions, restoring users to their exact previous view. The system uses Next.js 14 with JWT authentication and local storage for state persistence.

## Technical Context
**Language/Version**: TypeScript 5.x / Node.js 18+
**Primary Dependencies**: Next.js 14, JWT, nodemailer, bcrypt
**Storage**: File-based JSON storage (existing pattern), localStorage for client state
**Testing**: Jest + React Testing Library
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge)
**Project Type**: web - Next.js application
**Performance Goals**: <500ms dashboard load, <100ms state restore
**Constraints**: Email delivery within 5 minutes, immediate dashboard access
**Scale/Scope**: Support for thousands of concurrent users

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Next.js monorepo with api routes and frontend)
- Using framework directly? ✓ (Next.js App Router, no wrapper classes)
- Single data model? ✓ (User model with embedded validation state)
- Avoiding patterns? ✓ (Direct file access, no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? ✓ (auth utilities, email service, state manager)
- Libraries listed:
  - auth-service: Handle authentication and validation
  - email-service: Send validation emails
  - state-manager: Dashboard state persistence
- CLI per library: Planning simple test CLIs for each service
- Library docs: Will follow existing pattern

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✓ (will write failing tests first)
- Git commits show tests before implementation? ✓
- Order: Contract→Integration→E2E→Unit strictly followed? ✓
- Real dependencies used? ✓ (actual file system, real email service in test mode)
- Integration tests for: new libraries, contract changes, shared schemas? ✓
- FORBIDDEN: Implementation before test, skipping RED phase ✓

**Observability**:
- Structured logging included? ✓ (console logs with context)
- Frontend logs → backend? ✓ (error reporting to API)
- Error context sufficient? ✓ (user ID, action, timestamp)

**Versioning**:
- Version number assigned? N/A (feature addition to existing app)
- BUILD increments on every change? N/A
- Breaking changes handled? ✓ (backward compatible)

## Project Structure

### Documentation (this feature)
```
specs/002-i-want-to/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (Next.js structure)
ezedit/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── validate/      # New email validation endpoint
│   │   │   └── resend/        # New resend validation endpoint
│   │   └── dashboard/
│   │       └── state/         # New dashboard state endpoints
│   ├── dashboard/
│   │   └── page.tsx          # Enhanced with state persistence
│   └── auth/
│       └── verify/           # New email verification page
├── lib/
│   ├── auth/
│   │   └── validation.ts    # Email validation utilities
│   ├── email/
│   │   └── sender.ts        # Email service
│   └── state/
│       └── dashboard.ts     # Dashboard state manager
└── tests/
    ├── contract/
    ├── integration/
    └── unit/
```

**Structure Decision**: Option 2 - Web application (existing Next.js structure)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Dashboard state elements to persist (from NEEDS CLARIFICATION)
   - Email token expiration period (from NEEDS CLARIFICATION)
   - State retention duration (from NEEDS CLARIFICATION)

2. **Generate and dispatch research agents**:
   ```
   Task: "Research email validation token best practices and standard expiration times"
   Task: "Research dashboard state persistence patterns in React/Next.js"
   Task: "Find industry standards for email validation flow"
   Task: "Research cross-device state synchronization approaches"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Enhanced User entity with email_verified field
   - EmailValidationToken entity
   - DashboardState entity
   - Validation rules and state transitions

2. **Generate API contracts** from functional requirements:
   - POST /api/auth/validate - Validate email token
   - POST /api/auth/resend - Resend validation email
   - GET /api/dashboard/state - Get saved dashboard state
   - POST /api/dashboard/state - Save dashboard state
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - Test email validation endpoint
   - Test resend functionality
   - Test state persistence endpoints
   - Tests must fail initially

4. **Extract test scenarios** from user stories:
   - New user registration with immediate access
   - Email validation flow
   - Dashboard state persistence and restoration
   - Edge cases handling

5. **Update CLAUDE.md incrementally**:
   - Add email validation context
   - Add dashboard state persistence context
   - Keep under 150 lines

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs
- Email validation tasks [P]
- Dashboard state tasks [P]
- Integration test tasks
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Auth before dashboard state
- Mark [P] for parallel execution

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| File-based storage | Existing pattern in codebase | Database would add unnecessary complexity for MVP |
| JWT in cookies | Security and existing auth pattern | Session storage less secure for auth tokens |

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - ✓ research.md created
- [x] Phase 1: Design complete (/plan command) - ✓ data-model.md, contracts/, quickstart.md created
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - ✓ Approach documented
- [ ] Phase 3: Tasks generated (/tasks command) - Ready for /tasks command
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved - ✓ All clarified in research.md
- [x] Complexity deviations documented - ✓ Minor deviations justified

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*