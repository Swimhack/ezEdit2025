// @ts-nocheck
/**
 * Log storage service with hot/warm/cold tiers, automatic rotation, and efficient querying
 * Supports multi-tier storage architecture with automatic data movement based on age and access patterns
 */

import { ApplicationLog, LogLevel, ApplicationLogModel } from './models/ApplicationLog';
import { supabase } from '../supabase';

/**
 * Storage tier configuration
 */
export enum StorageTier {
  HOT = 'hot',      // Recent logs, high performance access (0-7 days)
  WARM = 'warm',    // Older logs, medium performance (7-90 days)
  COLD = 'cold'     // Archive logs, low performance (90+ days)
}

/**
 * Storage tier metadata
 */
export interface StorageTierConfig {
  tier: StorageTier;
  retentionDays: number;
  maxSize: number;
  compressionEnabled: boolean;
  indexingEnabled: boolean;
}

/**
 * Default storage tier configurations
 */
export const DefaultStorageTiers: Record<StorageTier, StorageTierConfig> = {
  [StorageTier.HOT]: {
    tier: StorageTier.HOT,
    retentionDays: 7,
    maxSize: 1024 * 1024 * 1024, // 1GB
    compressionEnabled: false,
    indexingEnabled: true
  },
  [StorageTier.WARM]: {
    tier: StorageTier.WARM,
    retentionDays: 90,
    maxSize: 5 * 1024 * 1024 * 1024, // 5GB
    compressionEnabled: true,
    indexingEnabled: true
  },
  [StorageTier.COLD]: {
    tier: StorageTier.COLD,
    retentionDays: 365,
    maxSize: 50 * 1024 * 1024 * 1024, // 50GB
    compressionEnabled: true,
    indexingEnabled: false
  }
};

/**
 * Log query filter interface
 */
export interface LogQueryFilter {
  startTime?: Date;
  endTime?: Date;
  levels?: LogLevel[];
  sources?: string[];
  userIds?: string[];
  sessionIds?: string[];
  requestIds?: string[];
  tags?: string[];
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * Log query result interface
 */
export interface LogQueryResult {
  logs: ApplicationLog[];
  totalCount: number;
  hasMore: boolean;
  queryTime: number;
  tierStats: Record<StorageTier, { count: number; queryTime: number }>;
}

/**
 * Storage statistics interface
 */
export interface StorageStats {
  totalLogs: number;
  totalSize: number;
  tierBreakdown: Record<StorageTier, {
    count: number;
    size: number;
    oldestLog: Date | null;
    newestLog: Date | null;
  }>;
  compressionRatio: number;
  avgQueryTime: number;
}

/**
 * Batch write result interface
 */
export interface BatchWriteResult {
  success: boolean;
  written: number;
  failed: number;
  errors: string[];
  duration: number;
}

/**
 * Log storage service with tiered storage and automatic rotation
 */
export class LogStorageService {
  private writeBuffer: ApplicationLog[] = [];
  private writeTimer: NodeJS.Timeout | null = null;
  private isWriting = false;

  constructor(
    private batchSize: number = 1000,
    private flushInterval: number = 5000,
    private enableAutoRotation: boolean = true
  ) {
    this.startWriteTimer();

    if (this.enableAutoRotation) {
      this.startRotationTimer();
    }
  }

  /**
   * Stores a single log entry
   */
  async store(log: ApplicationLog): Promise<void> {
    this.writeBuffer.push(log);

    // Flush immediately for critical logs
    if (log.level === LogLevel.CRITICAL) {
      await this.flush();
    } else if (this.writeBuffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * Stores multiple log entries in batch
   */
  async storeBatch(logs: ApplicationLog[]): Promise<BatchWriteResult> {
    const startTime = Date.now();
    let written = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      // Determine target tier for each log
      const logsByTier = this.groupLogsByTier(logs);

      for (const [tier, tierLogs] of Object.entries(logsByTier)) {
        if (tierLogs.length === 0) continue;

        try {
          await this.writeToTier(tierLogs as ApplicationLog[], tier as StorageTier);
          written += tierLogs.length;
        } catch (error) {
          failed += tierLogs.length;
          errors.push(`Failed to write ${tierLogs.length} logs to ${tier}: ${error}`);
        }
      }

      return {
        success: failed === 0,
        written,
        failed,
        errors,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        written,
        failed: logs.length - written,
        errors: [String(error)],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Queries logs with advanced filtering and cross-tier search
   */
  async query(filter: LogQueryFilter): Promise<LogQueryResult> {
    const startTime = Date.now();
    const tierStats: Record<StorageTier, { count: number; queryTime: number }> = {
      [StorageTier.HOT]: { count: 0, queryTime: 0 },
      [StorageTier.WARM]: { count: 0, queryTime: 0 },
      [StorageTier.COLD]: { count: 0, queryTime: 0 }
    };

    const allLogs: ApplicationLog[] = [];
    let totalCount = 0;

    // Determine which tiers to query based on time range
    const tiersToQuery = this.determineTiersToQuery(filter);

    for (const tier of tiersToQuery) {
      const tierStartTime = Date.now();
      try {
        const tierResult = await this.queryTier(tier, filter);
        allLogs.push(...tierResult.logs);
        totalCount += tierResult.totalCount;

        tierStats[tier] = {
          count: tierResult.logs.length,
          queryTime: Date.now() - tierStartTime
        };
      } catch (error) {
        console.error(`Failed to query ${tier} tier:`, error as Error);
      }
    }

    // Sort by timestamp if querying multiple tiers
    if (tiersToQuery.length > 1) {
      allLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    // Apply limit and offset
    const limit = filter.limit || 100;
    const offset = filter.offset || 0;
    const paginatedLogs = allLogs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      totalCount,
      hasMore: totalCount > offset + limit,
      queryTime: Date.now() - startTime,
      tierStats
    };
  }

  /**
   * Gets storage statistics across all tiers
   */
  async getStorageStats(): Promise<StorageStats> {
    const tierBreakdown: StorageStats['tierBreakdown'] = {
      [StorageTier.HOT]: { count: 0, size: 0, oldestLog: null, newestLog: null },
      [StorageTier.WARM]: { count: 0, size: 0, oldestLog: null, newestLog: null },
      [StorageTier.COLD]: { count: 0, size: 0, oldestLog: null, newestLog: null }
    };

    let totalLogs = 0;
    let totalSize = 0;

    for (const tier of Object.values(StorageTier)) {
      try {
        const stats = await this.getTierStats(tier);
        tierBreakdown[tier] = stats;
        totalLogs += stats.count;
        totalSize += stats.size;
      } catch (error) {
        console.error(`Failed to get stats for ${tier} tier:`, error as Error);
      }
    }

    return {
      totalLogs,
      totalSize,
      tierBreakdown,
      compressionRatio: this.calculateCompressionRatio(tierBreakdown),
      avgQueryTime: 0 // Would be calculated from query history
    };
  }

  /**
   * Performs automatic log rotation and tier movement
   */
  async performRotation(): Promise<{
    moved: Record<string, number>;
    deleted: number;
    errors: string[];
  }> {
    const moved: Record<string, number> = {};
    let deleted = 0;
    const errors: string[] = [];

    try {
      // Move logs from hot to warm tier
      const hotToWarm = await this.moveLogs(StorageTier.HOT, StorageTier.WARM, 7);
      moved['hot-to-warm'] = hotToWarm;

      // Move logs from warm to cold tier
      const warmToCold = await this.moveLogs(StorageTier.WARM, StorageTier.COLD, 90);
      moved['warm-to-cold'] = warmToCold;

      // Delete old logs from cold tier
      deleted = await this.deleteOldLogs(StorageTier.COLD, 365);

    } catch (error) {
      errors.push(`Rotation failed: ${error}`);
    }

    return { moved, deleted, errors };
  }

  /**
   * Compacts logs in a specific tier to improve performance
   */
  async compactTier(tier: StorageTier): Promise<{
    success: boolean;
    originalSize: number;
    compactedSize: number;
    compressionRatio: number;
  }> {
    try {
      const originalStats = await this.getTierStats(tier);

      // Perform compaction (simplified - in real implementation would use specialized tools)
      await this.performTierCompaction(tier);

      const compactedStats = await this.getTierStats(tier);

      return {
        success: true,
        originalSize: originalStats.size,
        compactedSize: compactedStats.size,
        compressionRatio: compactedStats.size / originalStats.size
      };
    } catch (error) {
      return {
        success: false,
        originalSize: 0,
        compactedSize: 0,
        compressionRatio: 1
      };
    }
  }

  /**
   * Flushes buffered logs to storage
   */
  private async flush(): Promise<void> {
    if (this.isWriting || this.writeBuffer.length === 0) {
      return;
    }

    this.isWriting = true;
    const logsToWrite = this.writeBuffer.splice(0);

    try {
      await this.storeBatch(logsToWrite);
    } catch (error) {
      console.error('Failed to flush logs to storage:', error as Error);
      // Re-queue failed logs
      this.writeBuffer.unshift(...logsToWrite);
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Groups logs by target storage tier
   */
  private groupLogsByTier(logs: ApplicationLog[]): Record<StorageTier, ApplicationLog[]> {
    const result: Record<StorageTier, ApplicationLog[]> = {
      [StorageTier.HOT]: [],
      [StorageTier.WARM]: [],
      [StorageTier.COLD]: []
    };

    const now = new Date();

    logs.forEach(log => {
      const ageInDays = (now.getTime() - log.timestamp.getTime()) / (1000 * 60 * 60 * 24);

      if (ageInDays <= 7) {
        result[StorageTier.HOT].push(log);
      } else if (ageInDays <= 90) {
        result[StorageTier.WARM].push(log);
      } else {
        result[StorageTier.COLD].push(log);
      }
    });

    return result;
  }

  /**
   * Writes logs to a specific storage tier
   */
  private async writeToTier(logs: ApplicationLog[], tier: StorageTier): Promise<void> {
    const tableName = `application_logs_${tier}`;

    try {
      const payload = logs.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        level: log.level,
        source: log.source,
        message: log.message,
        user_id: log.user_id,
        session_id: log.session_id,
        request_id: log.request_id,
        ip_address: log.ip_address,
        user_agent: log.user_agent,
        duration_ms: log.duration_ms,
        error_stack: log.error_stack,
        context: log.context ? JSON.stringify(log.context) : null,
        tags: log.tags
      }))
      const { error } = await supabase
        .from(tableName)
        .insert(payload)

      if (error) {
        throw new Error(`Failed to write to ${tier} tier: ${error.message}`);
      }
    } catch (error) {
      throw new Error(`Database error writing to ${tier} tier: ${error}`);
    }
  }

  /**
   * Queries a specific storage tier
   */
  private async queryTier(tier: StorageTier, filter: LogQueryFilter): Promise<{
    logs: ApplicationLog[];
    totalCount: number;
  }> {
    const tableName = `application_logs_${tier}`;
    let query = supabase.from(tableName).select('*', { count: 'exact' } as any);

    // Apply filters
    if (filter.startTime) {
      query = query.gte('timestamp', filter.startTime.toISOString());
    }
    if (filter.endTime) {
      query = query.lte('timestamp', filter.endTime.toISOString());
    }
    if (filter.levels && filter.levels.length > 0) {
      query = (query as any).in('level', filter.levels);
    }
    if (filter.sources && filter.sources.length > 0) {
      query = (query as any).in('source', filter.sources);
    }
    if (filter.userIds && filter.userIds.length > 0) {
      query = (query as any).in('user_id', filter.userIds);
    }
    if (filter.sessionIds && filter.sessionIds.length > 0) {
      query = (query as any).in('session_id', filter.sessionIds);
    }
    if (filter.requestIds && filter.requestIds.length > 0) {
      query = (query as any).in('request_id', filter.requestIds);
    }
    if (filter.searchTerm) {
      query = query.or(`message.ilike.%${filter.searchTerm}%,error_stack.ilike.%${filter.searchTerm}%`);
    }

    // Apply pagination
    if (filter.offset) {
      query = query.range(filter.offset, (filter.offset + (filter.limit || 100)) - 1);
    } else if (filter.limit) {
      query = query.limit(filter.limit);
    }

    // Order by timestamp descending
    query = query.order('timestamp', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to query ${tier} tier: ${error.message}`);
    }

    const logs = (data || []).map(row => ({
      ...row,
      timestamp: new Date(row.timestamp),
      context: row.context ? JSON.parse(row.context) : null
    }));

    return {
      logs,
      totalCount: count || 0
    };
  }

  /**
   * Determines which tiers to query based on time range
   */
  private determineTiersToQuery(filter: LogQueryFilter): StorageTier[] {
    const now = new Date();
    const tiers: StorageTier[] = [];

    // If no time filter, query all tiers
    if (!filter.startTime && !filter.endTime) {
      return [StorageTier.HOT, StorageTier.WARM, StorageTier.COLD];
    }

    const startTime = filter.startTime || new Date(0);
    const endTime = filter.endTime || now;

    const startAgeInDays = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);
    const endAgeInDays = (now.getTime() - endTime.getTime()) / (1000 * 60 * 60 * 24);

    // Check if we need to query hot tier (0-7 days)
    if (endAgeInDays <= 7) {
      tiers.push(StorageTier.HOT);
    }

    // Check if we need to query warm tier (7-90 days)
    if (startAgeInDays >= 7 && endAgeInDays <= 90) {
      tiers.push(StorageTier.WARM);
    }

    // Check if we need to query cold tier (90+ days)
    if (startAgeInDays >= 90) {
      tiers.push(StorageTier.COLD);
    }

    return tiers.length > 0 ? tiers : [StorageTier.HOT];
  }

  /**
   * Gets statistics for a specific tier
   */
  private async getTierStats(tier: StorageTier): Promise<{
    count: number;
    size: number;
    oldestLog: Date | null;
    newestLog: Date | null;
  }> {
    const tableName = `application_logs_${tier}`;

    try {
      // Get count
      const { count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      // Get oldest and newest log timestamps
      const { data: oldest } = await supabase
        .from(tableName)
        .select('timestamp')
        .order('timestamp', { ascending: true })
        .limit(1);

      const { data: newest } = await supabase
        .from(tableName)
        .select('timestamp')
        .order('timestamp', { ascending: false })
        .limit(1);

      return {
        count: count || 0,
        size: (count || 0) * 1024, // Simplified size calculation
        oldestLog: oldest?.[0] ? new Date(oldest[0].timestamp) : null,
        newestLog: newest?.[0] ? new Date(newest[0].timestamp) : null
      };
    } catch (error) {
      console.error(`Failed to get stats for ${tier} tier:`, error as Error);
      return { count: 0, size: 0, oldestLog: null, newestLog: null };
    }
  }

  /**
   * Moves logs between tiers based on age
   */
  private async moveLogs(fromTier: StorageTier, toTier: StorageTier, maxAgeInDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - (maxAgeInDays * 24 * 60 * 60 * 1000));

    try {
      // Get logs to move
      const { data: logsToMove } = await supabase
        .from(`application_logs_${fromTier}`)
        .select('*')
        .lt('timestamp', cutoffDate.toISOString());

      if (!logsToMove || logsToMove.length === 0) {
        return 0;
      }

      // Insert into target tier
      const { error: insertError } = await supabase
        .from(`application_logs_${toTier}`)
        .insert(logsToMove);

      if (insertError) {
        throw new Error(`Failed to insert into ${toTier}: ${insertError.message}`);
      }

      // Delete from source tier
      const { error: deleteError } = await supabase
        .from(`application_logs_${fromTier}`)
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (deleteError) {
        throw new Error(`Failed to delete from ${fromTier}: ${deleteError.message}`);
      }

      return logsToMove.length;
    } catch (error) {
      console.error(`Failed to move logs from ${fromTier} to ${toTier}:`, error as Error);
      return 0;
    }
  }

  /**
   * Deletes old logs from a tier
   */
  private async deleteOldLogs(tier: StorageTier, maxAgeInDays: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - (maxAgeInDays * 24 * 60 * 60 * 1000));

    try {
      const { data, error } = await supabase
        .from(`application_logs_${tier}`)
        .delete()
        .lt('timestamp', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw new Error(`Failed to delete old logs: ${error.message}`);
      }

      return data?.length || 0;
    } catch (error) {
      console.error(`Failed to delete old logs from ${tier}:`, error as Error);
      return 0;
    }
  }

  /**
   * Performs tier compaction (simplified implementation)
   */
  private async performTierCompaction(tier: StorageTier): Promise<void> {
    // In a real implementation, this would use database-specific compaction tools
    console.log(`Performing compaction for ${tier} tier`);
  }

  /**
   * Calculates compression ratio across tiers
   */
  private calculateCompressionRatio(tierBreakdown: StorageStats['tierBreakdown']): number {
    const totalUncompressed = Object.values(tierBreakdown).reduce((sum, tier) => sum + tier.size, 0);
    const compressedTiers = [StorageTier.WARM, StorageTier.COLD];
    const totalCompressed = compressedTiers.reduce((sum, tier) => sum + tierBreakdown[tier].size, 0);

    return totalUncompressed > 0 ? totalCompressed / totalUncompressed : 1;
  }

  /**
   * Starts the automatic write timer
   */
  private startWriteTimer(): void {
    this.writeTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Starts the automatic rotation timer
   */
  private startRotationTimer(): void {
    // Run rotation every hour
    setInterval(() => {
      this.performRotation().catch(console.error);
    }, 60 * 60 * 1000);
  }

  /**
   * Gracefully shuts down the storage service
   */
  async close(): Promise<void> {
    if (this.writeTimer) {
      clearInterval(this.writeTimer);
      this.writeTimer = null;
    }

    // Final flush
    await this.flush();
  }
}

/**
 * Global storage service instance
 */
let globalStorageService: LogStorageService | null = null;

/**
 * Gets or creates the global storage service instance
 */
export function getLogStorageService(): LogStorageService {
  if (!globalStorageService) {
    globalStorageService = new LogStorageService();
  }
  return globalStorageService;
}

/**
 * Sets a new global storage service instance
 */
export function setLogStorageService(service: LogStorageService): void {
  if (globalStorageService) {
    globalStorageService.close();
  }
  globalStorageService = service;
}

export default LogStorageService;
// Legacy LogStorage export for API compatibility
export class LogStorage {
  static async getLogsByToken(token: string) {
    console.log('Token-based log access not implemented yet:', token);
    return [];
  }
  static async streamLogs() {
    console.log('Log streaming not implemented yet');
    return new ReadableStream({
      start(controller) {
        controller.enqueue('data: {"type":"ping"}\n\n');
        controller.close();
      }
    });
  }
  static async searchLogs(query: any) {
    console.log('Log search not implemented yet:', query);
    return { logs: [], total: 0 };
  }
}
