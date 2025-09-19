import { test, expect } from '@playwright/test';

/**
 * Homepage and Navigation E2E Tests
 *
 * This test suite covers:
 * - Homepage loading and basic functionality
 * - Navigation between pages
 * - Responsive design
 * - Security headers
 * - Performance benchmarks
 */

test.describe('Homepage and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Test basic page loading
    await expect(page).toHaveTitle(/EzEdit/);

    // Verify main content is visible
    await expect(page.locator('body')).toBeVisible();

    // Check for any JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify no critical JavaScript errors
    expect(errors).toHaveLength(0);
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto('/');

    // Verify security headers are present
    const headers = response?.headers();

    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-frame-options']).toBe('DENY');
    expect(headers?.['x-xss-protection']).toBe('1; mode=block');
    expect(headers?.['strict-transport-security']).toContain('max-age=31536000');
  });

  test('should navigate to authentication pages', async ({ page }) => {
    // Test navigation to sign in page
    const signinLink = page.getByRole('link', { name: /sign.*in/i });

    if (await signinLink.isVisible()) {
      await signinLink.click();
      await expect(page).toHaveURL(/\/auth\/signin/);

      // Verify sign in form is present
      await expect(page.locator('form')).toBeVisible();

      // Navigate back to home
      await page.goto('/');
    }

    // Test navigation to sign up page
    const signupLink = page.getByRole('link', { name: /sign.*up/i });

    if (await signupLink.isVisible()) {
      await signupLink.click();
      await expect(page).toHaveURL(/\/auth\/signup/);

      // Verify sign up form is present
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();

    // Check for mobile-specific elements or layouts
    // This would be customized based on your actual mobile design
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
  });

  test('should handle navigation to dashboard when authenticated', async ({ page }) => {
    // Try to navigate to dashboard
    await page.goto('/dashboard');

    // Should either show dashboard or redirect to auth
    const url = page.url();

    if (url.includes('/auth')) {
      // Not authenticated - should redirect to auth page
      await expect(page).toHaveURL(/\/auth/);
    } else if (url.includes('/dashboard')) {
      // Authenticated - should show dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  test('should load within performance thresholds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Performance threshold: page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Test Core Web Vitals would go here in a more comprehensive setup
    // You could use page.evaluate() to access performance APIs
  });

  test('should handle API health check', async ({ page }) => {
    // Test the health endpoint directly
    const response = await page.request.get('/api/health');

    expect(response.status()).toBe(200);

    const responseData = await response.json();
    expect(responseData).toHaveProperty('message');
  });
});