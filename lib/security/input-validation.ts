/**
 * Input Validation and Sanitization Library
 *
 * Provides comprehensive input validation and sanitization utilities
 * to protect against XSS, SQL injection, and other security threats.
 *
 * Best Practices Implementation:
 * - HTML encoding for XSS prevention
 * - SQL injection pattern detection
 * - Path traversal protection
 * - File upload validation
 * - Rate limiting helpers
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML sanitization options for different contexts
 */
const SANITIZE_OPTIONS = {
  // Strict: Remove all HTML tags and attributes
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },

  // Basic: Allow only safe text formatting
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  },

  // Rich: Allow safe HTML for rich text content
  rich: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'title'],
    KEEP_CONTENT: true
  }
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param input - The input string to sanitize
 * @param level - Sanitization strictness level
 * @returns Sanitized string
 */
export function sanitizeHtml(input: string, level: 'strict' | 'basic' | 'rich' = 'strict'): string {
  if (typeof input !== 'string') {
    return '';
  }

  try {
    return DOMPurify.sanitize(input, SANITIZE_OPTIONS[level]);
  } catch (error) {
    console.error('HTML sanitization error:', error);
    // Fallback: encode all HTML entities
    return encodeHtmlEntities(input);
  }
}

/**
 * Encodes HTML entities to prevent XSS
 * @param input - The input string to encode
 * @returns HTML-encoded string
 */
export function encodeHtmlEntities(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates email format using robust regex
 * @param email - Email address to validate
 * @returns Boolean indicating if email is valid
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string' || email.length > 254) {
    return false;
  }

  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email);
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object with validation result and requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    noCommonPasswords: boolean;
  };
  feedback: string[];
} {
  const feedback: string[] = [];
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommonPasswords: !isCommonPassword(password)
  };

  // Calculate score based on requirements met
  const score = Object.values(requirements).filter(Boolean).length;

  // Generate feedback
  if (!requirements.minLength) {
    feedback.push('Password must be at least 8 characters long');
  }
  if (!requirements.hasUppercase) {
    feedback.push('Password must contain at least one uppercase letter');
  }
  if (!requirements.hasLowercase) {
    feedback.push('Password must contain at least one lowercase letter');
  }
  if (!requirements.hasNumbers) {
    feedback.push('Password must contain at least one number');
  }
  if (!requirements.hasSpecialChars) {
    feedback.push('Password must contain at least one special character');
  }
  if (!requirements.noCommonPasswords) {
    feedback.push('Password is too common, please choose a stronger password');
  }

  return {
    isValid: score >= 5,
    score,
    requirements,
    feedback
  };
}

/**
 * Checks if password is in common passwords list
 * @param password - Password to check
 * @returns Boolean indicating if password is common
 */
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'dragon', 'master', 'shadow', 'superman'
  ];

  return commonPasswords.includes(password.toLowerCase());
}

/**
 * Validates and sanitizes file paths to prevent path traversal
 * @param filePath - File path to validate
 * @returns Sanitized path or null if invalid
 */
export function validateFilePath(filePath: string): string | null {
  if (typeof filePath !== 'string') {
    return null;
  }

  // Remove dangerous path traversal patterns
  const dangerous = /(\.\.[\/\\]|[\/\\]\.\.|^\.\.)/;
  if (dangerous.test(filePath)) {
    return null;
  }

  // Remove null bytes and other dangerous characters
  const sanitized = filePath
    .replace(/\0/g, '')
    .replace(/[\r\n]/g, '')
    .trim();

  // Ensure path doesn't start with system paths
  const systemPaths = ['/etc/', '/proc/', '/sys/', 'C:\\Windows\\', 'C:\\Program Files\\'];
  const lowerPath = sanitized.toLowerCase();

  if (systemPaths.some(sysPath => lowerPath.startsWith(sysPath.toLowerCase()))) {
    return null;
  }

  return sanitized;
}

/**
 * Validates file upload parameters
 * @param file - File object or file info
 * @param maxSize - Maximum file size in bytes
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFileUpload(
  file: { name: string; size: number; type?: string },
  maxSize: number = 10 * 1024 * 1024, // 10MB default
  allowedTypes: string[] = ['text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json']
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds maximum limit of ${Math.round(maxSize / 1024 / 1024)}MB`);
  }

  // Validate file type
  if (file.type && !allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }

  // Validate file name
  if (!file.name || file.name.length > 255) {
    errors.push('Invalid file name');
  }

  // Check for dangerous file extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

  if (dangerousExtensions.includes(extension)) {
    errors.push(`File extension ${extension} is not allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Detects and prevents SQL injection patterns
 * @param input - Input string to check
 * @returns Boolean indicating if input contains SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UPDATE|UNION)\b)/i,
    /(\b(AND|OR)\b\s*\d+\s*=\s*\d+)/i,
    /(--|#|\/\*|\*\/)/,
    /(\b(SLEEP|BENCHMARK|WAITFOR)\b\s*\()/i,
    /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/i,
    /([\s;]*DROP\s+TABLE)/i,
    /([\s;]*TRUNCATE\s+TABLE)/i
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validates hostname/URL for security
 * @param hostname - Hostname or URL to validate
 * @returns Boolean indicating if hostname is valid and safe
 */
export function validateHostname(hostname: string): boolean {
  if (typeof hostname !== 'string' || hostname.length > 253) {
    return false;
  }

  // Remove protocol if present
  const cleanHostname = hostname.replace(/^https?:\/\//, '');

  // Basic hostname validation
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!hostnameRegex.test(cleanHostname)) {
    return false;
  }

  // Prevent access to local/private networks
  const forbiddenHosts = [
    'localhost',
    '127.0.0.1',
    '::1',
    '0.0.0.0'
  ];

  if (forbiddenHosts.includes(cleanHostname)) {
    return false;
  }

  // Check for private IP ranges
  const privateIpPattern = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/;
  if (privateIpPattern.test(cleanHostname)) {
    return false;
  }

  return true;
}

/**
 * Rate limiting helper - simple in-memory implementation
 * For production, use Redis or similar persistent storage
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Checks if request should be rate limited
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param windowMs - Time window in milliseconds
   * @param maxRequests - Maximum requests per window
   * @returns Boolean indicating if request should be blocked
   */
  isRateLimited(identifier: string, windowMs: number, maxRequests: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];

    // Remove requests outside the current window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (validRequests.length >= maxRequests) {
      return true;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return false;
  }

  /**
   * Clears rate limiting data for an identifier
   * @param identifier - Identifier to clear
   */
  clear(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Gets remaining requests for an identifier
   * @param identifier - Unique identifier
   * @param windowMs - Time window in milliseconds
   * @param maxRequests - Maximum requests per window
   * @returns Number of remaining requests
   */
  getRemainingRequests(identifier: string, windowMs: number, maxRequests: number): number {
    const now = Date.now();
    const windowStart = now - windowMs;

    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    return Math.max(0, maxRequests - validRequests.length);
  }
}

// Export singleton rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Comprehensive input validation function
 * @param input - Input object to validate
 * @param rules - Validation rules
 * @returns Validation result with sanitized data
 */
export function validateInput(
  input: Record<string, any>,
  rules: Record<string, {
    required?: boolean;
    type?: 'string' | 'number' | 'email' | 'password' | 'hostname' | 'filepath';
    maxLength?: number;
    minLength?: number;
    sanitize?: boolean;
    custom?: (value: any) => boolean | string;
  }>
): {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitized: Record<string, any>;
} {
  const errors: Record<string, string[]> = {};
  const sanitized: Record<string, any> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = input[field];
    const fieldErrors: string[] = [];

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    switch (rule.type) {
      case 'email':
        if (!validateEmail(value)) {
          fieldErrors.push(`${field} must be a valid email address`);
        } else {
          sanitized[field] = rule.sanitize ? sanitizeHtml(value, 'strict') : value;
        }
        break;

      case 'password':
        const passwordValidation = validatePassword(value);
        if (!passwordValidation.isValid) {
          fieldErrors.push(...passwordValidation.feedback);
        } else {
          sanitized[field] = value; // Don't sanitize passwords
        }
        break;

      case 'hostname':
        if (!validateHostname(value)) {
          fieldErrors.push(`${field} must be a valid hostname`);
        } else {
          sanitized[field] = rule.sanitize ? sanitizeHtml(value, 'strict') : value;
        }
        break;

      case 'filepath':
        const validPath = validateFilePath(value);
        if (!validPath) {
          fieldErrors.push(`${field} contains invalid path`);
        } else {
          sanitized[field] = validPath;
        }
        break;

      case 'string':
      default:
        // Length validation
        if (rule.maxLength && value.length > rule.maxLength) {
          fieldErrors.push(`${field} must be no more than ${rule.maxLength} characters`);
        }
        if (rule.minLength && value.length < rule.minLength) {
          fieldErrors.push(`${field} must be at least ${rule.minLength} characters`);
        }

        // SQL injection detection
        if (detectSqlInjection(value)) {
          fieldErrors.push(`${field} contains invalid characters`);
        } else {
          sanitized[field] = rule.sanitize ? sanitizeHtml(value, 'strict') : value;
        }
        break;
    }

    // Custom validation
    if (rule.custom && fieldErrors.length === 0) {
      const customResult = rule.custom(value);
      if (typeof customResult === 'string') {
        fieldErrors.push(customResult);
      } else if (!customResult) {
        fieldErrors.push(`${field} is invalid`);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized
  };
}