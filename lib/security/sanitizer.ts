/**
 * Data sanitizer service for PII redaction and content validation
 * Provides comprehensive data sanitization, PII detection, and security validation
 */

import { getLogger } from '../logging/logger';

/**
 * Sanitization level enum
 */
export enum SanitizationLevel {
  NONE = 'none',
  BASIC = 'basic',
  MODERATE = 'moderate',
  STRICT = 'strict',
  PARANOID = 'paranoid'
}

/**
 * PII types that can be detected and redacted
 */
export enum PIIType {
  SSN = 'ssn',
  CREDIT_CARD = 'credit_card',
  EMAIL = 'email',
  PHONE = 'phone',
  IP_ADDRESS = 'ip_address',
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license',
  BANK_ACCOUNT = 'bank_account',
  IBAN = 'iban',
  TAX_ID = 'tax_id',
  MEDICAL_ID = 'medical_id',
  CUSTOM = 'custom'
}

/**
 * Content validation rules
 */
export enum ValidationRule {
  NO_SCRIPT_TAGS = 'no_script_tags',
  NO_HTML_TAGS = 'no_html_tags',
  NO_SQL_INJECTION = 'no_sql_injection',
  NO_XSS_ATTEMPTS = 'no_xss_attempts',
  NO_FILE_PATHS = 'no_file_paths',
  NO_URLS = 'no_urls',
  NO_BASE64 = 'no_base64',
  LENGTH_LIMIT = 'length_limit',
  CHARSET_RESTRICTION = 'charset_restriction'
}

/**
 * Sanitization configuration
 */
export interface SanitizationConfig {
  level: SanitizationLevel;
  piiDetection: {
    enabled: boolean;
    types: PIIType[];
    redactionChar: string;
    preserveFormat: boolean;
    confidenceThreshold: number;
  };
  validation: {
    enabled: boolean;
    rules: ValidationRule[];
    strictMode: boolean;
    maxLength: number;
    allowedCharsets: string[];
  };
  logging: {
    logDetections: boolean;
    logValidationFailures: boolean;
    includeContext: boolean;
  };
  customPatterns: Array<{
    name: string;
    pattern: RegExp;
    replacement: string;
    description: string;
  }>;
}

/**
 * Sanitization result
 */
export interface SanitizationResult {
  sanitized: string;
  originalLength: number;
  sanitizedLength: number;
  piiDetected: Array<{
    type: PIIType;
    count: number;
    positions: Array<{ start: number; end: number }>;
    confidence: number;
  }>;
  validationWarnings: Array<{
    rule: ValidationRule;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  validationErrors: Array<{
    rule: ValidationRule;
    message: string;
    severity: 'critical';
  }>;
  modified: boolean;
  safe: boolean;
}

/**
 * Batch sanitization result
 */
export interface BatchSanitizationResult {
  results: SanitizationResult[];
  totalProcessed: number;
  totalModified: number;
  totalUnsafe: number;
  processingTime: number;
  summary: {
    piiTypesFound: Record<PIIType, number>;
    validationRulesTriggered: Record<ValidationRule, number>;
  };
}

/**
 * Default sanitization configuration
 */
const DefaultConfig: SanitizationConfig = {
  level: SanitizationLevel.MODERATE,
  piiDetection: {
    enabled: true,
    types: [
      PIIType.SSN,
      PIIType.CREDIT_CARD,
      PIIType.EMAIL,
      PIIType.PHONE,
      PIIType.IP_ADDRESS
    ],
    redactionChar: '*',
    preserveFormat: true,
    confidenceThreshold: 0.8
  },
  validation: {
    enabled: true,
    rules: [
      ValidationRule.NO_SCRIPT_TAGS,
      ValidationRule.NO_SQL_INJECTION,
      ValidationRule.NO_XSS_ATTEMPTS,
      ValidationRule.LENGTH_LIMIT
    ],
    strictMode: false,
    maxLength: 10000,
    allowedCharsets: ['utf-8', 'ascii']
  },
  logging: {
    logDetections: true,
    logValidationFailures: true,
    includeContext: false
  },
  customPatterns: []
};

/**
 * PII detection patterns with confidence scoring
 */
const PIIPatterns: Record<PIIType, { pattern: RegExp; confidence: number; description: string }> = {
  [PIIType.SSN]: {
    pattern: /\b(?:\d{3}[-.\s]?\d{2}[-.\s]?\d{4}|\d{9})\b/g,
    confidence: 0.9,
    description: 'Social Security Number'
  },
  [PIIType.CREDIT_CARD]: {
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    confidence: 0.95,
    description: 'Credit Card Number'
  },
  [PIIType.EMAIL]: {
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    confidence: 0.9,
    description: 'Email Address'
  },
  [PIIType.PHONE]: {
    pattern: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    confidence: 0.8,
    description: 'Phone Number'
  },
  [PIIType.IP_ADDRESS]: {
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    confidence: 0.85,
    description: 'IP Address'
  },
  [PIIType.PASSPORT]: {
    pattern: /\b[A-Z]{1,2}[0-9]{6,9}\b/g,
    confidence: 0.7,
    description: 'Passport Number'
  },
  [PIIType.DRIVER_LICENSE]: {
    pattern: /\b[A-Z]{1,2}[0-9]{6,8}\b/g,
    confidence: 0.6,
    description: 'Driver License Number'
  },
  [PIIType.BANK_ACCOUNT]: {
    pattern: /\b[0-9]{8,17}\b/g,
    confidence: 0.5,
    description: 'Bank Account Number'
  },
  [PIIType.IBAN]: {
    pattern: /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}\b/g,
    confidence: 0.9,
    description: 'IBAN'
  },
  [PIIType.TAX_ID]: {
    pattern: /\b[0-9]{2}-[0-9]{7}\b/g,
    confidence: 0.8,
    description: 'Tax ID Number'
  },
  [PIIType.MEDICAL_ID]: {
    pattern: /\b[A-Z]{2,3}[0-9]{6,10}\b/g,
    confidence: 0.6,
    description: 'Medical ID Number'
  },
  [PIIType.CUSTOM]: {
    pattern: /(?:)/g, // Empty pattern for custom patterns
    confidence: 0.5,
    description: 'Custom Pattern'
  }
};

/**
 * Validation patterns for security checks
 */
const ValidationPatterns: Record<ValidationRule, { pattern: RegExp; severity: 'low' | 'medium' | 'high' | 'critical'; description: string }> = {
  [ValidationRule.NO_SCRIPT_TAGS]: {
    pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    severity: 'critical',
    description: 'Script tags detected'
  },
  [ValidationRule.NO_HTML_TAGS]: {
    pattern: /<[^>]*>/g,
    severity: 'medium',
    description: 'HTML tags detected'
  },
  [ValidationRule.NO_SQL_INJECTION]: {
    pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|(')|(\-\-)|(\;)/gi,
    severity: 'critical',
    description: 'Potential SQL injection attempt'
  },
  [ValidationRule.NO_XSS_ATTEMPTS]: {
    pattern: /(javascript:|data:|vbscript:|onload=|onerror=|onclick=)/gi,
    severity: 'critical',
    description: 'Potential XSS attempt'
  },
  [ValidationRule.NO_FILE_PATHS]: {
    pattern: /([a-zA-Z]:\\|\/[a-zA-Z]|\.\.\/|\.\.\\)/g,
    severity: 'high',
    description: 'File paths detected'
  },
  [ValidationRule.NO_URLS]: {
    pattern: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
    severity: 'low',
    description: 'URLs detected'
  },
  [ValidationRule.NO_BASE64]: {
    pattern: /^[A-Za-z0-9+/]*={0,2}$/,
    severity: 'medium',
    description: 'Base64 encoded content detected'
  },
  [ValidationRule.LENGTH_LIMIT]: {
    pattern: /(?:)/g, // Special handling in validation
    severity: 'low',
    description: 'Content exceeds length limit'
  },
  [ValidationRule.CHARSET_RESTRICTION]: {
    pattern: /(?:)/g, // Special handling in validation
    severity: 'medium',
    description: 'Invalid characters detected'
  }
};

/**
 * Data sanitizer service
 */
export class DataSanitizer {
  private config: SanitizationConfig;
  private logger = getLogger();

  constructor(config: Partial<SanitizationConfig> = {}) {
    this.config = { ...DefaultConfig, ...config };
  }

  /**
   * Sanitizes a single string
   */
  sanitize(input: string, context?: string): SanitizationResult {
    const startTime = Date.now();

    try {
      let sanitized = input;
      const piiDetected: SanitizationResult['piiDetected'] = [];
      const validationWarnings: SanitizationResult['validationWarnings'] = [];
      const validationErrors: SanitizationResult['validationErrors'] = [];

      // Perform PII detection and redaction
      if (this.config.piiDetection.enabled) {
        const piiResult = this.detectAndRedactPII(sanitized);
        sanitized = piiResult.sanitized;
        piiDetected.push(...piiResult.detected);
      }

      // Perform content validation
      if (this.config.validation.enabled) {
        const validationResult = this.validateContent(sanitized);
        validationWarnings.push(...validationResult.warnings);
        validationErrors.push(...validationResult.errors);

        // Apply sanitization fixes for non-critical issues
        if (!this.config.validation.strictMode) {
          sanitized = this.applySanitizationFixes(sanitized, validationWarnings);
        }
      }

      const result: SanitizationResult = {
        sanitized,
        originalLength: input.length,
        sanitizedLength: sanitized.length,
        piiDetected,
        validationWarnings,
        validationErrors,
        modified: input !== sanitized,
        safe: validationErrors.length === 0
      };

      // Log results if enabled
      if (this.config.logging.logDetections && piiDetected.length > 0) {
        this.logger.warn('PII detected in content', {
          context,
          piiTypes: piiDetected.map(p => p.type),
          totalDetections: piiDetected.reduce((sum, p) => sum + p.count, 0),
          includeContent: this.config.logging.includeContext
        });
      }

      if (this.config.logging.logValidationFailures && (validationWarnings.length > 0 || validationErrors.length > 0)) {
        this.logger.warn('Content validation issues detected', {
          context,
          warnings: validationWarnings.length,
          errors: validationErrors.length,
          rules: [...validationWarnings, ...validationErrors].map(v => v.rule)
        });
      }

      this.logger.debug('Content sanitization completed', {
        context,
        processingTime: Date.now() - startTime,
        modified: result.modified,
        safe: result.safe
      });

      return result;
    } catch (error) {
      this.logger.error('Email send failed', error as Error, { context });

      return {
        sanitized: '', // Return empty string on error for safety
        originalLength: input.length,
        sanitizedLength: 0,
        piiDetected: [],
        validationWarnings: [],
        validationErrors: [{
          rule: ValidationRule.NO_SCRIPT_TAGS, // Generic error
          message: `Sanitization failed: ${error}`,
          severity: 'critical'
        }],
        modified: true,
        safe: false
      };
    }
  }

  /**
   * Sanitizes multiple strings in batch
   */
  sanitizeBatch(inputs: Array<{ data: string; context?: string }>): BatchSanitizationResult {
    const startTime = Date.now();
    const results: SanitizationResult[] = [];
    const piiTypesFound: Record<PIIType, number> = {} as any;
    const validationRulesTriggered: Record<ValidationRule, number> = {} as any;

    // Initialize counters
    Object.values(PIIType).forEach(type => { piiTypesFound[type] = 0; });
    Object.values(ValidationRule).forEach(rule => { validationRulesTriggered[rule] = 0; });

    for (const input of inputs) {
      const result = this.sanitize(input.data, input.context);
      results.push(result);

      // Aggregate statistics
      result.piiDetected.forEach(pii => {
        piiTypesFound[pii.type] += pii.count;
      });

      [...result.validationWarnings, ...result.validationErrors].forEach(validation => {
        validationRulesTriggered[validation.rule]++;
      });
    }

    const totalModified = results.filter(r => r.modified).length;
    const totalUnsafe = results.filter(r => !r.safe).length;

    this.logger.info('Batch sanitization completed', {
      totalProcessed: inputs.length,
      totalModified,
      totalUnsafe,
      processingTime: Date.now() - startTime
    });

    return {
      results,
      totalProcessed: inputs.length,
      totalModified,
      totalUnsafe,
      processingTime: Date.now() - startTime,
      summary: {
        piiTypesFound,
        validationRulesTriggered
      }
    };
  }

  /**
   * Sanitizes object properties recursively
   */
  sanitizeObject<T extends Record<string, any>>(
    obj: T,
    options: {
      includeKeys?: string[];
      excludeKeys?: string[];
      maxDepth?: number;
    } = {}
  ): { sanitized: T; results: Record<string, SanitizationResult> } {
    const { includeKeys, excludeKeys = [], maxDepth = 10 } = options;
    const results: Record<string, SanitizationResult> = {};

    const sanitizeRecursive = (value: any, path: string, depth: number): any => {
      if (depth > maxDepth) {
        return value;
      }

      if (typeof value === 'string') {
        // Check if this key should be sanitized
        if (includeKeys && !includeKeys.includes(path)) {
          return value;
        }
        if (excludeKeys.includes(path)) {
          return value;
        }

        const result = this.sanitize(value, path);
        results[path] = result;
        return result.sanitized;
      }

      if (Array.isArray(value)) {
        return value.map((item, index) =>
          sanitizeRecursive(item, `${path}[${index}]`, depth + 1)
        );
      }

      if (value && typeof value === 'object') {
        const sanitizedObj: any = {};
        Object.keys(value).forEach(key => {
          const newPath = path ? `${path}.${key}` : key;
          sanitizedObj[key] = sanitizeRecursive(value[key], newPath, depth + 1);
        });
        return sanitizedObj;
      }

      return value;
    };

    const sanitized = sanitizeRecursive(obj, '', 0);

    this.logger.debug('Object sanitization completed', {
      keysProcessed: Object.keys(results).length,
      keysModified: Object.values(results).filter(r => r.modified).length
    });

    return { sanitized, results };
  }

  /**
   * Validates content without modification
   */
  validate(input: string, context?: string): {
    safe: boolean;
    warnings: SanitizationResult['validationWarnings'];
    errors: SanitizationResult['validationErrors'];
  } {
    if (!this.config.validation.enabled) {
      return { safe: true, warnings: [], errors: [] };
    }

    const validationResult = this.validateContent(input);

    return {
      safe: validationResult.errors.length === 0,
      warnings: validationResult.warnings,
      errors: validationResult.errors
    };
  }

  /**
   * Detects PII without redaction
   */
  detectPII(input: string): Array<{
    type: PIIType;
    matches: Array<{ text: string; start: number; end: number }>;
    confidence: number;
  }> {
    if (!this.config.piiDetection.enabled) {
      return [];
    }

    const detections: any[] = [];

    this.config.piiDetection.types.forEach(type => {
      const pattern = PIIPatterns[type];
      if (!pattern) return;

      const matches: any[] = [];
      let match;

      // Reset pattern lastIndex
      pattern.pattern.lastIndex = 0;

      while ((match = pattern.pattern.exec(input)) !== null) {
        matches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length
        });

        // Prevent infinite loop with global patterns
        if (!pattern.pattern.global) break;
      }

      if (matches.length > 0) {
        detections.push({
          type,
          matches,
          confidence: pattern.confidence
        });
      }
    });

    // Add custom patterns
    this.config.customPatterns.forEach(customPattern => {
      const matches: any[] = [];
      let match;

      customPattern.pattern.lastIndex = 0;

      while ((match = customPattern.pattern.exec(input)) !== null) {
        matches.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length
        });

        if (!customPattern.pattern.global) break;
      }

      if (matches.length > 0) {
        detections.push({
          type: PIIType.CUSTOM,
          matches,
          confidence: 0.8 // Default confidence for custom patterns
        });
      }
    });

    return detections;
  }

  /**
   * Detects and redacts PII from input
   */
  private detectAndRedactPII(input: string): {
    sanitized: string;
    detected: SanitizationResult['piiDetected'];
  } {
    let sanitized = input;
    const detected: SanitizationResult['piiDetected'] = [];

    this.config.piiDetection.types.forEach(type => {
      const pattern = PIIPatterns[type];
      if (!pattern || pattern.confidence < this.config.piiDetection.confidenceThreshold) {
        return;
      }

      const matches: any[] = [];
      let match;

      // Reset pattern lastIndex
      pattern.pattern.lastIndex = 0;

      while ((match = pattern.pattern.exec(sanitized)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length
        });

        // Prevent infinite loop
        if (!pattern.pattern.global) break;
      }

      if (matches.length > 0) {
        detected.push({
          type,
          count: matches.length,
          positions: matches,
          confidence: pattern.confidence
        });

        // Perform redaction
        sanitized = this.redactPII(sanitized, type, pattern.pattern);
      }
    });

    // Process custom patterns
    this.config.customPatterns.forEach(customPattern => {
      const matches: any[] = [];
      let match;

      customPattern.pattern.lastIndex = 0;

      while ((match = customPattern.pattern.exec(sanitized)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length
        });

        if (!customPattern.pattern.global) break;
      }

      if (matches.length > 0) {
        detected.push({
          type: PIIType.CUSTOM,
          count: matches.length,
          positions: matches,
          confidence: 0.8
        });

        sanitized = sanitized.replace(customPattern.pattern, customPattern.replacement);
      }
    });

    return { sanitized, detected };
  }

  /**
   * Redacts PII based on type and format preservation
   */
  private redactPII(input: string, type: PIIType, pattern: RegExp): string {
    if (!this.config.piiDetection.preserveFormat) {
      return input.replace(pattern, this.config.piiDetection.redactionChar.repeat(8));
    }

    return input.replace(pattern, (match) => {
      switch (type) {
        case PIIType.SSN:
          return `XXX-XX-${match.slice(-4)}`;
        case PIIType.CREDIT_CARD:
          return `${this.config.piiDetection.redactionChar.repeat(match.length - 4)}${match.slice(-4)}`;
        case PIIType.EMAIL:
          const [local, domain] = match.split('@');
          return `${local.slice(0, 2)}${this.config.piiDetection.redactionChar.repeat(Math.max(0, local.length - 2))}@${domain}`;
        case PIIType.PHONE:
          return match.replace(/\d/g, this.config.piiDetection.redactionChar);
        default:
          return this.config.piiDetection.redactionChar.repeat(match.length);
      }
    });
  }

  /**
   * Validates content against security rules
   */
  private validateContent(input: string): {
    warnings: SanitizationResult['validationWarnings'];
    errors: SanitizationResult['validationErrors'];
  } {
    const warnings: SanitizationResult['validationWarnings'] = [];
    const errors: SanitizationResult['validationErrors'] = [];

    this.config.validation.rules.forEach(rule => {
      const validationPattern = ValidationPatterns[rule];
      if (!validationPattern) return;

      let hasViolation = false;

      switch (rule) {
        case ValidationRule.LENGTH_LIMIT:
          hasViolation = input.length > this.config.validation.maxLength;
          break;
        case ValidationRule.CHARSET_RESTRICTION:
          // Check for characters outside allowed charsets
          hasViolation = /[^\x00-\x7F]/.test(input) && !this.config.validation.allowedCharsets.includes('utf-8');
          break;
        default:
          hasViolation = validationPattern.pattern.test(input);
      }

      if (hasViolation) {
        const violation = {
          rule,
          message: validationPattern.description,
          severity: validationPattern.severity
        };

        if (validationPattern.severity === 'critical') {
          errors.push(violation as any);
        } else {
          warnings.push(violation);
        }
      }
    });

    return { warnings, errors };
  }

  /**
   * Applies sanitization fixes for non-critical issues
   */
  private applySanitizationFixes(input: string, warnings: SanitizationResult['validationWarnings']): string {
    let sanitized = input;

    warnings.forEach(warning => {
      const pattern = ValidationPatterns[warning.rule];
      if (pattern && warning.severity !== 'critical') {
        switch (warning.rule) {
          case ValidationRule.NO_HTML_TAGS:
            sanitized = sanitized.replace(pattern.pattern, '');
            break;
          case ValidationRule.NO_URLS:
            sanitized = sanitized.replace(pattern.pattern, '[URL REMOVED]');
            break;
          case ValidationRule.NO_FILE_PATHS:
            sanitized = sanitized.replace(pattern.pattern, '[PATH REMOVED]');
            break;
          case ValidationRule.LENGTH_LIMIT:
            if (sanitized.length > this.config.validation.maxLength) {
              sanitized = sanitized.substring(0, this.config.validation.maxLength) + '...';
            }
            break;
        }
      }
    });

    return sanitized;
  }

  /**
   * Updates sanitizer configuration
   */
  updateConfig(newConfig: Partial<SanitizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Sanitizer configuration updated', {
      level: this.config.level,
      piiDetectionEnabled: this.config.piiDetection.enabled,
      validationEnabled: this.config.validation.enabled
    });
  }

  /**
   * Gets current configuration
   */
  getConfig(): SanitizationConfig {
    return { ...this.config };
  }

  /**
   * Adds custom PII pattern
   */
  addCustomPattern(pattern: {
    name: string;
    pattern: RegExp;
    replacement: string;
    description: string;
  }): void {
    this.config.customPatterns.push(pattern);
    this.logger.info('Custom PII pattern added', {
      name: pattern.name,
      description: pattern.description
    });
  }

  /**
   * Removes custom PII pattern
   */
  removeCustomPattern(name: string): boolean {
    const index = this.config.customPatterns.findIndex(p => p.name === name);
    if (index >= 0) {
      this.config.customPatterns.splice(index, 1);
      this.logger.info('Custom PII pattern removed', { name });
      return true;
    }
    return false;
  }

  /**
   * Gets sanitization statistics
   */
  getStatistics(): {
    configLevel: SanitizationLevel;
    piiTypesEnabled: number;
    validationRulesEnabled: number;
    customPatternsCount: number;
  } {
    return {
      configLevel: this.config.level,
      piiTypesEnabled: this.config.piiDetection.types.length,
      validationRulesEnabled: this.config.validation.rules.length,
      customPatternsCount: this.config.customPatterns.length
    };
  }
}

/**
 * Creates sanitizer with predefined security level
 */
export function createSanitizer(level: SanitizationLevel): DataSanitizer {
  const configs: Record<SanitizationLevel, Partial<SanitizationConfig>> = {
    [SanitizationLevel.NONE]: {
      piiDetection: {
        enabled: false,
        types: [],
        redactionChar: '*',
        preserveFormat: false,
        confidenceThreshold: 0.9
      },
      validation: {
        enabled: false,
        rules: [],
        strictMode: false,
        maxLength: 1000000,
        allowedCharsets: []
      }
    },
    [SanitizationLevel.BASIC]: {
      level,
      piiDetection: {
        enabled: true,
        types: [PIIType.SSN, PIIType.CREDIT_CARD],
        redactionChar: '*',
        preserveFormat: true,
        confidenceThreshold: 0.9
      },
      validation: {
        enabled: true,
        rules: [ValidationRule.NO_SCRIPT_TAGS, ValidationRule.NO_SQL_INJECTION],
        strictMode: false,
        maxLength: 100000,
        allowedCharsets: ['utf8']
      }
    },
    [SanitizationLevel.MODERATE]: {
      level,
      piiDetection: {
        enabled: true,
        types: [PIIType.SSN, PIIType.CREDIT_CARD, PIIType.EMAIL, PIIType.PHONE],
        redactionChar: '*',
        preserveFormat: true,
        confidenceThreshold: 0.8
      },
      validation: {
        enabled: true,
        rules: [
          ValidationRule.NO_SCRIPT_TAGS,
          ValidationRule.NO_SQL_INJECTION,
          ValidationRule.NO_XSS_ATTEMPTS,
          ValidationRule.LENGTH_LIMIT
        ],
        strictMode: false,
        maxLength: 50000,
        allowedCharsets: ['utf8', 'ascii']
      }
    },
    [SanitizationLevel.STRICT]: {
      level,
      piiDetection: {
        enabled: true,
        types: Object.values(PIIType).filter(t => t !== PIIType.CUSTOM),
        redactionChar: '*',
        preserveFormat: true,
        confidenceThreshold: 0.7
      },
      validation: {
        enabled: true,
        rules: Object.values(ValidationRule),
        strictMode: true,
        maxLength: 10000,
        allowedCharsets: ['ascii']
      }
    },
    [SanitizationLevel.PARANOID]: {
      level,
      piiDetection: {
        enabled: true,
        types: Object.values(PIIType).filter(t => t !== PIIType.CUSTOM),
        redactionChar: 'X',
        confidenceThreshold: 0.5,
        preserveFormat: false
      },
      validation: {
        enabled: true,
        rules: Object.values(ValidationRule),
        strictMode: true,
        maxLength: 1000,
        allowedCharsets: ['ascii']
      }
    }
  };

  return new DataSanitizer(configs[level]);
}

/**
 * Global sanitizer instance
 */
let globalSanitizer: DataSanitizer | null = null;

/**
 * Gets or creates the global sanitizer instance
 */
export function getDataSanitizer(): DataSanitizer {
  if (!globalSanitizer) {
    globalSanitizer = new DataSanitizer();
  }
  return globalSanitizer;
}

/**
 * Sets a new global sanitizer instance
 */
export function setDataSanitizer(sanitizer: DataSanitizer): void {
  globalSanitizer = sanitizer;
}

export default DataSanitizer;