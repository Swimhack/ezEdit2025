# Implementation Plan: Google OAuth Integration for Live Production

**Branch**: `003-ezedit-co-should` | **Date**: 2025-09-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ezedit-co-should/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement live Google OAuth integration for ezedit.co to enable seamless user authentication with Google accounts. The system will handle OAuth consent flow, automatic account creation from Google profiles, secure token management, and graceful error handling while maintaining compatibility with existing email/password authentication methods.

## Technical Context
**Language/Version**: TypeScript 5.3 / Node.js 18+, React 18
**Primary Dependencies**: Supabase Auth, Google OAuth 2.0 API, Next.js 14 authentication
**Storage**: Supabase PostgreSQL for user profiles and OAuth tokens, secure encrypted storage
**Testing**: Jest for unit tests, Playwright for OAuth flow E2E tests
**Target Platform**: Web application, responsive design for desktop and mobile
**Project Type**: web - Next.js full-stack with OAuth integration
**Performance Goals**: <2s OAuth callback processing, <200ms session validation
**Constraints**: Google OAuth policy compliance, GDPR compliance, secure token handling
**Scale/Scope**: Support 1000+ concurrent OAuth flows, integrate with existing user system

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (oauth-service, auth-integration)
- Using framework directly? Yes - Supabase Auth, Google OAuth 2.0 SDK directly
- Single data model? Yes - extends existing user profile with OAuth data
- Avoiding patterns? Yes - direct OAuth flow, no unnecessary OAuth wrappers

**Architecture**:
- EVERY feature as library? Yes - OAuth service as standalone module
- Libraries listed:
  - oauth-service: Google OAuth flow management and token handling
  - auth-integration: Integration with existing Supabase authentication
- CLI per library: OAuth testing CLI, token validation commands
- Library docs: OAuth integration guide and troubleshooting

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes - actual Google OAuth service in test mode
- Integration tests for: OAuth flow, token refresh, account linking? Yes
- FORBIDDEN: Implementation before test, skipping RED phase - Understood

**Observability**:
- Structured logging included? Yes - OAuth events, errors, security events
- Frontend logs → backend? Yes - OAuth flow tracking via Supabase
- Error context sufficient? Yes - OAuth errors, user context, flow state

**Versioning**:
- Version number assigned? Inherits from main EzEdit version
- BUILD increments on every change? Yes - automated via CI/CD
- Breaking changes handled? Yes - backward compatible OAuth integration

## Project Structure

### Documentation (this feature)
```
specs/003-ezedit-co-should/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# OAuth Integration Files
lib/oauth/              # OAuth service library
├── google.ts          # Google OAuth client
├── tokens.ts          # Token management
├── validation.ts      # OAuth validation
└── types.ts           # OAuth type definitions

app/auth/              # Authentication pages
├── signin/            # Enhanced with Google OAuth
├── callback/          # OAuth callback handler
└── error/            # OAuth error handling

components/auth/       # OAuth UI components
├── GoogleSignInButton.tsx
├── OAuthCallback.tsx
└── AuthError.tsx

# Integration with existing auth
lib/auth/             # Enhanced auth context
├── oauth-context.tsx # OAuth session management
└── auth-utils.ts     # OAuth helper functions
```

**Structure Decision**: Web application OAuth integration - enhances existing Next.js authentication

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Google scopes required (from NEEDS CLARIFICATION)
   - Session duration and token refresh policy (from NEEDS CLARIFICATION)
   - Account linking strategy for email conflicts (from NEEDS CLARIFICATION)
   - Google OAuth setup and configuration requirements
   - Supabase OAuth provider integration best practices

2. **Generate and dispatch research agents**:
   ```
   Task: "Research Google OAuth 2.0 setup and required scopes for web applications"
   Task: "Find Supabase OAuth provider integration best practices"
   Task: "Research session management and token refresh strategies for OAuth"
   Task: "Evaluate account linking approaches when email addresses conflict"
   Task: "Research Google OAuth branding and compliance requirements"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - OAuth Session, OAuth Configuration, User Profile (enhanced)
   - Authentication Event, OAuth Token, Account Link, OAuth Error
   - OAuth integration with existing user system

2. **Generate API contracts** from functional requirements:
   - OAuth initiation endpoint
   - OAuth callback handler
   - Token refresh endpoint
   - Account linking endpoints
   - Output OpenAPI schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - OAuth flow endpoint tests
   - Callback handler tests
   - Token validation tests
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Complete OAuth sign-in flow
   - Account creation from Google profile
   - Account linking with existing users
   - Error handling and recovery

5. **Update agent file incrementally**:
   - Run update script for Claude
   - Add Google OAuth context and integration knowledge
   - Update recent changes
   - Keep under 150 lines

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs
- Each OAuth endpoint → contract test task [P]
- Each OAuth entity → model creation task [P]
- Each user story → integration test task [P]
- Implementation tasks for OAuth flow components

**Ordering Strategy**:
- TDD order: Tests before implementation
- Dependency order: Models → Services → UI → Integration
- Mark [P] for parallel execution (independent OAuth components)

**Estimated Output**: 30-35 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, OAuth flow validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

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
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*