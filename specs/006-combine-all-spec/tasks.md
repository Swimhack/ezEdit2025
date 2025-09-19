# Tasks: Combine All Spec Files

**Input**: Design documents from `C:\STRICKLAND\Strickland Technology Marketing\ezedit.co\specs\006-combine-all-spec\`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: Node.js/TypeScript, markdown-it, Handlebars templates
   → Structure: Single project with documentation processing utility
2. Load optional design documents: ✅
   → data-model.md: 6 core entities (SpecCollection, FeatureIndex, etc.)
   → contracts/: TypeScript interfaces for all aggregation components
   → research.md: markdown-it parser, Handlebars templates, performance targets
3. Generate tasks by category: ✅
   → Setup: Dependencies, project structure, CLI framework
   → Tests: Contract tests, integration scenarios
   → Core: Parsing engine, cross-reference resolver, document generator
   → Integration: CLI interface, file processing pipeline
   → Polish: Performance optimization, validation, documentation
4. Apply task rules: ✅
   → Different files = mark [P] for parallel
   → Core parsing must happen before document generation
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness: ✅
   → All contracts have tests
   → All entities have implementation tasks
   → All integration scenarios covered
9. Return: SUCCESS (tasks ready for execution) ✅
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project structure**: Create `src/spec-aggregator/` for core components
- **Scripts**: Add to existing `scripts/` directory
- **Output**: Generate to `docs/` directory
- All paths relative to repository root

## Phase 3.1: Setup & Dependencies
- [ ] T001 Install aggregation dependencies (markdown-it, handlebars, gray-matter, fs-extra) in `package.json`
- [ ] T002 Create project structure for spec aggregation in `src/spec-aggregator/`
- [ ] T003 [P] Configure TypeScript compilation for aggregation utilities
- [ ] T004 [P] Setup npm script `combine-specs` in `package.json`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T005 [P] Contract test for SpecAggregator interface in `tests/contract/test_spec_aggregator.ts`
- [ ] T006 [P] Contract test for SpecParser interface in `tests/contract/test_spec_parser.ts`
- [ ] T007 [P] Contract test for CrossReferenceResolver interface in `tests/contract/test_cross_ref_resolver.ts`
- [ ] T008 [P] Contract test for DocumentGenerator interface in `tests/contract/test_document_generator.ts`
- [ ] T009 [P] Integration test for complete aggregation workflow in `tests/integration/test_full_aggregation.ts`
- [ ] T010 [P] Integration test for malformed input handling in `tests/integration/test_error_handling.ts`
- [ ] T011 [P] Integration test for cross-reference resolution in `tests/integration/test_cross_references.ts`
- [ ] T012 [P] Integration test for performance validation in `tests/integration/test_performance.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
### Entity Models and Types
- [ ] T013 [P] Create TypeScript interfaces from contracts in `src/spec-aggregator/types/index.ts`
- [ ] T014 [P] Implement SpecificationCollection entity in `src/spec-aggregator/models/SpecificationCollection.ts`
- [ ] T015 [P] Implement FeatureIndex entity in `src/spec-aggregator/models/FeatureIndex.ts`
- [ ] T016 [P] Implement RequirementMatrix entity in `src/spec-aggregator/models/RequirementMatrix.ts`
- [ ] T017 [P] Implement ConsolidatedDocument entity in `src/spec-aggregator/models/ConsolidatedDocument.ts`
- [ ] T018 [P] Implement NavigationStructure entity in `src/spec-aggregator/models/NavigationStructure.ts`
- [ ] T019 [P] Implement DependencyMap entity in `src/spec-aggregator/models/DependencyMap.ts`

### Core Processing Components
- [ ] T020 Implement SpecParser with markdown-it in `src/spec-aggregator/parsers/SpecParser.ts`
- [ ] T021 Implement SpecAggregator main orchestrator in `src/spec-aggregator/SpecAggregator.ts`
- [ ] T022 Implement CrossReferenceResolver in `src/spec-aggregator/resolvers/CrossReferenceResolver.ts`
- [ ] T023 Create Handlebars template system in `src/spec-aggregator/templates/`

### Document Generation
- [ ] T024 Implement DocumentGenerator with Handlebars in `src/spec-aggregator/generators/DocumentGenerator.ts`
- [ ] T025 [P] Create main document template in `src/spec-aggregator/templates/main.hbs`
- [ ] T026 [P] Create table of contents template in `src/spec-aggregator/templates/partials/toc.hbs`
- [ ] T027 [P] Create feature section template in `src/spec-aggregator/templates/partials/feature.hbs`
- [ ] T028 [P] Create requirements matrix template in `src/spec-aggregator/templates/partials/requirements.hbs`

## Phase 3.4: CLI and Integration
- [ ] T029 Implement CLI interface in `scripts/combine-specs.js`
- [ ] T030 Add file discovery and scanning logic to SpecAggregator
- [ ] T031 Integrate all components in main processing pipeline
- [ ] T032 Add comprehensive error handling and logging throughout pipeline
- [ ] T033 Implement validation and quality checks for generated documents

## Phase 3.5: Polish and Optimization
- [ ] T034 [P] Unit tests for SpecParser in `tests/unit/test_spec_parser.ts`
- [ ] T035 [P] Unit tests for CrossReferenceResolver in `tests/unit/test_cross_ref_resolver.ts`
- [ ] T036 [P] Unit tests for DocumentGenerator in `tests/unit/test_document_generator.ts`
- [ ] T037 Performance optimization for large specification collections
- [ ] T038 [P] Create comprehensive documentation in `docs/spec-aggregator.md`
- [ ] T039 Add watch mode for automatic regeneration on spec file changes
- [ ] T040 Run complete validation scenario from quickstart guide
- [ ] T041 Clean up temporary files and optimize build output

## Dependencies
### Critical Path
- T001-T004 (Setup) → T005-T012 (Tests) → T013-T028 (Implementation) → T029-T033 (Integration) → T034-T041 (Polish)

### Specific Dependencies
- T005-T012 must FAIL before T013-T028 (TDD requirement)
- T013-T019 (entity models) must complete before T020-T024 (processing components)
- T020 (SpecParser) must complete before T021 (SpecAggregator)
- T022 (CrossReferenceResolver) must complete before T024 (DocumentGenerator)
- T023 (template system) must complete before T024-T028 (document generation)
- T025-T028 (templates) can run parallel once T023 is complete
- T029-T033 depend on T020-T028 completion
- T034-T041 can run parallel once implementation is complete

## Parallel Execution Examples

### Phase 3.1: Setup Tasks
```bash
# Launch setup tasks in parallel:
Task: "Configure TypeScript compilation for aggregation utilities"
Task: "Setup npm script combine-specs in package.json"
```

### Phase 3.2: Contract Tests
```bash
# Launch contract tests in parallel (different files):
Task: "Contract test for SpecAggregator interface in tests/contract/test_spec_aggregator.ts"
Task: "Contract test for SpecParser interface in tests/contract/test_spec_parser.ts"
Task: "Contract test for CrossReferenceResolver interface in tests/contract/test_cross_ref_resolver.ts"
Task: "Contract test for DocumentGenerator interface in tests/contract/test_document_generator.ts"

# Launch integration tests in parallel:
Task: "Integration test for complete aggregation workflow in tests/integration/test_full_aggregation.ts"
Task: "Integration test for malformed input handling in tests/integration/test_error_handling.ts"
Task: "Integration test for cross-reference resolution in tests/integration/test_cross_references.ts"
Task: "Integration test for performance validation in tests/integration/test_performance.ts"
```

### Phase 3.3: Entity Models
```bash
# Create entity models in parallel:
Task: "Create TypeScript interfaces from contracts in src/spec-aggregator/types/index.ts"
Task: "Implement SpecificationCollection entity in src/spec-aggregator/models/SpecificationCollection.ts"
Task: "Implement FeatureIndex entity in src/spec-aggregator/models/FeatureIndex.ts"
Task: "Implement RequirementMatrix entity in src/spec-aggregator/models/RequirementMatrix.ts"
Task: "Implement ConsolidatedDocument entity in src/spec-aggregator/models/ConsolidatedDocument.ts"
Task: "Implement NavigationStructure entity in src/spec-aggregator/models/NavigationStructure.ts"
Task: "Implement DependencyMap entity in src/spec-aggregator/models/DependencyMap.ts"
```

### Phase 3.3: Templates
```bash
# Create Handlebars templates in parallel:
Task: "Create main document template in src/spec-aggregator/templates/main.hbs"
Task: "Create table of contents template in src/spec-aggregator/templates/partials/toc.hbs"
Task: "Create feature section template in src/spec-aggregator/templates/partials/feature.hbs"
Task: "Create requirements matrix template in src/spec-aggregator/templates/partials/requirements.hbs"
```

### Phase 3.5: Unit Tests and Documentation
```bash
# Unit tests and docs in parallel:
Task: "Unit tests for SpecParser in tests/unit/test_spec_parser.ts"
Task: "Unit tests for CrossReferenceResolver in tests/unit/test_cross_ref_resolver.ts"
Task: "Unit tests for DocumentGenerator in tests/unit/test_document_generator.ts"
Task: "Create comprehensive documentation in docs/spec-aggregator.md"
```

## Task Details

### T001: Install Aggregation Dependencies
**Purpose**: Add required npm packages for markdown processing and template generation
**File**: `package.json`
**Dependencies**: markdown-it, @types/markdown-it, handlebars, @types/handlebars, gray-matter, fs-extra, @types/fs-extra, chalk
**Validation**: Packages install successfully and TypeScript compilation works

### T005: Contract Test - SpecAggregator Interface
**Purpose**: Ensure SpecAggregator contract compliance before implementation
**File**: `tests/contract/test_spec_aggregator.ts`
**Test Cases**:
- discoverSpecs() returns SpecificationCollection with correct structure
- parseSpecFile() handles valid and invalid markdown files
- generateConsolidatedDoc() produces ConsolidatedDocument matching schema
- validateCollection() identifies errors and warnings correctly
**Must Fail**: Before T021 implementation

### T020: Implement SpecParser with markdown-it
**Purpose**: Core markdown parsing engine for specification files
**File**: `src/spec-aggregator/parsers/SpecParser.ts`
**Requirements**:
- Parse frontmatter using gray-matter
- Extract structured sections (User Scenarios, Requirements, etc.)
- Handle malformed markdown gracefully
- Extract functional requirements with ID parsing (FR-001, etc.)
**Validation**: All contract tests pass

### T024: Implement DocumentGenerator with Handlebars
**Purpose**: Template-based generation of consolidated documentation
**File**: `src/spec-aggregator/generators/DocumentGenerator.ts`
**Requirements**:
- Load and compile Handlebars templates
- Generate table of contents with proper nesting
- Resolve cross-references between features
- Handle template errors gracefully
**Dependencies**: T023 (template system), T022 (cross-reference resolver)

### T029: Implement CLI Interface
**Purpose**: Command-line utility for running spec aggregation
**File**: `scripts/combine-specs.js`
**Features**:
- Accept specs directory path as argument
- Support debug and verbose modes
- Handle command-line options (--help, --version, --output)
- Provide clear error messages and progress indication
**Integration**: Use SpecAggregator from T021

### T037: Performance Optimization
**Purpose**: Ensure processing meets <5 second target for 50+ specs
**Method**: Profile memory usage and execution time
**Optimizations**:
- Stream processing for large files
- Template compilation caching
- Incremental parsing for watch mode
- Memory cleanup between processing phases
**Target**: <5s processing, <100MB memory usage

## Critical Success Criteria

### Functional Requirements
1. ✅ All 6 specification files successfully discovered and parsed
2. ✅ Cross-references between features properly resolved
3. ✅ Table of contents generated with correct hierarchy
4. ✅ Requirements matrix includes all functional requirements
5. ✅ Generated document is well-formatted and navigable

### Technical Requirements
1. ✅ All contract tests pass without modification
2. ✅ Performance targets met (<5s processing, <100MB memory)
3. ✅ Error handling gracefully manages malformed inputs
4. ✅ CLI interface provides clear user feedback and options
5. ✅ Template system allows easy customization of output format

### Quality Requirements
1. ✅ No broken internal references in generated document
2. ✅ Source traceability maintained for all content
3. ✅ Consistent formatting throughout consolidated output
4. ✅ Clear separation between different feature specifications
5. ✅ Comprehensive test coverage for all components

## Validation Checklist
*GATE: Checked before task completion*

- [x] All contracts have corresponding tests (T005-T008)
- [x] All entities have implementation tasks (T013-T019)
- [x] All core processing components covered (T020-T024)
- [x] Parallel tasks truly independent (marked with [P])
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD order enforced (tests before implementation)
- [x] Dependencies clearly documented
- [x] Performance requirements addressed (T037)

## Expected Outputs

### Generated Files Structure
```
src/spec-aggregator/
├── types/index.ts              # TypeScript interfaces
├── models/                     # Entity implementations
│   ├── SpecificationCollection.ts
│   ├── FeatureIndex.ts
│   ├── RequirementMatrix.ts
│   ├── ConsolidatedDocument.ts
│   ├── NavigationStructure.ts
│   └── DependencyMap.ts
├── parsers/SpecParser.ts       # Markdown parsing
├── resolvers/CrossReferenceResolver.ts
├── generators/DocumentGenerator.ts
├── templates/                  # Handlebars templates
│   ├── main.hbs
│   └── partials/
│       ├── toc.hbs
│       ├── feature.hbs
│       └── requirements.hbs
└── SpecAggregator.ts          # Main orchestrator

scripts/combine-specs.js        # CLI interface
docs/combined-specs.md          # Generated output
docs/spec-aggregator.md         # Tool documentation
```

### Key Features Delivered
- **Automated Discovery**: Scans specs/ directory for all .md files
- **Intelligent Parsing**: Extracts structured data from markdown specifications
- **Cross-Reference Resolution**: Converts feature references to clickable links
- **Template Generation**: Handlebars-based document generation system
- **Error Handling**: Graceful processing of malformed or incomplete specs
- **Performance Optimized**: Handles large specification collections efficiently

**Ready for immediate execution** - Each task includes specific file paths, dependencies, and validation criteria for systematic implementation.