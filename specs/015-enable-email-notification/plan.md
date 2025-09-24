# Implementation Plan: Enable Email Notification System

**Branch**: `015-enable-email-notification` | **Date**: 2025-09-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-enable-email-notification/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
   → Loaded spec with 10 functional requirements and 5 clarifications needed
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detect Project Type: web application (Next.js frontend + backend)
   → Set Structure Decision: Option 2 (web application structure)
3. Fill the Constitution Check section ✓
   → Constitution template found but not customized - using default principles
4. Evaluate Constitution Check section ✓
   → No violations - email notification system aligns with simplicity principles
   → Update Progress Tracking: Initial Constitution Check ✓
5. Execute Phase 0 → research.md ✓
   → Resolving clarifications with reasonable defaults
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
Enable a comprehensive email notification system using Resend API for sending transactional and notification emails. The system will support user account events (registration, password reset), notification preferences, delivery tracking with retry logic, and both HTML/plain text formats. Technical approach uses Resend API with provided production key, React email templates, and queue-based processing for reliability.

## Technical Context
**Language/Version**: TypeScript 5.0+ with Next.js 14
**Primary Dependencies**: Resend API client, React Email, DOMPurify for sanitization
**Storage**: Supabase PostgreSQL for notification logs and preferences
**Testing**: Jest + React Testing Library for components, API mocking for Resend
**Target Platform**: Web application (browser + Node.js server)
**Project Type**: web - Next.js frontend + backend API routes
**Performance Goals**: <2s email dispatch, 99% delivery rate, <100ms API response
**Constraints**: Resend API rate limits (100 emails/hour free tier, 5000/month), email size <25MB
**Scale/Scope**: Support for 1000+ users, 10+ notification types, 5000 emails/month

**Resend API Configuration**:
- API Key: `re_37YYP2iE_KbLqkdskcjngf9XqFMJZv1xG` (production)
- Service Category: Email/Communication
- Environment: Production
- Access Level: PRODUCTION

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on template constitution principles (defaults as no custom constitution exists):

### I. Library-First ✓
- Email service will be a standalone module (`lib/email/`)
- Resend integration isolated in service layer
- Notification queue processor as independent service

### II. CLI Interface ✓
- Email sending exposed via API endpoints
- JSON responses for all email operations
- Test endpoints for email preview and validation

### III. Test-First (NON-NEGOTIABLE) ✓
- TDD approach: Email tests → Integration tests → Implementation
- Mock Resend API for testing
- Contract tests for all notification endpoints

### IV. Integration Testing ✓
- End-to-end notification flow tests
- Email delivery status tracking tests
- User preference enforcement tests

### V. Observability ✓
- Comprehensive logging for all email operations
- Delivery metrics and failure tracking
- Performance monitoring for queue processing

**Gate Status**: PASS - All constitutional principles can be followed

## Project Structure

### Documentation (this feature)
```
specs/015-enable-email-notification/
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
│   ├── api/
│   │   ├── email/          # Email API endpoints
│   │   └── notifications/  # Notification management APIs
│   └── settings/
│       └── notifications/  # User preference UI
├── lib/
│   ├── email/             # Email service layer
│   │   ├── resend.ts      # Resend API client
│   │   ├── templates.tsx  # React email templates
│   │   └── queue.ts       # Email queue processor
│   └── notifications/     # Notification logic
├── components/
│   └── notifications/     # Notification UI components
└── tests/
    ├── contract/          # API contract tests
    ├── integration/       # Email flow tests
    └── unit/              # Service unit tests
```

**Structure Decision**: Option 2 (Web application) - Next.js with email service integration

## Phase 0: Outline & Research ✓

**Research completed with the following resolutions:**

### Notification Types (FR-011 clarification):
- **User Account Events**: Registration welcome, email verification, password reset, account deletion
- **System Events**: Error alerts for admins, security notifications
- **Activity Notifications**: File upload completion, edit confirmations (opt-in)
- **Decision**: Start with critical account events, expand based on user feedback

### Email Templates (FR-012 clarification):
- **Template Categories**: Transactional (must-send), Marketing (optional), System alerts
- **Implementation**: React Email for all templates with consistent branding
- **Decision**: All emails use templates for consistency and maintainability

### Admin Alerts (FR-013 clarification):
- **Critical Events**: Authentication failures (5+ in 5 mins), API errors (500s), service downtime
- **Delivery**: Immediate dispatch to admin email list
- **Decision**: Focus on security and availability events initially

### Rate Limits (FR-014 clarification):
- **Resend Limits**: 100 emails/hour on free tier, upgrade path available
- **Application Limits**: Max 10 emails per user per hour, 50 per day
- **Decision**: Implement application-level rate limiting to prevent abuse

### Delivery Timeframe (FR-015 clarification):
- **Transactional**: Immediate dispatch (<30 seconds)
- **Notifications**: Within 5 minutes via queue
- **Bulk/Marketing**: Batched hourly
- **Decision**: Priority queue system with immediate dispatch for critical emails

**Output**: All NEEDS CLARIFICATION resolved with reasonable defaults

## Phase 1: Design & Contracts

### 1. Data Model Design (data-model.md)
- EmailNotification entity with status tracking
- NotificationTemplate with React email components
- NotificationPreference for user settings
- EmailDeliveryLog for audit trail
- EmailQueue for reliable processing

### 2. API Contract Generation (contracts/)
- POST /api/email/send - Direct email sending
- POST /api/notifications/trigger - Event-based notification
- GET/PUT /api/notifications/preferences - User preference management
- GET /api/email/status/{id} - Delivery status tracking
- POST /api/email/test - Template preview and testing

### 3. Contract Test Generation
- One test file per API endpoint
- Mock Resend API responses
- Tests must fail initially (before implementation)

### 4. Integration Test Scenarios
- Complete registration → welcome email flow
- Password reset → email → link validation
- Preference update → notification filtering
- Failed delivery → retry with backoff

### 5. Agent Context Update (CLAUDE.md)
- Add Resend API configuration
- Document email service architecture
- Include template examples
- Update recent changes

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API contract → contract test task [P]
- Each entity → model creation task [P]
- Each service → implementation task
- Each UI component → component task

**Ordering Strategy**:
- TDD order: Contract tests → Integration tests → Implementation
- Dependency order: Models → Services → APIs → UI
- Mark [P] for parallel execution where possible

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (following TDD principles)
**Phase 4**: Implementation and testing
**Phase 5**: Deployment and monitoring

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
- [ ] Phase 2: Task planning complete (/tasks command)
- [ ] Phase 3: Implementation complete
- [ ] Phase 4: Testing complete
- [ ] Phase 5: Deployment complete

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Constitution template - See `.specify/memory/constitution.md`*