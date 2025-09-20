export enum QueueStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DEAD_LETTER = 'dead_letter'
}

export interface EmailQueue {
  // Core identification
  id: string;                      // Queue item ID
  notificationId: string;          // Email to be sent

  // Queue management
  priority: number;                // 1 (immediate) to 3 (batch)
  status: QueueStatus;             // pending, processing, completed, failed
  scheduledFor: Date;              // When to process

  // Processing information
  attempts: number;                // Processing attempts
  lastAttemptAt?: Date;            // Last processing attempt
  nextRetryAt?: Date;              // Scheduled retry
  processingStartedAt?: Date;      // When processing began
  processingCompletedAt?: Date;    // When completed

  // Worker information
  workerId?: string;               // Processing worker ID
  lockedAt?: Date;                 // When locked by worker
  lockExpiry?: Date;               // Lock expiration

  // Error handling
  lastError?: string;              // Last error message
  errorCount: number;              // Total errors
  deadLettered: boolean;           // Moved to dead letter queue

  // Metadata
  metadata?: Record<string, any>;  // Additional queue data
  batchId?: string;                // For batch processing

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}

export class EmailQueueModel {
  private static queue: EmailQueue[] = [];
  private static maxRetries = 3;
  private static lockTimeoutMs = 5 * 60 * 1000; // 5 minutes

  static validate(queueItem: Partial<EmailQueue>): string[] {
    const errors: string[] = [];

    // Required fields
    if (!queueItem.notificationId) {
      errors.push('notificationId is required');
    }

    if (!queueItem.priority || ![1, 2, 3].includes(queueItem.priority)) {
      errors.push('priority must be 1, 2, or 3');
    }

    if (queueItem.attempts && queueItem.attempts > this.maxRetries) {
      errors.push(`attempts must not exceed ${this.maxRetries}`);
    }

    if (queueItem.scheduledFor && queueItem.scheduledFor < new Date()) {
      // Allow past dates for immediate processing
    }

    if (queueItem.lockedAt && !queueItem.lockExpiry) {
      errors.push('lockExpiry required when item is locked');
    }

    if (queueItem.deadLettered && queueItem.status !== QueueStatus.DEAD_LETTER) {
      errors.push('deadLettered items must have DEAD_LETTER status');
    }

    return errors;
  }

  static create(data: Partial<EmailQueue>): EmailQueue {
    const now = new Date();

    const queueItem: EmailQueue = {
      id: crypto.randomUUID(),
      notificationId: data.notificationId!,
      priority: data.priority!,
      status: data.status || QueueStatus.PENDING,
      scheduledFor: data.scheduledFor || now,
      attempts: 0,
      errorCount: 0,
      deadLettered: false,
      metadata: data.metadata || {},
      batchId: data.batchId,
      createdAt: now,
      updatedAt: now
    };

    this.queue.push(queueItem);
    return queueItem;
  }

  static getById(id: string): EmailQueue | undefined {
    return this.queue.find(item => item.id === id);
  }

  static getByNotificationId(notificationId: string): EmailQueue | undefined {
    return this.queue.find(item => item.notificationId === notificationId);
  }

  static getPendingItems(limit = 100): EmailQueue[] {
    const now = new Date();

    return this.queue
      .filter(item =>
        item.status === QueueStatus.PENDING &&
        item.scheduledFor <= now &&
        !item.deadLettered
      )
      .sort((a, b) => {
        // Sort by priority (1 = highest), then by creation time
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, limit);
  }

  static acquireLock(id: string, workerId: string): boolean {
    const item = this.getById(id);
    if (!item) return false;

    const now = new Date();

    // Check if already locked by another worker
    if (item.lockedAt && item.lockExpiry && item.lockExpiry > now && item.workerId !== workerId) {
      return false;
    }

    // Acquire lock
    item.lockedAt = now;
    item.lockExpiry = new Date(now.getTime() + this.lockTimeoutMs);
    item.workerId = workerId;
    item.status = QueueStatus.PROCESSING;
    item.processingStartedAt = now;
    item.updatedAt = now;

    return true;
  }

  static releaseLock(id: string, workerId: string): boolean {
    const item = this.getById(id);
    if (!item || item.workerId !== workerId) return false;

    item.lockedAt = undefined;
    item.lockExpiry = undefined;
    item.workerId = undefined;
    item.updatedAt = new Date();

    return true;
  }

  static markCompleted(id: string, workerId: string): boolean {
    const item = this.getById(id);
    if (!item || item.workerId !== workerId) return false;

    const now = new Date();
    item.status = QueueStatus.COMPLETED;
    item.processingCompletedAt = now;
    item.lockedAt = undefined;
    item.lockExpiry = undefined;
    item.workerId = undefined;
    item.updatedAt = now;

    return true;
  }

  static markFailed(id: string, workerId: string, error: string): boolean {
    const item = this.getById(id);
    if (!item || item.workerId !== workerId) return false;

    const now = new Date();
    item.attempts += 1;
    item.lastAttemptAt = now;
    item.lastError = error;
    item.errorCount += 1;
    item.updatedAt = now;

    // Calculate retry delay with exponential backoff
    const baseDelayMs = 5 * 60 * 1000; // 5 minutes
    const delayMs = baseDelayMs * Math.pow(2, item.attempts - 1);
    item.nextRetryAt = new Date(now.getTime() + delayMs);

    if (item.attempts >= this.maxRetries) {
      // Move to dead letter queue
      item.status = QueueStatus.DEAD_LETTER;
      item.deadLettered = true;
    } else {
      // Schedule for retry
      item.status = QueueStatus.PENDING;
      item.scheduledFor = item.nextRetryAt;
    }

    // Release lock
    item.lockedAt = undefined;
    item.lockExpiry = undefined;
    item.workerId = undefined;

    return true;
  }

  static getRetryItems(limit = 50): EmailQueue[] {
    const now = new Date();

    return this.queue
      .filter(item =>
        item.status === QueueStatus.PENDING &&
        item.nextRetryAt &&
        item.nextRetryAt <= now &&
        item.attempts < this.maxRetries &&
        !item.deadLettered
      )
      .sort((a, b) => {
        // Sort by priority, then by next retry time
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return (a.nextRetryAt?.getTime() || 0) - (b.nextRetryAt?.getTime() || 0);
      })
      .slice(0, limit);
  }

  static cleanupExpiredLocks(): number {
    const now = new Date();
    let cleaned = 0;

    for (const item of this.queue) {
      if (item.lockedAt && item.lockExpiry && item.lockExpiry <= now) {
        // Lock expired, release it and mark as failed
        item.status = QueueStatus.PENDING;
        item.lockedAt = undefined;
        item.lockExpiry = undefined;
        item.workerId = undefined;
        item.lastError = 'Lock expired - worker may have crashed';
        item.updatedAt = now;
        cleaned++;
      }
    }

    return cleaned;
  }

  static getQueueStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    deadLetter: number;
    lockedExpired: number;
  } {
    const now = new Date();

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      deadLetter: 0,
      lockedExpired: 0
    };

    for (const item of this.queue) {
      switch (item.status) {
        case QueueStatus.PENDING:
        case QueueStatus.SCHEDULED:
          stats.pending++;
          break;
        case QueueStatus.PROCESSING:
          if (item.lockExpiry && item.lockExpiry <= now) {
            stats.lockedExpired++;
          } else {
            stats.processing++;
          }
          break;
        case QueueStatus.COMPLETED:
          stats.completed++;
          break;
        case QueueStatus.FAILED:
          stats.failed++;
          break;
        case QueueStatus.DEAD_LETTER:
          stats.deadLetter++;
          break;
      }
    }

    return stats;
  }

  static cleanup(retentionDays = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const initialCount = this.queue.length;

    // Remove completed items older than retention period
    this.queue = this.queue.filter(item =>
      item.status !== QueueStatus.COMPLETED || item.updatedAt >= cutoffDate
    );

    return initialCount - this.queue.length;
  }

  static reprocessDeadLetter(id: string): boolean {
    const item = this.getById(id);
    if (!item || !item.deadLettered) return false;

    // Reset for reprocessing
    item.status = QueueStatus.PENDING;
    item.deadLettered = false;
    item.attempts = 0;
    item.errorCount = 0;
    item.lastError = undefined;
    item.nextRetryAt = undefined;
    item.scheduledFor = new Date();
    item.updatedAt = new Date();

    return true;
  }

  static scheduleBatch(notificationIds: string[], priority: number, delay = 0): EmailQueue[] {
    const scheduledFor = new Date(Date.now() + delay);
    const batchId = crypto.randomUUID();

    return notificationIds.map(notificationId =>
      this.create({
        notificationId,
        priority,
        scheduledFor,
        batchId
      })
    );
  }

  static cancelBatch(batchId: string): number {
    let cancelled = 0;

    for (const item of this.queue) {
      if (item.batchId === batchId && item.status === QueueStatus.PENDING) {
        item.status = QueueStatus.CANCELLED;
        item.updatedAt = new Date();
        cancelled++;
      }
    }

    return cancelled;
  }
}