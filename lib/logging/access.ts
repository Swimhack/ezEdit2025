// @ts-nocheck
/**
 * Log access service for secure log viewing with JWT token generation and validation
 * Provides fine-grained access control with IP restrictions, rate limiting, and audit trails
 */

import { LogAccessToken, LogAccessTokenModel, LogAccessPermissions, CreateLogAccessTokenData } from './models/LogAccessToken';
import { ApplicationLog, LogLevel } from './models/ApplicationLog';
import { LogQueryFilter, LogStorageService, getLogStorageService } from './storage';
import { supabase } from '../supabase';

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
}

/**
 * Access request context
 */
export interface AccessContext {
  token: string;
  ipAddress: string;
  userAgent?: string;
  requestId: string;
}

/**
 * Access audit entry
 */
export interface AccessAudit {
  id: string;
  token_id: string;
  ip_address: string;
  user_agent?: string;
  request_id: string;
  action: string;
  filter: LogQueryFilter;
  result_count: number;
  success: boolean;
  error_message?: string;
  timestamp: Date;
  duration_ms: number;
}

/**
 * Rate limit state
 */
interface RateLimitState {
  requests: number[];
  lastReset: number;
}

/**
 * Log access service with secure token-based authentication
 */
export class LogAccessService {
  private rateLimitStore = new Map<string, RateLimitState>();
  private storageService: LogStorageService;

  constructor(
    private defaultRateLimit: RateLimitConfig = {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 1000
    }
  ) {
    this.storageService = getLogStorageService();
    this.startCleanupTimer();
  }

  /**
   * Creates a new access token with specified permissions
   */
  async createAccessToken(data: CreateLogAccessTokenData): Promise<LogAccessToken> {
    try {
      const token = await LogAccessTokenModel.create(data);

      // Store token in database
      const { error } = await supabase
        .from('log_access_tokens')
        .insert({
          token: token.token,
          token_hash: token.token_hash,
          created_by: token.created_by,
          expires_at: token.expires_at.toISOString(),
          permissions: token.permissions,
          name: token.name,
          ip_whitelist: token.ip_whitelist,
          revoked: token.revoked
        });

      if (error) {
        throw new Error(`Failed to store access token: ${error.message}`);
      }

      // Log token creation
      await this.auditTokenAction('CREATE_TOKEN', {
        token_id: token.token_hash,
        created_by: token.created_by,
        name: token.name,
        permissions: token.permissions
      });

      return token;
    } catch (error) {
      throw new Error(`Failed to create access token: ${error}`);
    }
  }

  /**
   * Validates an access token and returns token data
   */
  async validateAccessToken(token: string, ipAddress: string): Promise<LogAccessToken> {
    try {
      // Validate JWT structure
      const payload = LogAccessTokenModel.validateJWT(token);

      // Generate token hash for lookup
      const tokenHash = await this.generateTokenHash(token);

      // Retrieve token from database
      const { data, error } = await supabase
        .from('log_access_tokens')
        .select('*')
        .eq('token_hash', tokenHash)
        .single();

      if (error) {
        throw new Error('Token not found');
      }

      const tokenData: LogAccessToken = {
        ...data,
        created_at: new Date(data.created_at),
        expires_at: new Date(data.expires_at),
        last_used: data.last_used ? new Date(data.last_used) : null
      };

      // Validate token status
      if (!LogAccessTokenModel.isValid(tokenData)) {
        throw new Error('Token is expired or revoked');
      }

      // Validate IP address if restricted
      if (!LogAccessTokenModel.isIPAllowed(tokenData, ipAddress)) {
        throw new Error('IP address not allowed');
      }

      return tokenData;
    } catch (error) {
      throw new Error(`Token validation failed: ${error}`);
    }
  }

  /**
   * Queries logs with access control and rate limiting
   */
  async queryLogs(
    context: AccessContext,
    filter: LogQueryFilter
  ): Promise<{
    logs: ApplicationLog[];
    totalCount: number;
    hasMore: boolean;
    queryTime: number;
  }> {
    const startTime = Date.now();
    const requestId = context.requestId;

    try {
      // Validate token and get permissions
      const tokenData = await this.validateAccessToken(context.token, context.ipAddress);

      // Check rate limits
      await this.checkRateLimit(tokenData, context.ipAddress);

      // Apply permission-based filtering
      const permissionFilter = this.applyPermissionFilter(filter, tokenData.permissions);

      // Execute query
      const result = await this.storageService.query(permissionFilter);

      // Filter sensitive fields if not allowed
      const filteredLogs = this.filterSensitiveFields(result.logs, tokenData.permissions);

      // Update token usage
      await this.updateTokenUsage(tokenData);

      // Audit successful access
      await this.auditAccess(tokenData, context, filter, filteredLogs.length, true, Date.now() - startTime);

      return {
        logs: filteredLogs,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        queryTime: result.queryTime
      };
    } catch (error) {
      // Audit failed access
      const tokenHash = await this.generateTokenHash(context.token).catch(() => 'invalid');
      await this.auditAccess(
        { token_hash: tokenHash } as LogAccessToken,
        context,
        filter,
        0,
        false,
        Date.now() - startTime,
        String(error)
      );

      throw error;
    }
  }

  /**
   * Revokes an access token
   */
  async revokeAccessToken(tokenHash: string, revokedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('log_access_tokens')
        .update({ revoked: true })
        .eq('token_hash', tokenHash);

      if (error) {
        throw new Error(`Failed to revoke token: ${error.message}`);
      }

      // Log token revocation
      await this.auditTokenAction('REVOKE_TOKEN', {
        token_id: tokenHash,
        revoked_by: revokedBy
      });

      return true;
    } catch (error) {
      console.error('Failed to revoke access token:', error as Error);
      return false;
    }
  }

  /**
   * Lists access tokens for a user
   */
  async listAccessTokens(userId: string): Promise<Omit<LogAccessToken, 'token'>[]> {
    try {
      const { data, error } = await supabase
        .from('log_access_tokens')
        .select('token_hash, created_by, created_at, expires_at, permissions, name, last_used, use_count, ip_whitelist, revoked')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list tokens: ${error.message}`);
      }

      return (data || []).map(row => ({
        ...row,
        token: '[REDACTED]', // Never return the actual token
        created_at: new Date(row.created_at),
        expires_at: new Date(row.expires_at),
        last_used: row.last_used ? new Date(row.last_used) : null
      }));
    } catch (error) {
      throw new Error(`Failed to list access tokens: ${error}`);
    }
  }

  /**
   * Gets access audit logs
   */
  async getAccessAudits(options: {
    tokenId?: string;
    userId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<AccessAudit[]> {
    try {
      let query = supabase
        .from('log_access_audits')
        .select('*')
        .order('timestamp', { ascending: false });

      if (options.tokenId) {
        query = query.eq('token_id', options.tokenId);
      }

      if (options.startTime) {
        query = query.gte('timestamp', options.startTime.toISOString());
      }

      if (options.endTime) {
        query = query.lte('timestamp', options.endTime.toISOString());
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get audit logs: ${error.message}`);
      }

      return (data || []).map(row => ({
        ...row,
        timestamp: new Date(row.timestamp),
        filter: row.filter ? JSON.parse(row.filter) : {}
      }));
    } catch (error) {
      throw new Error(`Failed to get access audits: ${error}`);
    }
  }

  /**
   * Gets access statistics for monitoring
   */
  async getAccessStats(timeRange: { start: Date; end: Date }): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    uniqueTokens: number;
    avgResponseTime: number;
    topSources: Array<{ source: string; count: number }>;
    rateLimitHits: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('log_access_audits')
        .select('*')
        .gte('timestamp', timeRange.start.toISOString())
        .lte('timestamp', timeRange.end.toISOString());

      if (error) {
        throw new Error(`Failed to get access stats: ${error.message}`);
      }

      const audits = data || [];
      const totalRequests = audits.length;
      const successfulRequests = audits.filter(a => a.success).length;
      const failedRequests = totalRequests - successfulRequests;
      const uniqueTokens = new Set(audits.map(a => a.token_id)).size;
      const avgResponseTime = audits.length > 0 ?
        audits.reduce((sum, a) => sum + a.duration_ms, 0) / audits.length : 0;

      // Calculate top sources (simplified)
      const sourceCount = new Map<string, number>();
      audits.forEach(audit => {
        if (audit.filter) {
          const filter = JSON.parse(audit.filter);
          (filter.sources || []).forEach((source: string) => {
            sourceCount.set(source, (sourceCount.get(source) || 0) + 1);
          });
        }
      });

      const topSources = Array.from(sourceCount.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const rateLimitHits = audits.filter(a =>
        a.error_message?.includes('rate limit') || a.error_message?.includes('too many requests')
      ).length;

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        uniqueTokens,
        avgResponseTime,
        topSources,
        rateLimitHits
      };
    } catch (error) {
      throw new Error(`Failed to get access stats: ${error}`);
    }
  }

  /**
   * Applies permission-based filtering to log query
   */
  private applyPermissionFilter(
    filter: LogQueryFilter,
    permissions: LogAccessPermissions
  ): LogQueryFilter {
    const permissionFilter: LogQueryFilter = { ...filter };

    // Apply source restrictions
    if (permissions.sources.length > 0) {
      const allowedSources = permissions.sources;
      if (filter.sources) {
        permissionFilter.sources = filter.sources.filter(source => allowedSources.includes(source));
      } else {
        permissionFilter.sources = allowedSources;
      }
    }

    // Apply level restrictions
    if (filter.levels) {
      permissionFilter.levels = filter.levels.filter(level =>
        LogAccessTokenModel.isLevelAllowed(permissions, level)
      );
    } else {
      // Generate allowed levels based on min/max
      const allLevels = Object.values(LogLevel);
      permissionFilter.levels = allLevels.filter(level =>
        LogAccessTokenModel.isLevelAllowed(permissions, level)
      );
    }

    // Apply entry limit
    const maxEntries = permissions.max_entries_per_request;
    if (!filter.limit || filter.limit > maxEntries) {
      permissionFilter.limit = maxEntries;
    }

    return permissionFilter;
  }

  /**
   * Filters sensitive fields from logs based on permissions
   */
  private filterSensitiveFields(
    logs: ApplicationLog[],
    permissions: LogAccessPermissions
  ): ApplicationLog[] {
    return logs.map(log => {
      const filteredLog: ApplicationLog = { ...log };

      // Remove context if not allowed
      if (!permissions.include_context) {
        filteredLog.context = undefined;
      }

      // Remove sensitive fields if not allowed
      if (!permissions.include_sensitive) {
        filteredLog.user_id = undefined;
        filteredLog.ip_address = undefined;
        filteredLog.session_id = undefined;
      }

      return filteredLog;
    });
  }

  /**
   * Checks rate limits for a token
   */
  private async checkRateLimit(tokenData: LogAccessToken, ipAddress: string): Promise<void> {
    const key = `${tokenData.token_hash}:${ipAddress}`;
    const limit = tokenData.permissions.rate_limit_per_hour;
    const windowMs = 60 * 60 * 1000; // 1 hour

    const now = Date.now();
    let state = this.rateLimitStore.get(key);

    if (!state || now - state.lastReset > windowMs) {
      state = {
        requests: [],
        lastReset: now
      };
      this.rateLimitStore.set(key, state);
    }

    // Remove old requests
    state.requests = state.requests.filter(timestamp => now - timestamp < windowMs);

    // Check if limit exceeded
    if (state.requests.length >= limit) {
      throw new Error(`Rate limit exceeded: ${limit} requests per hour`);
    }

    // Add current request
    state.requests.push(now);
  }

  /**
   * Updates token usage statistics
   */
  private async updateTokenUsage(tokenData: LogAccessToken): Promise<void> {
    try {
      const updates = LogAccessTokenModel.updateUsage(tokenData);

      await supabase
        .from('log_access_tokens')
        .update({
          last_used: updates.last_used?.toISOString(),
          use_count: updates.use_count
        })
        .eq('token_hash', tokenData.token_hash);
    } catch (error) {
      console.error('Failed to update token usage:', error as Error);
    }
  }

  /**
   * Audits log access attempts
   */
  private async auditAccess(
    tokenData: LogAccessToken,
    context: AccessContext,
    filter: LogQueryFilter,
    resultCount: number,
    success: boolean,
    duration: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const audit: Omit<AccessAudit, 'id'> = {
        token_id: tokenData.token_hash,
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
        request_id: context.requestId,
        action: 'QUERY_LOGS',
        filter,
        result_count: resultCount,
        success,
        error_message: errorMessage,
        timestamp: new Date(),
        duration_ms: duration
      };

      await supabase
        .from('log_access_audits')
        .insert({
          ...audit,
          filter: JSON.stringify(audit.filter)
        });
    } catch (error) {
      console.error('Failed to audit access:', error as Error);
    }
  }

  /**
   * Audits token management actions
   */
  private async auditTokenAction(action: string, metadata: any): Promise<void> {
    try {
      await supabase
        .from('log_access_audits')
        .insert({
          token_id: metadata.token_id,
          ip_address: '127.0.0.1', // System action
          request_id: crypto.randomUUID(),
          action,
          filter: JSON.stringify(metadata),
          result_count: 0,
          success: true,
          timestamp: new Date().toISOString(),
          duration_ms: 0
        });
    } catch (error) {
      console.error('Failed to audit token action:', error as Error);
    }
  }

  /**
   * Generates token hash for database lookup
   */
  private async generateTokenHash(token: string): Promise<string> {
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
   * Starts cleanup timer for rate limit store
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      const windowMs = 60 * 60 * 1000; // 1 hour

      for (const [key, state] of this.rateLimitStore.entries()) {
        if (now - state.lastReset > windowMs * 2) {
          this.rateLimitStore.delete(key);
        }
      }
    }, 10 * 60 * 1000); // Cleanup every 10 minutes
  }
}

/**
 * Global access service instance
 */
let globalAccessService: LogAccessService | null = null;

/**
 * Gets or creates the global access service instance
 */
export function getLogAccessService(): LogAccessService {
  if (!globalAccessService) {
    globalAccessService = new LogAccessService();
  }
  return globalAccessService;
}

/**
 * Sets a new global access service instance
 */
export function setLogAccessService(service: LogAccessService): void {
  globalAccessService = service;
}

export default LogAccessService;