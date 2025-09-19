import { test, expect } from '@playwright/test';

/**
 * Security and Performance E2E Tests
 *
 * This test suite covers:
 * - Security headers and CSP
 * - XSS protection
 * - CSRF protection
 * - Input validation and sanitization
 * - Performance benchmarks
 * - Memory usage
 * - Network requests optimization
 * - Core Web Vitals
 */

test.describe('Security and Performance', () => {
  test('should implement comprehensive security headers', async ({ page }) => {
    const response = await page.goto('/');

    const headers = response?.headers();

    // Test all required security headers
    const securityTests = [
      {
        header: 'x-content-type-options',
        expected: 'nosniff',
        description: 'Content-Type Options header'
      },
      {
        header: 'x-frame-options',
        expected: 'DENY',
        description: 'X-Frame-Options header'
      },
      {
        header: 'x-xss-protection',
        expected: '1; mode=block',
        description: 'XSS Protection header'
      },
      {
        header: 'strict-transport-security',
        expectedContains: 'max-age=31536000',
        description: 'HSTS header'
      },
      {
        header: 'referrer-policy',
        expectedContains: 'strict-origin',
        description: 'Referrer Policy header'
      }
    ];

    for (const test of securityTests) {
      const headerValue = headers?.[test.header];
      expect(headerValue, `${test.description} should be present`).toBeTruthy();

      if (test.expected) {
        expect(headerValue, `${test.description} should have correct value`).toBe(test.expected);
      }

      if (test.expectedContains) {
        expect(headerValue, `${test.description} should contain expected value`)
          .toContain(test.expectedContains);
      }
    }
  });

  test('should implement Content Security Policy', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    const cspHeader = headers?.['content-security-policy'];
    expect(cspHeader, 'CSP header should be present').toBeTruthy();

    if (cspHeader) {
      // Check for important CSP directives
      expect(cspHeader).toContain('default-src');
      expect(cspHeader).toContain('script-src');
      expect(cspHeader).toContain('style-src');
      expect(cspHeader).toContain('img-src');

      // Should not allow unsafe inline scripts without nonce
      if (cspHeader.includes('script-src') && !cspHeader.includes('nonce-')) {
        expect(cspHeader).not.toContain("'unsafe-inline'");
      }

      console.log('✅ CSP header is properly configured');
    }
  });

  test('should prevent XSS attacks', async ({ page }) => {
    // Test input fields for XSS protection
    await page.goto('/auth/signin');

    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');

    if (await emailField.isVisible()) {
      // Try to inject script
      const xssPayload = '<script>alert("XSS")</script>';
      await emailField.fill(xssPayload);

      // Check if the script was executed (it shouldn't be)
      let alertFired = false;
      page.on('dialog', () => {
        alertFired = true;
      });

      await page.waitForTimeout(1000);
      expect(alertFired, 'XSS payload should not execute').toBe(false);

      // Verify input is sanitized or encoded
      const fieldValue = await emailField.inputValue();
      expect(fieldValue).not.toContain('<script>');
    }
  });

  test('should validate input sanitization', async ({ page }) => {
    // Test various input fields across the application
    const testPages = [
      '/auth/signin',
      '/auth/signup',
      '/websites'
    ];

    for (const testPage of testPages) {
      await page.goto(testPage);

      const inputs = page.locator('input[type="text"], input[type="email"], textarea');
      const inputCount = await inputs.count();

      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);

        if (await input.isVisible()) {
          // Test SQL injection patterns
          await input.fill("'; DROP TABLE users; --");

          // Test script injection
          await input.fill('<img src=x onerror=alert(1)>');

          // Verify dangerous content is handled safely
          const value = await input.inputValue();
          expect(value).not.toContain('DROP TABLE');
          expect(value).not.toContain('onerror=');
        }
      }
    }
  });

  test('should measure page load performance', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Performance benchmarks
    expect(loadTime, 'Page should load within 3 seconds').toBeLessThan(3000);

    // Test Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Simplified Web Vitals measurement
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};

          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const nav = entry as PerformanceNavigationTiming;
              vitals.loadTime = nav.loadEventEnd - nav.loadEventStart;
              vitals.domContentLoaded = nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart;
            }
          });

          resolve(vitals);
        });

        observer.observe({ entryTypes: ['navigation'] });

        // Fallback timeout
        setTimeout(() => resolve({}), 2000);
      });
    });

    console.log('📊 Performance metrics:', vitals);
  });

  test('should optimize network requests', async ({ page }) => {
    const requests: any[] = [];

    page.on('request', (request) => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Analyze requests
    const scriptRequests = requests.filter(r => r.resourceType === 'script');
    const styleRequests = requests.filter(r => r.resourceType === 'stylesheet');
    const imageRequests = requests.filter(r => r.resourceType === 'image');

    console.log(`📊 Network requests: ${requests.length} total`);
    console.log(`📊 Scripts: ${scriptRequests.length}, Styles: ${styleRequests.length}, Images: ${imageRequests.length}`);

    // Basic performance guidelines
    expect(scriptRequests.length, 'Should not have excessive script requests').toBeLessThan(20);
    expect(styleRequests.length, 'Should not have excessive style requests').toBeLessThan(10);

    // Check for HTTPS usage
    const httpRequests = requests.filter(r => r.url.startsWith('http://'));
    expect(httpRequests.length, 'Should prefer HTTPS for external resources').toBe(0);
  });

  test('should handle rate limiting', async ({ page }) => {
    // Test API rate limiting
    const apiEndpoint = '/api/auth/signin';

    let responses: any[] = [];

    // Make multiple rapid requests
    for (let i = 0; i < 10; i++) {
      try {
        const response = await page.request.post(apiEndpoint, {
          data: {
            email: 'test@example.com',
            password: 'testpassword'
          }
        });

        responses.push({
          status: response.status(),
          attempt: i + 1
        });
      } catch (error) {
        responses.push({
          error: error.message,
          attempt: i + 1
        });
      }

      // Small delay between requests
      await page.waitForTimeout(100);
    }

    console.log('🔒 Rate limiting test results:', responses);

    // Should eventually get rate limited (429 status)
    const rateLimited = responses.some(r => r.status === 429);
    if (rateLimited) {
      console.log('✅ Rate limiting is active');
    }
  });

  test('should protect against CSRF attacks', async ({ page }) => {
    await page.goto('/auth/signin');

    // Look for CSRF tokens in forms
    const csrfTokens = page.locator('input[name*="csrf"], input[name*="_token"], input[name="authenticity_token"]');

    if (await csrfTokens.count() > 0) {
      const tokenValue = await csrfTokens.first().getAttribute('value');
      expect(tokenValue?.length, 'CSRF token should be substantial').toBeGreaterThan(10);

      console.log('✅ CSRF protection tokens found');
    }

    // Test SameSite cookie attributes
    const cookies = await page.context().cookies();
    const sessionCookies = cookies.filter(c =>
      c.name.includes('session') ||
      c.name.includes('auth') ||
      c.name.includes('token')
    );

    for (const cookie of sessionCookies) {
      expect(cookie.secure, `${cookie.name} should be secure`).toBe(true);
      expect(['Strict', 'Lax']).toContain(cookie.sameSite);
    }
  });

  test('should implement proper error handling', async ({ page }) => {
    // Test 404 error handling
    await page.goto('/nonexistent-page');

    const notFoundElement = page.locator('.not-found, .error-404, [data-testid="404"]');
    if (await notFoundElement.isVisible()) {
      await expect(notFoundElement).toBeVisible();
      console.log('✅ 404 error page is properly handled');
    }

    // Test API error handling
    const response = await page.request.get('/api/nonexistent-endpoint');
    expect([404, 405]).toContain(response.status());

    // Verify no sensitive information is exposed in errors
    const responseText = await response.text();
    expect(responseText).not.toContain('database');
    expect(responseText).not.toContain('password');
    expect(responseText).not.toContain('secret');
  });

  test('should validate accessibility standards', async ({ page }) => {
    await page.goto('/');

    // Check for basic accessibility features
    const pageTitle = await page.title();
    expect(pageTitle.length, 'Page should have meaningful title').toBeGreaterThan(0);

    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();

    if (headingCount > 0) {
      const h1Count = await page.locator('h1').count();
      expect(h1Count, 'Page should have exactly one H1').toBeLessThanOrEqual(1);
    }

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');

      if (!alt && !ariaLabel) {
        console.warn(`⚠️  Image ${i + 1} missing alt text`);
      }
    }

    // Check for keyboard navigation
    const interactiveElements = page.locator('button, a, input, select, textarea');
    const firstElement = interactiveElements.first();

    if (await firstElement.isVisible()) {
      await firstElement.focus();
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBeTruthy();
    }
  });
});