import { Page, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Test Helper Utilities for Playwright E2E Tests
 *
 * This module provides reusable functions for common testing patterns:
 * - Authentication helpers
 * - Form interaction helpers
 * - Wait and retry utilities
 * - Screenshot and debugging helpers
 * - Performance measurement utilities
 */

/**
 * Authentication Helper Functions
 */
export class AuthHelpers {
  constructor(private page: Page) {}

  /**
   * Attempts to sign in with given credentials
   * @param email - User email
   * @param password - User password
   * @returns Promise<boolean> - Whether signin was successful
   */
  async signIn(email: string, password: string): Promise<boolean> {
    try {
      await this.page.goto('/auth/signin');

      const emailField = this.page.locator('input[type="email"]');
      const passwordField = this.page.locator('input[type="password"]');
      const submitButton = this.page.getByRole('button', { name: /sign.*in/i });

      await emailField.fill(email);
      await passwordField.fill(password);
      await submitButton.click();

      // Wait for redirect or error
      await this.page.waitForTimeout(2000);

      // Check if we're on dashboard (successful login) or still on signin (failed)
      const currentUrl = this.page.url();
      return !currentUrl.includes('/auth/signin');

    } catch (error) {
      console.log('Sign in failed:', error);
      return false;
    }
  }

  /**
   * Signs out the current user
   */
  async signOut(): Promise<void> {
    try {
      const signOutButton = this.page.getByRole('button', { name: /sign.*out|logout/i });

      if (await signOutButton.isVisible()) {
        await signOutButton.click();
        await this.page.waitForTimeout(1000);
      } else {
        // Try navigating to a sign out endpoint
        await this.page.goto('/auth/signout');
      }
    } catch (error) {
      console.log('Sign out failed:', error);
    }
  }

  /**
   * Checks if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const response = await this.page.request.get('/api/auth/me');
      return response.status() === 200;
    } catch {
      return false;
    }
  }
}

/**
 * Form Interaction Helpers
 */
export class FormHelpers {
  constructor(private page: Page) {}

  /**
   * Fills a form with the provided data
   * @param formData - Object with field names and values
   * @param formSelector - Optional form selector
   */
  async fillForm(formData: Record<string, string>, formSelector?: string): Promise<void> {
    const form = formSelector ? this.page.locator(formSelector) : this.page.locator('form').first();

    for (const [fieldName, value] of Object.entries(formData)) {
      const field = form.locator(`input[name="${fieldName}"], textarea[name="${fieldName}"], select[name="${fieldName}"]`);

      if (await field.isVisible()) {
        await field.fill(value);
      }
    }
  }

  /**
   * Waits for form validation errors to appear
   * @param timeout - Maximum time to wait (default: 3000ms)
   */
  async waitForValidationErrors(timeout: number = 3000): Promise<string[]> {
    try {
      await this.page.waitForSelector('[role="alert"], .error-message, .text-red-500', { timeout });

      const errorElements = this.page.locator('[role="alert"], .error-message, .text-red-500');
      const errorCount = await errorElements.count();
      const errors: string[] = [];

      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorElements.nth(i).textContent();
        if (errorText) {
          errors.push(errorText.trim());
        }
      }

      return errors;
    } catch {
      return [];
    }
  }

  /**
   * Submits a form and waits for response
   * @param formSelector - Optional form selector
   */
  async submitForm(formSelector?: string): Promise<void> {
    const form = formSelector ? this.page.locator(formSelector) : this.page.locator('form').first();
    const submitButton = form.getByRole('button', { name: /submit|save|send|create|add|connect/i });

    if (await submitButton.isVisible()) {
      await submitButton.click();
      await this.page.waitForTimeout(1000);
    }
  }
}

/**
 * Wait and Retry Utilities
 */
export class WaitHelpers {
  constructor(private page: Page) {}

  /**
   * Waits for an element to appear with retry logic
   * @param selector - Element selector
   * @param maxAttempts - Maximum retry attempts
   * @param delay - Delay between attempts in ms
   */
  async waitForElementWithRetry(
    selector: string,
    maxAttempts: number = 5,
    delay: number = 1000
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.page.waitForSelector(selector, { timeout: delay });
        return true;
      } catch {
        if (attempt < maxAttempts) {
          await this.page.waitForTimeout(delay);
        }
      }
    }
    return false;
  }

  /**
   * Waits for network to be idle with retry
   * @param maxAttempts - Maximum retry attempts
   */
  async waitForNetworkIdleWithRetry(maxAttempts: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.page.waitForLoadState('networkidle', { timeout: 5000 });
        return;
      } catch {
        if (attempt < maxAttempts) {
          await this.page.waitForTimeout(1000);
        }
      }
    }
  }

  /**
   * Waits for a condition to be true with polling
   * @param condition - Function that returns boolean
   * @param timeout - Maximum time to wait
   * @param interval - Polling interval
   */
  async waitForCondition(
    condition: () => Promise<boolean> | boolean,
    timeout: number = 10000,
    interval: number = 500
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await this.page.waitForTimeout(interval);
    }

    return false;
  }
}

/**
 * Performance Measurement Utilities
 */
export class PerformanceHelpers {
  constructor(private page: Page) {}

  /**
   * Measures page load time
   */
  async measurePageLoad(url: string): Promise<number> {
    const startTime = Date.now();
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  /**
   * Captures performance metrics
   */
  async capturePerformanceMetrics(): Promise<any> {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstByte: navigation.responseStart - navigation.requestStart,
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnect: navigation.connectEnd - navigation.connectStart,
          serverResponse: navigation.responseEnd - navigation.responseStart
        };
      }

      return {};
    });
  }

  /**
   * Monitors network requests during test
   */
  async monitorNetworkRequests(): Promise<{ requests: any[], responses: any[] }> {
    const requests: any[] = [];
    const responses: any[] = [];

    this.page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      });
    });

    this.page.on('response', (response) => {
      responses.push({
        url: response.url(),
        status: response.status(),
        timestamp: Date.now()
      });
    });

    return { requests, responses };
  }
}

/**
 * Screenshot and Debugging Helpers
 */
export class DebugHelpers {
  constructor(private page: Page) {}

  /**
   * Takes a screenshot with timestamp
   * @param name - Screenshot name
   */
  async takeTimestampedScreenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filePath = path.join(process.cwd(), 'logs', 'test-results', 'screenshots', filename);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await this.page.screenshot({ path: filePath, fullPage: true });
    return filePath;
  }

  /**
   * Logs current page information for debugging
   */
  async logPageInfo(): Promise<void> {
    const url = this.page.url();
    const title = await this.page.title();
    const cookies = await this.page.context().cookies();

    console.log(`📄 Page Info:
    URL: ${url}
    Title: ${title}
    Cookies: ${cookies.length} found`);
  }

  /**
   * Captures console logs during test
   */
  async captureConsoleLogs(): Promise<string[]> {
    const logs: string[] = [];

    this.page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    return logs;
  }

  /**
   * Waits for and captures any JavaScript errors
   */
  async capturePageErrors(): Promise<string[]> {
    const errors: string[] = [];

    this.page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Give some time for errors to occur
    await this.page.waitForTimeout(1000);

    return errors;
  }
}

/**
 * Utility function to get all helper classes for a page
 */
export function getTestHelpers(page: Page) {
  return {
    auth: new AuthHelpers(page),
    form: new FormHelpers(page),
    wait: new WaitHelpers(page),
    performance: new PerformanceHelpers(page),
    debug: new DebugHelpers(page)
  };
}

/**
 * Custom assertion helpers
 */
export class CustomAssertions {
  static async expectNoJavaScriptErrors(page: Page): Promise<void> {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  }

  static async expectPerformanceThreshold(loadTime: number, threshold: number): Promise<void> {
    expect(loadTime, `Load time ${loadTime}ms should be under ${threshold}ms`).toBeLessThan(threshold);
  }

  static async expectSecurityHeaders(response: any): Promise<void> {
    const headers = response?.headers();

    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-frame-options']).toBe('DENY');
    expect(headers?.['strict-transport-security']).toContain('max-age=31536000');
  }
}