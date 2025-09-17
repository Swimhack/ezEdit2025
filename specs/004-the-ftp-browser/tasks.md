# Tasks: FTP Browser Three-Pane Editor

**Input**: Design documents from `/specs/004-the-ftp-browser/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extract: Next.js 14, React 18, TypeScript, Monaco Editor, CSS Grid
2. Load design documents:
   → data-model.md: Extract EditorState, FTPFileNode, EditorSession
   → contracts/: editor-api.yaml → API test tasks
   → research.md: Extract Monaco integration, responsive design
3. Generate tasks by category:
   → Setup: project dependencies, Monaco configuration
   → Tests: contract tests, integration tests
   → Core: components, state management, API endpoints
   → Integration: FTP operations, file loading/saving
   → Polish: responsive design, error handling, performance
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app structure**: `app/`, `components/`, `lib/` at repository root
- Frontend components: `components/editor/`
- API routes: `app/api/ftp/editor/`
- Utilities: `lib/editor-state.ts`, `lib/file-operations.ts`

## Phase 3.1: Setup
- [ ] T001 Install Monaco Editor and React dependencies (@monaco-editor/react, monaco-editor)
- [ ] T002 [P] Configure TypeScript types for Monaco Editor integration
- [ ] T003 [P] Create editor theme configuration file in lib/editor-themes.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test GET /api/ftp/editor/layout in tests/contract/test_editor_layout_get.test.ts
- [ ] T005 [P] Contract test PUT /api/ftp/editor/layout in tests/contract/test_editor_layout_put.test.ts
- [ ] T006 [P] Contract test POST /api/ftp/editor/file in tests/contract/test_editor_file_post.test.ts
- [ ] T007 [P] Contract test PUT /api/ftp/editor/file in tests/contract/test_editor_file_put.test.ts
- [ ] T008 [P] Contract test GET /api/ftp/editor/preview in tests/contract/test_editor_preview_get.test.ts
- [ ] T009 [P] Integration test three-pane editor loading in tests/integration/test_editor_loading.test.tsx
- [ ] T010 [P] Integration test file selection workflow in tests/integration/test_file_selection.test.tsx
- [ ] T011 [P] Integration test file save workflow in tests/integration/test_file_save.test.tsx
- [ ] T012 [P] E2E test complete editor workflow in tests/e2e/test_editor_workflow.spec.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T013 [P] EditorState context provider in lib/editor-state.ts
- [ ] T014 [P] FTPFileNode utilities in lib/file-operations.ts
- [ ] T015 [P] PaneVisibility and LayoutConfig types in lib/editor-types.ts
- [ ] T016 [P] ThreePaneEditor main component in components/editor/ThreePaneEditor.tsx
- [ ] T017 [P] FileTreePane component in components/editor/FileTreePane.tsx
- [ ] T018 [P] EditorPane component in components/editor/EditorPane.tsx
- [ ] T019 [P] PreviewPane component in components/editor/PreviewPane.tsx
- [ ] T020 GET /api/ftp/editor/layout endpoint
- [ ] T021 PUT /api/ftp/editor/layout endpoint
- [ ] T022 POST /api/ftp/editor/file endpoint
- [ ] T023 PUT /api/ftp/editor/file endpoint
- [ ] T024 GET /api/ftp/editor/preview endpoint

## Phase 3.4: Integration
- [ ] T025 Connect FileTreePane to FTP list API
- [ ] T026 Integrate Monaco Editor with file loading
- [ ] T027 Implement file save workflow with FTP
- [ ] T028 Add editor pane resize functionality
- [ ] T029 Connect preview pane to file metadata API

## Phase 3.5: Polish
- [ ] T030 [P] Responsive layout for tablet breakpoint (768-1199px)
- [ ] T031 [P] Mobile layout implementation (<768px)
- [ ] T032 [P] Error handling for FTP connection issues
- [ ] T033 [P] Loading states and skeleton UI
- [ ] T034 [P] File dirty state indicator
- [ ] T035 [P] Syntax highlighting configuration
- [ ] T036 Performance optimization for large files (>1MB)
- [ ] T037 [P] Unit tests for editor utilities in tests/unit/test_editor_utils.test.ts
- [ ] T038 [P] Update dashboard integration to launch editor
- [ ] T039 Run manual testing from quickstart.md
- [ ] T040 Performance testing (<2s load, <500ms switching)

## Dependencies
- Tests (T004-T012) before implementation (T013-T024)
- T013 blocks T016, T025
- T014 blocks T017, T025
- T015 blocks T016-T019
- T016 blocks T025-T029
- T020-T024 block T025-T029
- Implementation before polish (T030-T040)

## Parallel Example
```
# Launch T004-T008 together (contract tests):
Task: "Contract test GET /api/ftp/editor/layout in tests/contract/test_editor_layout_get.test.ts"
Task: "Contract test PUT /api/ftp/editor/layout in tests/contract/test_editor_layout_put.test.ts"
Task: "Contract test POST /api/ftp/editor/file in tests/contract/test_editor_file_post.test.ts"
Task: "Contract test PUT /api/ftp/editor/file in tests/contract/test_editor_file_put.test.ts"
Task: "Contract test GET /api/ftp/editor/preview in tests/contract/test_editor_preview_get.test.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Monaco Editor requires webpack configuration for Next.js
- CSS Grid preferred for three-pane layout responsiveness

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts (editor-api.yaml)**:
   - Each endpoint → contract test task [P]
   - Each endpoint → implementation task

2. **From Data Model**:
   - EditorState → context provider task [P]
   - FTPFileNode → utilities task [P]
   - Supporting types → types file task [P]

3. **From User Stories (quickstart.md)**:
   - Basic editor loading → integration test [P]
   - File navigation → integration test [P]
   - File editing/saving → integration test [P]
   - Complete workflow → E2E test [P]

4. **Ordering**:
   - Setup → Tests → Models → Components → APIs → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All API contracts have corresponding tests
- [ ] All data models have implementation tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] Monaco Editor integration properly configured
- [ ] Responsive design tasks cover all breakpoints
- [ ] Performance targets addressed in polish phase