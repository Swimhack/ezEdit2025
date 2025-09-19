# Implementation Plan: Fix FTP Editor Loading Failure

**Branch**: `004-address-a-feature` | **Date**: 2025-09-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-address-a-feature/spec.md`

## Summary
Fix critical FTP editor loading bug where users see "Editor Error - Failed to fetch" when clicking "Edit Files" from dashboard. Root cause identified: storage system mismatch between website API (memory-store) and FTP editor API (file-store). Must preserve existing UI and functionality while implementing robust error handling.

## Technical Context
**Language/Version**: TypeScript 5.0+ with Next.js 14
**Primary Dependencies**: Next.js App Router, basic-ftp, Monaco Editor, Supabase, Tailwind CSS
**Storage**: Dual storage systems (memory-store vs file-store) - CRITICAL MISMATCH
**Testing**: Jest with Next.js integration, contract tests, integration tests
**Target Platform**: Web application (Fly.io deployment)
**Project Type**: web - Next.js frontend + API backend
**Performance Goals**: <2s editor load, <500ms file switching, graceful error handling
**Constraints**: Must not affect UI or other features, preserve existing architecture
**Scale/Scope**: Single-user demo system, FTP connection pooling, 10MB file limit

**User Guidance**: Be sure not to affect anything negatively on the current site and set up UX UI

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**No Constitution Document Found** - Using default principles:
- ✅ Library-First: Utilize existing FTP infrastructure
- ✅ Test-First: Maintain existing test coverage
- ✅ Integration Testing: Focus on storage system alignment
- ✅ Simplicity: Fix root cause without architectural changes
- ✅ Observability: Improve error logging and user feedback

## Project Structure

### Documentation (this feature)
```
specs/004-address-a-feature/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 2: Web application (Next.js + API)
app/
├── api/
│   ├── websites/        # Website management APIs
│   └── ftp/            # FTP operation APIs
├── editor/             # Three-pane editor pages
├── websites/           # Website dashboard
└── components/         # Shared components

lib/
├── websites-store.ts       # File-based storage (FTP editor)
├── websites-memory-store.ts # Memory storage (website API)
├── ftp-connections.ts      # FTP connection pooling
└── editor-state.tsx        # Editor React context

tests/
├── contract/           # API contract tests
├── integration/        # End-to-end workflow tests
└── unit/              # Component tests
```

**Structure Decision**: Option 2 (Web application) - Next.js with API routes

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - Storage system alignment strategy
   - Error handling patterns for FTP connections
   - User experience during connection failures

2. **Generate and dispatch research agents**:
   ```
   Task: "Research storage system alignment for websites-store vs websites-memory-store"
   Task: "Find best practices for FTP connection error handling in Next.js"
   Task: "Research user-friendly error messages for network failures"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all technical decisions resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Editor Session (connection state, loaded files)
   - FTP Connection (parameters, status)
   - Error State (categorized errors, retry capabilities)

2. **Generate API contracts** from functional requirements:
   - Storage alignment contracts
   - Error handling endpoint contracts
   - User feedback API contracts
   - Output OpenAPI schemas to `/contracts/`

3. **Generate contract tests** from contracts:
   - Storage system compatibility tests
   - Error handling flow tests
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Successful editor loading after fix
   - Graceful error handling scenarios
   - Retry functionality validation

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
   - Add storage system alignment context
   - Preserve existing FTP infrastructure
   - Update with error handling patterns

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Storage alignment task [P]
- Error handling enhancement tasks [P]
- User experience improvement tasks
- Integration test tasks to verify fix

**Ordering Strategy**:
- TDD order: Tests before implementation
- Critical path: Storage alignment first, then error handling
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md

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
| N/A | N/A | N/A |

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
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*