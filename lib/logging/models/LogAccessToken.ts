/**
 * LogAccessToken model for managing secure access to application logs
 * Supports JWT-based authentication with scoped permissions and IP restrictions
 */

import { z } from 'zod';
import { LogLevel } from './ApplicationLog';

/**
 * LogAccessToken interface representing the complete token structure
 */
export interface LogAccessToken {
  /** JWT token string (primary key) */
  token: string;
  /** SHA256 hash of the token for secure lookup */
  token_hash: string;
  /** User ID who created the token */
  created_by: string;
  /** Token creation timestamp */
  created_at: Date;
  /** Token expiration timestamp */
  expires_at: Date;
  /** Access permissions defining allowed sources and levels */
  permissions: LogAccessPermissions;
  /** Descriptive name for the token */
  name: string;
  /** Last time the token was used */
  last_used?: Date | null;
  /** Number of times the token has been used */
  use_count: number;
  /** Whitelist of allowed IP addresses */
  ip_whitelist?: string[] | null;
  /** Whether the token has been revoked */
  revoked: boolean;
}

/**
 * Permissions structure for log access control
 */
export interface LogAccessPermissions {
  /** Allowed log sources (empty array = all sources) */
  sources: string[];
  /** Minimum log level that can be accessed */
  min_level: LogLevel;
  /** Maximum log level that can be accessed */
  max_level: LogLevel;
  /** Whether context data can be accessed */
  include_context: boolean;
  /** Whether sensitive fields (user_id, ip_address) can be accessed */
  include_sensitive: boolean;
  /** Maximum number of log entries per request */
  max_entries_per_request: number;
  /** Rate limit: requests per hour */
  rate_limit_per_hour: number;
}

/**
 * LogAccessToken creation data interface
 */
export interface CreateLogAccessTokenData {
  created_by: string;
  name: string;
  permissions: LogAccessPermissions;
  expires_in_hours?: number;
  ip_whitelist?: string[] | null;
}

/**
 * Default permissions for different access levels
 */
export const DefaultPermissions: Record<string, LogAccessPermissions> = {
  readonly: {
    sources: [],
    min_level: LogLevel.INFO,
    max_level: LogLevel.CRITICAL,
    include_context: false,
    include_sensitive: false,
    max_entries_per_request: 100,
    rate_limit_per_hour: 1000
  },
  developer: {
    sources: [],
    min_level: LogLevel.DEBUG,
    max_level: LogLevel.CRITICAL,
    include_context: true,
    include_sensitive: false,
    max_entries_per_request: 1000,
    rate_limit_per_hour: 5000
  },
  admin: {
    sources: [],
    min_level: LogLevel.DEBUG,
    max_level: LogLevel.CRITICAL,
    include_context: true,
    include_sensitive: true,
    max_entries_per_request: 10000,
    rate_limit_per_hour: 10000
  }
};

/**
 * Validation schema for LogAccessToken permissions
 */
export const LogAccessPermissionsSchema = z.object({
  sources: z.array(z.string()),
  min_level: z.nativeEnum(LogLevel),
  max_level: z.nativeEnum(LogLevel),
  include_context: z.boolean(),
  include_sensitive: z.boolean(),
  max_entries_per_request: z.number().int().min(1).max(10000),
  rate_limit_per_hour: z.number().int().min(1).max(100000)
});

/**
 * Validation schema for LogAccessToken creation
 */
export const CreateLogAccessTokenSchema = z.object({
  created_by: z.string().uuid(),
  name: z.string().min(1).max(255),
  permissions: LogAccessPermissionsSchema,
  expires_in_hours: z.number().int().min(1).max(8760).optional().default(24), // Max 1 year
  ip_whitelist: z.array(z.string().ip()).nullable().optional()
});

/**
 * LogAccessToken model class with validation and helper methods
 */
export class LogAccessTokenModel {
  /**
   * Validates token creation data
   */
  static validate(data: unknown): CreateLogAccessTokenData {
    return CreateLogAccessTokenSchema.parse(data);
  }

  /**
   * Creates a new LogAccessToken instance with generated JWT and hash
   */
  static async create(data: CreateLogAccessTokenData): Promise<LogAccessToken> {
    const validated = this.validate(data);

    // Validate permission levels
    if (this.getLevelPriority(validated.permissions.min_level) >
        this.getLevelPriority(validated.permissions.max_level)) {
      throw new Error('min_level cannot be higher than max_level');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (validated.expires_in_hours || 24) * 60 * 60 * 1000);

    // Generate JWT token (simplified - in real implementation use proper JWT library)
    const tokenPayload = {
      sub: validated.created_by,
      name: validated.name,
      permissions: validated.permissions,
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(expiresAt.getTime() / 1000)
    };

    const token = this.generateJWT(tokenPayload);
    const tokenHash = await this.generateHash(token);

    return {
      token,
      token_hash: tokenHash,
      created_by: validated.created_by,
      created_at: now,
      expires_at: expiresAt,
      permissions: validated.permissions,
      name: validated.name,
      last_used: null,
      use_count: 0,
      ip_whitelist: validated.ip_whitelist,
      revoked: false
    };
  }

  /**
   * Validates a JWT token and returns its payload
   */
  static validateJWT(token: string): any {
    try {
      // Simplified JWT validation - in real implementation use proper JWT library
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(atob(parts[1]));

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Checks if a token is valid and not expired/revoked
   */
  static isValid(tokenData: LogAccessToken): boolean {
    return (
      !tokenData.revoked &&
      tokenData.expires_at > new Date()
    );
  }

  /**
   * Checks if an IP address is allowed for the token
   */
  static isIPAllowed(tokenData: LogAccessToken, ipAddress: string): boolean {
    if (!tokenData.ip_whitelist || tokenData.ip_whitelist.length === 0) {
      return true; // No restrictions
    }
    return tokenData.ip_whitelist.includes(ipAddress);
  }

  /**
   * Checks if a log source is allowed by the token permissions
   */
  static isSourceAllowed(permissions: LogAccessPermissions, source: string): boolean {
    if (permissions.sources.length === 0) {
      return true; // No restrictions
    }
    return permissions.sources.includes(source);
  }

  /**
   * Checks if a log level is allowed by the token permissions
   */
  static isLevelAllowed(permissions: LogAccessPermissions, level: LogLevel): boolean {
    const levelPriority = this.getLevelPriority(level);
    const minPriority = this.getLevelPriority(permissions.min_level);
    const maxPriority = this.getLevelPriority(permissions.max_level);

    return levelPriority >= minPriority && levelPriority <= maxPriority;
  }

  /**
   * Updates token usage statistics
   */
  static updateUsage(tokenData: LogAccessToken): Partial<LogAccessToken> {
    return {
      last_used: new Date(),
      use_count: tokenData.use_count + 1
    };
  }

  /**
   * Revokes a token
   */
  static revoke(tokenData: LogAccessToken): Partial<LogAccessToken> {
    return {
      revoked: true
    };
  }

  /**
   * Gets permission level name for display
   */
  static getPermissionLevel(permissions: LogAccessPermissions): string {
    if (permissions.include_sensitive && permissions.include_context) {
      return 'admin';
    } else if (permissions.include_context) {
      return 'developer';
    } else {
      return 'readonly';
    }
  }

  /**
   * Creates permissions from a preset level
   */
  static createPermissions(level: keyof typeof DefaultPermissions, overrides?: Partial<LogAccessPermissions>): LogAccessPermissions {
    const base = DefaultPermissions[level];
    if (!base) {
      throw new Error(`Invalid permission level: ${level}`);
    }
    return { ...base, ...overrides };
  }

  /**
   * Gets the numeric priority for a log level
   */
  private static getLevelPriority(level: LogLevel): number {
    const priorities = {
      [LogLevel.DEBUG]: 1,
      [LogLevel.INFO]: 2,
      [LogLevel.WARN]: 3,
      [LogLevel.ERROR]: 4,
      [LogLevel.CRITICAL]: 5
    };
    return priorities[level];
  }

  /**
   * Generates a simple JWT token (use proper JWT library in production)
   */
  private static generateJWT(payload: any): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa(`signature_${Date.now()}`); // Simplified

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Generates SHA256 hash of the token
   */
  private static async generateHash(token: string): Promise<string> {
    // Simplified hash - in real implementation use crypto.subtle.digest
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Formats token info for display (without revealing the token)
   */
  static format(tokenData: LogAccessToken): string {
    const status = tokenData.revoked ? 'REVOKED' :
                  tokenData.expires_at < new Date() ? 'EXPIRED' : 'ACTIVE';
    const level = this.getPermissionLevel(tokenData.permissions);
    const lastUsed = tokenData.last_used ? tokenData.last_used.toISOString() : 'Never';

    return `${tokenData.name} | ${status} | ${level} | Uses: ${tokenData.use_count} | Last: ${lastUsed}`;
  }
}

/**
 * Type guard to check if an object is a valid LogAccessToken
 */
export function isLogAccessToken(obj: any): obj is LogAccessToken {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.token === 'string' &&
    typeof obj.token_hash === 'string' &&
    typeof obj.created_by === 'string' &&
    obj.created_at instanceof Date &&
    obj.expires_at instanceof Date &&
    typeof obj.permissions === 'object' &&
    typeof obj.name === 'string' &&
    typeof obj.use_count === 'number' &&
    typeof obj.revoked === 'boolean'
  );
}

export default LogAccessTokenModel;