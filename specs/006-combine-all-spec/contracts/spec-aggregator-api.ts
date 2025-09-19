/**
 * API Contracts for Specification File Aggregation System
 *
 * This file defines the interfaces and contracts for the spec file combination feature.
 * All implementations must adhere to these contracts for consistency and testability.
 */

// Core entity interfaces from data model
export interface SpecFile {
  path: string
  id: string
  name: string
  content: string
  metadata: SpecMetadata
  sections: SpecSection[]
  parseErrors: ParseError[]
  lastModified: Date
}

export interface SpecMetadata {
  featureBranch: string
  created: Date
  status: FeatureStatus
  priority: Priority
  assignee?: string
  dependencies: string[]
  tags: string[]
}

export interface SpecSection {
  type: SectionType
  title: string
  content: string
  level: number
  requirements?: Requirement[]
}

export interface Requirement {
  id: string
  featureId: string
  description: string
  priority: Priority
  status: RequirementStatus
  dependencies: string[]
  testable: boolean
}

// Enumeration types
export type FeatureStatus = 'draft' | 'review' | 'approved' | 'implemented' | 'deprecated'
export type Priority = 'high' | 'medium' | 'low'
export type RequirementStatus = 'draft' | 'approved' | 'implemented' | 'tested'
export type SectionType = 'user_scenarios' | 'requirements' | 'entities' | 'review' | 'execution'

export interface ParseError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning' | 'info'
}

// Main aggregator interface
export interface SpecAggregator {
  /**
   * Discover and parse all specification files in the given directory
   * @param specsPath - Root directory containing spec files
   * @returns Promise resolving to specification collection
   */
  discoverSpecs(specsPath: string): Promise<SpecificationCollection>

  /**
   * Parse a single specification file
   * @param filePath - Path to spec file
   * @returns Promise resolving to parsed spec file
   */
  parseSpecFile(filePath: string): Promise<SpecFile>

  /**
   * Generate consolidated document from specification collection
   * @param collection - Parsed specification collection
   * @param options - Generation options
   * @returns Promise resolving to consolidated document
   */
  generateConsolidatedDoc(
    collection: SpecificationCollection,
    options: GenerationOptions
  ): Promise<ConsolidatedDocument>

  /**
   * Validate specification collection for consistency and completeness
   * @param collection - Specification collection to validate
   * @returns Validation report
   */
  validateCollection(collection: SpecificationCollection): ValidationReport
}

export interface SpecificationCollection {
  files: SpecFile[]
  totalCount: number
  validCount: number
  errorCount: number
  lastScanned: Date
  scanPath: string
}

export interface ConsolidatedDocument {
  metadata: DocumentMetadata
  tableOfContents: TOCStructure
  sections: DocumentSection[]
  crossReferences: CrossRefIndex
  generationInfo: GenerationMetadata
}

export interface DocumentMetadata {
  title: string
  version: string
  generatedAt: Date
  totalFeatures: number
  totalRequirements: number
  projectName: string
}

export interface TOCStructure {
  entries: TOCEntry[]
  maxDepth: number
  totalEntries: number
}

export interface TOCEntry {
  id: string
  title: string
  level: number
  anchor: string
  children: TOCEntry[]
  pageNumber?: number
}

export interface DocumentSection {
  id: string
  title: string
  level: number
  content: string
  sourceFeature?: string
  subsections: DocumentSection[]
}

export interface CrossRefIndex {
  featureLinks: Map<string, string>
  requirementLinks: Map<string, string>
  internalAnchors: Map<string, string>
  externalReferences: ExternalReference[]
}

export interface ExternalReference {
  text: string
  url: string
  verified: boolean
  lastChecked?: Date
}

export interface GenerationMetadata {
  processingTime: number
  sourceFileCount: number
  outputSize: number
  templateVersion: string
  warnings: string[]
}

// Parser interface for markdown processing
export interface SpecParser {
  /**
   * Parse raw markdown content into structured specification
   * @param content - Raw markdown content
   * @param filePath - Source file path for error reporting
   * @returns Parsed specification file
   */
  parse(content: string, filePath: string): Promise<SpecFile>

  /**
   * Extract frontmatter metadata from spec file
   * @param content - Raw markdown content
   * @returns Parsed metadata or null if none found
   */
  extractMetadata(content: string): SpecMetadata | null

  /**
   * Parse specification sections into structured format
   * @param content - Markdown content without frontmatter
   * @returns Array of parsed sections
   */
  parseSections(content: string): SpecSection[]

  /**
   * Extract functional requirements from requirements section
   * @param section - Requirements section content
   * @returns Array of parsed requirements
   */
  extractRequirements(section: SpecSection): Requirement[]
}

// Cross-reference resolver interface
export interface CrossReferenceResolver {
  /**
   * Analyze collection to find all cross-references
   * @param collection - Specification collection
   * @returns Cross-reference analysis results
   */
  analyzeReferences(collection: SpecificationCollection): CrossReferenceAnalysis

  /**
   * Resolve internal links between specifications
   * @param collection - Specification collection
   * @returns Resolved cross-reference index
   */
  resolveInternalLinks(collection: SpecificationCollection): CrossRefIndex

  /**
   * Validate that all references point to existing content
   * @param crossRefs - Cross-reference index to validate
   * @param collection - Source specification collection
   * @returns Validation results
   */
  validateReferences(
    crossRefs: CrossRefIndex,
    collection: SpecificationCollection
  ): ReferenceValidationReport
}

export interface CrossReferenceAnalysis {
  internalReferences: InternalReference[]
  externalReferences: ExternalReference[]
  brokenReferences: BrokenReference[]
  dependencyGraph: DependencyGraph
}

export interface InternalReference {
  sourceFeature: string
  sourceSection: string
  targetFeature: string
  targetSection?: string
  referenceType: 'feature' | 'requirement' | 'section'
}

export interface BrokenReference {
  sourceFeature: string
  sourceSection: string
  targetText: string
  reason: string
}

export interface DependencyGraph {
  nodes: FeatureNode[]
  edges: DependencyEdge[]
  criticalPath: string[]
  cycles: string[][]
}

export interface FeatureNode {
  id: string
  name: string
  status: FeatureStatus
  dependencies: string[]
}

export interface DependencyEdge {
  from: string
  to: string
  type: 'requires' | 'uses' | 'conflicts' | 'extends'
  strength: 'strong' | 'weak'
}

// Document generator interface
export interface DocumentGenerator {
  /**
   * Generate consolidated markdown document
   * @param collection - Source specification collection
   * @param options - Generation options
   * @returns Generated document
   */
  generateMarkdown(
    collection: SpecificationCollection,
    options: GenerationOptions
  ): Promise<ConsolidatedDocument>

  /**
   * Generate HTML version of consolidated document
   * @param document - Consolidated document
   * @param options - HTML generation options
   * @returns HTML document string
   */
  generateHTML(
    document: ConsolidatedDocument,
    options: HTMLGenerationOptions
  ): Promise<string>

  /**
   * Generate JSON export of specification data
   * @param collection - Source specification collection
   * @returns JSON representation
   */
  generateJSON(collection: SpecificationCollection): Promise<string>
}

export interface GenerationOptions {
  includeTableOfContents: boolean
  includeCrossReferences: boolean
  includeDependencyDiagram: boolean
  includeRequirementMatrix: boolean
  outputFormat: 'markdown' | 'html' | 'json'
  templatePath?: string
  customCSS?: string
}

export interface HTMLGenerationOptions extends GenerationOptions {
  includeCSS: boolean
  includeNavigation: boolean
  responsive: boolean
  printOptimized: boolean
}

// Validation interfaces
export interface ValidationReport {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  statistics: ValidationStatistics
}

export interface ValidationError {
  type: 'missing_section' | 'invalid_format' | 'broken_reference' | 'duplicate_id'
  message: string
  file: string
  line?: number
  severity: 'error' | 'warning'
}

export interface ValidationWarning {
  type: 'deprecated_syntax' | 'missing_optional' | 'style_violation'
  message: string
  file: string
  line?: number
}

export interface ValidationStatistics {
  totalFiles: number
  validFiles: number
  totalRequirements: number
  testableRequirements: number
  crossReferences: number
  brokenReferences: number
}

export interface ReferenceValidationReport {
  validReferences: number
  brokenReferences: BrokenReference[]
  circularDependencies: string[][]
  unreferencedFeatures: string[]
}

// Error types for contract validation
export class SpecAggregatorError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: any
  ) {
    super(message)
    this.name = 'SpecAggregatorError'
  }
}

export class ParseError extends SpecAggregatorError {
  constructor(message: string, public readonly line: number, public readonly column: number) {
    super(message, 'PARSE_ERROR', { line, column })
  }
}

export class ValidationError extends SpecAggregatorError {
  constructor(message: string, public readonly violations: string[]) {
    super(message, 'VALIDATION_ERROR', { violations })
  }
}

export class GenerationError extends SpecAggregatorError {
  constructor(message: string, public readonly phase: string) {
    super(message, 'GENERATION_ERROR', { phase })
  }
}