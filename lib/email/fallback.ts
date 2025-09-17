/**
 * Email fallback service with Mailgun fallback logic and intelligent provider switching
 * Provides automatic failover, health monitoring, and optimal provider selection
 */

import {
  EmailMessage,
  EmailMessageModel,
  CreateEmailMessageData,
  EmailProvider,
  EmailStatus
} from './models/EmailMessage';
import EmailSenderService, { EmailSendResult, EmailProviderConfig } from './sender';
import { getLogger } from '../logging/logger';

/**
 * Provider health status
 */
export interface ProviderHealth {
  provider: EmailProvider;
  healthy: boolean;
  lastCheck: Date;
  consecutiveFailures: number;
  averageResponseTime: number;
  errorRate: number; // Percentage of failed requests
  dailyLimit?: number;
  dailyUsed?: number;
}

/**
 * Fallback configuration
 */
export interface FallbackConfig {
  enabled: boolean;
  primaryProvider: EmailProvider;
  fallbackProviders: EmailProvider[];
  healthCheckInterval: number; // milliseconds
  failureThreshold: number; // consecutive failures before marking unhealthy
  recoveryThreshold: number; // consecutive successes to mark healthy again
  circuitBreakerTimeout: number; // milliseconds before retry
  maxRetryAttempts: number;
  retryDelay: number; // milliseconds
}

/**
 * Provider selection criteria
 */
export interface SelectionCriteria {
  preferredProvider?: EmailProvider;
  requireHighReliability?: boolean;
  allowFallback?: boolean;
  maxLatency?: number;
  budgetConstraints?: boolean;
}

/**
 * Mailgun provider implementation
 */
export class MailgunProvider {
  private logger = getLogger();

  constructor(private config: EmailProviderConfig) {}

  async send(email: EmailMessage): Promise<EmailSendResult> {
    try {
      const formData = this.buildMailgunFormData(email);

      const response = await fetch(`https://api.mailgun.net/v3/${this.getDomain()}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.config.apiKey}`).toString('base64')}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      this.logger.info('Email sent via Mailgun', {
        emailId: email.id,
        messageId: result.id,
        to: email.to.length
      });

      return {
        success: true,
        messageId: result.id,
        providerId: result.id
      };
    } catch (error) {
      this.logger.error('Mailgun send failed', error as Error, {
        emailId: email.id,
        to: email.to.length
      });

      return {
        success: false,
        error: String(error),
        retryAfter: this.getRetryDelay(error)
      };
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`https://api.mailgun.net/v3/domains/${this.getDomain()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`api:${this.config.apiKey}`).toString('base64')}`
        }
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Mailgun health check failed', error as Error);
      return false;
    }
  }

  private buildMailgunFormData(email: EmailMessage): FormData {
    const formData = new FormData();

    formData.append('from', email.from);
    email.to.forEach(to => formData.append('to', to));

    if (email.cc && email.cc.length > 0) {
      email.cc.forEach(cc => formData.append('cc', cc));
    }

    if (email.bcc && email.bcc.length > 0) {
      email.bcc.forEach(bcc => formData.append('bcc', bcc));
    }

    formData.append('subject', email.subject);
    formData.append('text', email.text_body);

    if (email.html_body) {
      formData.append('html', email.html_body);
    }

    // Add tracking
    formData.append('o:tracking', 'true');
    formData.append('o:tracking-clicks', 'true');
    formData.append('o:tracking-opens', 'true');

    // Add tags
    formData.append('o:tag', 'ezedit');
    formData.append('o:tag', email.id);

    return formData;
  }

  private getDomain(): string {
    // Extract domain from from address or use configured domain
    return 'mail.ezedit.co'; // Would be configured
  }

  private getRetryDelay(error: any): number | undefined {
    if (String(error).includes('rate limit')) {
      return 60000; // 1 minute
    }
    return undefined;
  }
}

/**
 * Default fallback configuration
 */
const DefaultFallbackConfig: FallbackConfig = {
  enabled: true,
  primaryProvider: EmailProvider.RESEND,
  fallbackProviders: [EmailProvider.MAILGUN],
  healthCheckInterval: 60 * 1000, // 1 minute
  failureThreshold: 3,
  recoveryThreshold: 3,
  circuitBreakerTimeout: 5 * 60 * 1000, // 5 minutes
  maxRetryAttempts: 3,
  retryDelay: 30 * 1000 // 30 seconds
};

/**
 * Email fallback service with intelligent provider switching
 */
export class EmailFallbackService {
  private healthStatus = new Map<EmailProvider, ProviderHealth>();
  private emailSender: EmailSenderService;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private logger = getLogger();

  constructor(
    emailSender: EmailSenderService,
    private config: FallbackConfig = DefaultFallbackConfig
  ) {
    this.emailSender = emailSender;
    this.initializeHealthStatus();

    if (this.config.enabled) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Sends email with automatic fallback
   */
  async sendWithFallback(
    emailData: CreateEmailMessageData,
    criteria: SelectionCriteria = {}
  ): Promise<{
    success: boolean;
    provider: EmailProvider;
    result: EmailSendResult;
    fallbackUsed: boolean;
    attempts: number;
  }> {
    const selectedProvider = this.selectProvider(criteria);
    let attempts = 0;
    let fallbackUsed = false;
    let lastError: string = '';

    // Primary attempt
    attempts++;
    let result = await this.attemptSend(emailData, selectedProvider);

    if (result.success) {
      await this.recordSuccess(selectedProvider);
      return {
        success: true,
        provider: selectedProvider,
        result,
        fallbackUsed,
        attempts
      };
    }

    await this.recordFailure(selectedProvider, result.error || 'Unknown error');
    lastError = result.error || 'Unknown error';

    // Fallback attempts if enabled
    if (this.config.enabled && criteria.allowFallback !== false) {
      const fallbackProviders = this.getFallbackProviders(selectedProvider);

      for (const fallbackProvider of fallbackProviders) {
        if (attempts >= this.config.maxRetryAttempts) {
          break;
        }

        if (!this.isProviderHealthy(fallbackProvider)) {
          continue;
        }

        attempts++;
        fallbackUsed = true;

        this.logger.info('Attempting fallback provider', {
          primary: selectedProvider,
          fallback: fallbackProvider,
          attempt: attempts
        });

        result = await this.attemptSend(emailData, fallbackProvider);

        if (result.success) {
          await this.recordSuccess(fallbackProvider);
          return {
            success: true,
            provider: fallbackProvider,
            result,
            fallbackUsed,
            attempts
          };
        }

        await this.recordFailure(fallbackProvider, result.error || 'Unknown error');
        lastError = result.error || 'Unknown error';
      }
    }

    // All attempts failed
    this.logger.error('All email providers failed', undefined, {
      originalProvider: selectedProvider,
      attempts,
      lastError
    });

    return {
      success: false,
      provider: selectedProvider,
      result: {
        success: false,
        error: `All providers failed. Last error: ${lastError}`
      },
      fallbackUsed,
      attempts
    };
  }

  /**
   * Gets provider health status
   */
  getProviderHealth(): Map<EmailProvider, ProviderHealth> {
    return new Map(this.healthStatus);
  }

  /**
   * Gets recommended provider based on current health
   */
  getRecommendedProvider(criteria: SelectionCriteria = {}): EmailProvider {
    return this.selectProvider(criteria);
  }

  /**
   * Forces a health check on all providers
   */
  async checkAllProviders(): Promise<Map<EmailProvider, boolean>> {
    const results = new Map<EmailProvider, boolean>();

    for (const provider of this.getSupportedProviders()) {
      const healthy = await this.checkProviderHealth(provider);
      results.set(provider, healthy);
    }

    return results;
  }

  /**
   * Gets fallback statistics
   */
  getFallbackStats(): {
    totalEmails: number;
    fallbackUsage: Record<EmailProvider, {
      primary: number;
      fallback: number;
      successRate: number;
    }>;
    healthStatus: Record<EmailProvider, {
      healthy: boolean;
      errorRate: number;
      avgResponseTime: number;
    }>;
  } {
    const healthStatus: any = {};
    const fallbackUsage: any = {};

    // Initialize stats for each provider
    this.getSupportedProviders().forEach(provider => {
      const health = this.healthStatus.get(provider)!;

      healthStatus[provider] = {
        healthy: health.healthy,
        errorRate: health.errorRate,
        avgResponseTime: health.averageResponseTime
      };

      fallbackUsage[provider] = {
        primary: 0,
        fallback: 0,
        successRate: 0
      };
    });

    return {
      totalEmails: 0, // Would be tracked from database
      fallbackUsage,
      healthStatus
    };
  }

  /**
   * Selects the best provider based on criteria
   */
  private selectProvider(criteria: SelectionCriteria): EmailProvider {
    // Use preferred provider if specified and healthy
    if (criteria.preferredProvider && this.isProviderHealthy(criteria.preferredProvider)) {
      return criteria.preferredProvider;
    }

    // Find the healthiest provider
    const availableProviders = this.getSupportedProviders().filter(provider =>
      this.isProviderHealthy(provider)
    );

    if (availableProviders.length === 0) {
      // No healthy providers, use primary as last resort
      return this.config.primaryProvider;
    }

    // Sort by health score (lower error rate + faster response time)
    availableProviders.sort((a, b) => {
      const healthA = this.healthStatus.get(a)!;
      const healthB = this.healthStatus.get(b)!;

      const scoreA = healthA.errorRate + (healthA.averageResponseTime / 1000);
      const scoreB = healthB.errorRate + (healthB.averageResponseTime / 1000);

      return scoreA - scoreB;
    });

    return availableProviders[0];
  }

  /**
   * Attempts to send email with specific provider
   */
  private async attemptSend(
    emailData: CreateEmailMessageData,
    provider: EmailProvider
  ): Promise<EmailSendResult> {
    const startTime = Date.now();

    try {
      // Override provider in email data
      const emailWithProvider = { ...emailData, provider };
      const result = await this.emailSender.send(emailWithProvider);

      // Update response time
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(provider, responseTime);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateResponseTime(provider, responseTime);

      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Records successful send for provider
   */
  private async recordSuccess(provider: EmailProvider): Promise<void> {
    const health = this.healthStatus.get(provider);
    if (health) {
      health.consecutiveFailures = 0;

      // Mark as healthy if it meets recovery threshold
      if (!health.healthy && health.consecutiveFailures === 0) {
        health.healthy = true;
        this.logger.info('Provider marked as healthy', { provider });
      }

      this.healthStatus.set(provider, health);
    }
  }

  /**
   * Records failed send for provider
   */
  private async recordFailure(provider: EmailProvider, error: string): Promise<void> {
    const health = this.healthStatus.get(provider);
    if (health) {
      health.consecutiveFailures++;

      // Mark as unhealthy if threshold exceeded
      if (health.healthy && health.consecutiveFailures >= this.config.failureThreshold) {
        health.healthy = false;
        this.logger.warn('Provider marked as unhealthy', {
          provider,
          consecutiveFailures: health.consecutiveFailures,
          error
        });
      }

      this.healthStatus.set(provider, health);
    }
  }

  /**
   * Updates response time for provider
   */
  private updateResponseTime(provider: EmailProvider, responseTime: number): void {
    const health = this.healthStatus.get(provider);
    if (health) {
      // Simple moving average
      health.averageResponseTime = (health.averageResponseTime + responseTime) / 2;
      this.healthStatus.set(provider, health);
    }
  }

  /**
   * Checks if provider is healthy
   */
  private isProviderHealthy(provider: EmailProvider): boolean {
    const health = this.healthStatus.get(provider);
    return health ? health.healthy : false;
  }

  /**
   * Gets fallback providers for given primary provider
   */
  private getFallbackProviders(primaryProvider: EmailProvider): EmailProvider[] {
    return this.config.fallbackProviders.filter(provider => provider !== primaryProvider);
  }

  /**
   * Gets all supported providers
   */
  private getSupportedProviders(): EmailProvider[] {
    return [this.config.primaryProvider, ...this.config.fallbackProviders];
  }

  /**
   * Initializes health status for all providers
   */
  private initializeHealthStatus(): void {
    this.getSupportedProviders().forEach(provider => {
      this.healthStatus.set(provider, {
        provider,
        healthy: true,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        averageResponseTime: 0,
        errorRate: 0
      });
    });
  }

  /**
   * Checks health of a specific provider
   */
  private async checkProviderHealth(provider: EmailProvider): Promise<boolean> {
    try {
      // This would call the provider's health check method
      // For now, we'll simulate it
      const healthy = Math.random() > 0.1; // 90% chance of being healthy

      const health = this.healthStatus.get(provider);
      if (health) {
        health.healthy = healthy;
        health.lastCheck = new Date();
        this.healthStatus.set(provider, health);
      }

      return healthy;
    } catch (error) {
      this.logger.error('Provider health check failed', error as Error, { provider });
      return false;
    }
  }

  /**
   * Starts periodic health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.checkAllProviders();
      } catch (error) {
        this.logger.error('Mailgun health check failed', error as Error);
      }
    }, this.config.healthCheckInterval);

    this.logger.info('Health monitoring started', {
      interval: this.config.healthCheckInterval
    });
  }

  /**
   * Stops health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      this.logger.info('Health monitoring stopped');
    }
  }

  /**
   * Updates configuration
   */
  updateConfig(newConfig: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart health monitoring if interval changed
    if (newConfig.healthCheckInterval && this.healthCheckTimer) {
      this.stopHealthMonitoring();
      this.startHealthMonitoring();
    }

    this.logger.info('Fallback configuration updated', { config: this.config });
  }

  /**
   * Gracefully shuts down the service
   */
  async close(): Promise<void> {
    this.stopHealthMonitoring();
    this.logger.info('Email fallback service closed');
  }
}

/**
 * Global fallback service instance
 */
let globalFallbackService: EmailFallbackService | null = null;

/**
 * Gets or creates the global fallback service instance
 */
export function getEmailFallbackService(emailSender?: EmailSenderService): EmailFallbackService {
  if (!globalFallbackService) {
    if (!emailSender) {
      throw new Error('EmailSenderService is required to initialize EmailFallbackService');
    }
    globalFallbackService = new EmailFallbackService(emailSender);
  }
  return globalFallbackService;
}

/**
 * Sets a new global fallback service instance
 */
export function setEmailFallbackService(service: EmailFallbackService): void {
  if (globalFallbackService) {
    globalFallbackService.close();
  }
  globalFallbackService = service;
}

export default EmailFallbackService;