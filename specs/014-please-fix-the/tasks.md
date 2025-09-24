# Tasks: Fix File Display with Split Screen Editor

**Input**: Design documents from `/specs/014-please-fix-the/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extracted: TypeScript 5.0+ with Next.js 14, Monaco Editor, React 18
   → Structure: Next.js web application (ezedit/ directory)
2. Load optional design documents ✓
   → data-model.md: 4 entities → model tasks
   → contracts/: file-operations-api.yaml → 5 endpoint contract tests
   → research.md: Editor technology decisions → setup tasks
3. Generate tasks by category ✓
   → Setup: Monaco dependencies, TypeScript types, linting
   → Tests: contract tests, integration tests
   → Core: entities, components, API endpoints
   → Integration: editor state, file operations, UI
   → Polish: unit tests, performance, docs
4. Apply task rules ✓
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓
   → All contracts have tests ✓
   → All entities have models ✓
   → All endpoints implemented ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: `ezedit/app/`, `ezedit/lib/`, `ezedit/components/`, `ezedit/tests/`
- All paths relative to repository root

## Phase 3.1: Setup and Dependencies
- [ ] T001 Install Monaco Editor and required dependencies in ezedit/package.json
- [ ] T002 [P] Configure TypeScript editor types in ezedit/lib/types/editor.ts
- [ ] T003 [P] Configure TypeScript file types in ezedit/lib/types/file.ts
- [ ] T004 [P] Setup Prism.js for syntax highlighting in ezedit/lib/prism-config.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Contract test GET /api/files/content in ezedit/tests/contract/files-content.test.ts
- [ ] T006 [P] Contract test POST /api/files/preview in ezedit/tests/contract/files-preview.test.ts
- [ ] T007 [P] Contract test GET /api/editor/state in ezedit/tests/contract/editor-state-get.test.ts
- [ ] T008 [P] Contract test PUT /api/editor/state in ezedit/tests/contract/editor-state-put.test.ts
- [ ] T009 [P] Contract test GET /api/files/types in ezedit/tests/contract/files-types.test.ts
- [ ] T010 [P] Contract test POST /api/files/validate in ezedit/tests/contract/files-validate.test.ts
- [ ] T011 [P] Integration test file content loading in ezedit/tests/integration/file-loading.test.ts
- [ ] T012 [P] Integration test view mode switching in ezedit/tests/integration/mode-switching.test.ts
- [ ] T013 [P] Integration test split screen functionality in ezedit/tests/integration/split-screen.test.ts
- [ ] T014 [P] Integration test file type support matrix in ezedit/tests/integration/file-type-support.test.ts
- [ ] T015 [P] Integration test performance validation in ezedit/tests/integration/performance.test.ts
- [ ] T016 [P] Integration test accessibility compliance in ezedit/tests/integration/accessibility.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T017 [P] FileContent entity type in ezedit/lib/types/file-content.ts
- [ ] T018 [P] EditorState entity type in ezedit/lib/types/editor-state.ts
- [ ] T019 [P] FileTypeConfiguration entity type in ezedit/lib/types/file-type-config.ts
- [ ] T020 [P] UserPreferences entity type in ezedit/lib/types/user-preferences.ts
- [ ] T021 [P] File operations service in ezedit/lib/services/file-operations.ts
- [ ] T022 [P] Editor state service in ezedit/lib/services/editor-state.ts
- [ ] T023 [P] File content processing service in ezedit/lib/services/content-processor.ts
- [ ] T024 [P] WYSIWYG renderer service in ezedit/lib/services/wysiwyg-renderer.ts
- [ ] T025 Implement GET /api/files/content endpoint in ezedit/app/api/files/content/route.ts
- [ ] T026 Implement POST /api/files/preview endpoint in ezedit/app/api/files/preview/route.ts
- [ ] T027 Implement GET /api/editor/state endpoint in ezedit/app/api/editor/state/route.ts
- [ ] T028 Implement PUT /api/editor/state endpoint in ezedit/app/api/editor/state/route.ts
- [ ] T029 Implement GET /api/files/types endpoint in ezedit/app/api/files/types/route.ts
- [ ] T030 Implement POST /api/files/validate endpoint in ezedit/app/api/files/validate/route.ts

## Phase 3.4: Editor Components
- [ ] T031 [P] CodeEditor component with Monaco integration in ezedit/components/editor/CodeEditor.tsx
- [ ] T032 [P] WYSIWYGViewer component in ezedit/components/editor/WYSIWYGViewer.tsx
- [ ] T033 [P] FileViewer component wrapper in ezedit/components/editor/FileViewer.tsx
- [ ] T034 [P] ViewModeToggle component in ezedit/components/editor/ViewModeToggle.tsx
- [ ] T035 SplitScreenEditor component with pane management in ezedit/components/editor/SplitScreenEditor.tsx
- [ ] T036 EditorProvider context for state management in ezedit/lib/context/EditorContext.tsx

## Phase 3.5: Integration and UI Updates
- [ ] T037 Update file tree to trigger new file display in ezedit/components/file-tree/FileTree.tsx
- [ ] T038 Enhance middle pane layout for split screen in ezedit/app/editor/page.tsx
- [ ] T039 Add editor state persistence hooks in ezedit/lib/hooks/useEditorState.ts
- [ ] T040 Add file loading hooks in ezedit/lib/hooks/useFileContent.ts
- [ ] T041 Add view mode preference hooks in ezedit/lib/hooks/useViewModePreferences.ts
- [ ] T042 Update CSS for responsive split screen layout in ezedit/app/globals.css

## Phase 3.6: Polish and Validation
- [ ] T043 [P] Unit tests for file operations service in ezedit/tests/unit/file-operations.test.ts
- [ ] T044 [P] Unit tests for editor state service in ezedit/tests/unit/editor-state.test.ts
- [ ] T045 [P] Unit tests for content processor in ezedit/tests/unit/content-processor.test.ts
- [ ] T046 [P] Unit tests for CodeEditor component in ezedit/tests/unit/code-editor.test.ts
- [ ] T047 [P] Unit tests for WYSIWYGViewer component in ezedit/tests/unit/wysiwyg-viewer.test.ts
- [ ] T048 [P] Unit tests for SplitScreenEditor component in ezedit/tests/unit/split-screen-editor.test.ts
- [ ] T049 Performance optimization and caching implementation in ezedit/lib/services/cache-manager.ts
- [ ] T050 Execute quickstart validation scenarios from specs/014-please-fix-the/quickstart.md
- [ ] T051 Update CLAUDE.md with enhanced file display implementation details
- [ ] T052 Cleanup and remove any remaining file display issues

## Dependencies
```
Setup (T001-T004) → Tests (T005-T016) → Core (T017-T030) → Components (T031-T036) → Integration (T037-T042) → Polish (T043-T052)

Specific blocking relationships:
- T001 must complete before T005-T016 (tests need dependencies)
- T017-T020 must complete before T021-T024 (services need entity types)
- T021-T024 must complete before T025-T030 (endpoints need services)
- T025-T030 must complete before T031-T036 (components need working APIs)
- T031-T036 must complete before T037-T042 (integration needs components)
- T035 blocks T037-T038 (split screen component needed for layout)
- All implementation must complete before T050-T051 (validation and docs)
```

## Parallel Execution Examples

### Phase 3.2: Contract Tests (Launch Together)
```bash
# All contract tests can run in parallel since they're in different files
Task: "Contract test GET /api/files/content in ezedit/tests/contract/files-content.test.ts"
Task: "Contract test POST /api/files/preview in ezedit/tests/contract/files-preview.test.ts"
Task: "Contract test GET /api/editor/state in ezedit/tests/contract/editor-state-get.test.ts"
Task: "Contract test PUT /api/editor/state in ezedit/tests/contract/editor-state-put.test.ts"
Task: "Contract test GET /api/files/types in ezedit/tests/contract/files-types.test.ts"
Task: "Contract test POST /api/files/validate in ezedit/tests/contract/files-validate.test.ts"
```

### Phase 3.2: Integration Tests (Launch Together)
```bash
# All integration tests can run in parallel since they're in different files
Task: "Integration test file content loading in ezedit/tests/integration/file-loading.test.ts"
Task: "Integration test view mode switching in ezedit/tests/integration/mode-switching.test.ts"
Task: "Integration test split screen functionality in ezedit/tests/integration/split-screen.test.ts"
Task: "Integration test file type support matrix in ezedit/tests/integration/file-type-support.test.ts"
Task: "Integration test performance validation in ezedit/tests/integration/performance.test.ts"
Task: "Integration test accessibility compliance in ezedit/tests/integration/accessibility.test.ts"
```

### Phase 3.3: Entity Types (Launch Together)
```bash
# All entity types can be created in parallel since they're in different files
Task: "FileContent entity type in ezedit/lib/types/file-content.ts"
Task: "EditorState entity type in ezedit/lib/types/editor-state.ts"
Task: "FileTypeConfiguration entity type in ezedit/lib/types/file-type-config.ts"
Task: "UserPreferences entity type in ezedit/lib/types/user-preferences.ts"
```

### Phase 3.3: Services (Launch Together)
```bash
# All services can be created in parallel since they're in different files
Task: "File operations service in ezedit/lib/services/file-operations.ts"
Task: "Editor state service in ezedit/lib/services/editor-state.ts"
Task: "File content processing service in ezedit/lib/services/content-processor.ts"
Task: "WYSIWYG renderer service in ezedit/lib/services/wysiwyg-renderer.ts"
```

### Phase 3.4: Editor Components (Launch Together)
```bash
# Most editor components can be created in parallel since they're in different files
Task: "CodeEditor component with Monaco integration in ezedit/components/editor/CodeEditor.tsx"
Task: "WYSIWYGViewer component in ezedit/components/editor/WYSIWYGViewer.tsx"
Task: "FileViewer component wrapper in ezedit/components/editor/FileViewer.tsx"
Task: "ViewModeToggle component in ezedit/components/editor/ViewModeToggle.tsx"
```

### Phase 3.6: Unit Tests (Launch Together)
```bash
# All unit tests can run in parallel since they're in different files
Task: "Unit tests for file operations service in ezedit/tests/unit/file-operations.test.ts"
Task: "Unit tests for editor state service in ezedit/tests/unit/editor-state.test.ts"
Task: "Unit tests for content processor in ezedit/tests/unit/content-processor.test.ts"
Task: "Unit tests for CodeEditor component in ezedit/tests/unit/code-editor.test.ts"
Task: "Unit tests for WYSIWYGViewer component in ezedit/tests/unit/wysiwyg-viewer.test.ts"
Task: "Unit tests for SplitScreenEditor component in ezedit/tests/unit/split-screen-editor.test.ts"
```

## Task Details

### Critical File Display Tasks
- **T025**: Implement enhanced file content API with metadata and caching
- **T026**: WYSIWYG preview generation with DOMPurify sanitization
- **T031**: Monaco Editor integration with proper TypeScript support
- **T032**: WYSIWYG viewer with iframe/shadow DOM isolation
- **T035**: Split screen with resizable panes and synchronized content

### Performance Optimization Tasks
- **T021**: File operations with caching and lazy loading
- **T023**: Content processing with 200ms target load time
- **T049**: Cache manager for frequently accessed files and processed content
- **T015**: Performance validation ensuring 60fps editing and <200ms loads

### Integration Tasks
- **T037**: File tree integration with new display system
- **T038**: Middle pane layout enhancement for split screen support
- **T039-T041**: React hooks for state management and preferences
- **T036**: Context provider for global editor state

### Validation Tasks
- **T050**: Execute comprehensive quickstart scenarios
- **T016**: Accessibility compliance testing (WCAG 2.2)
- **T051**: Documentation updates with implementation details
- **T052**: Final cleanup and issue resolution

## Notes
- [P] tasks = different files, no dependencies between them
- Verify all tests fail before implementing (TDD requirement)
- Commit after each task completion
- Focus on fixing file display issues while adding split screen capability
- Monaco Editor must support TypeScript, JavaScript, HTML, CSS, Markdown, JSON
- All file operations must handle encoding detection and size limits
- Split screen must support independent mode control per pane

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T005-T010)
- [x] All entities have model tasks (T017-T020)
- [x] All tests come before implementation (T005-T016 before T017-T030)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] File display enhancement is prioritized (T025, T031, T035)
- [x] Performance targets specified (T015: <200ms loads, 60fps editing)
- [x] Complete validation coverage (T050: quickstart scenarios)
- [x] Monaco Editor integration properly planned (T001, T031)
- [x] Split screen functionality fully covered (T013, T035, T038)