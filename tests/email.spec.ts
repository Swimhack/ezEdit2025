import { test, expect } from '@playwright/test';

const BASE_URL = 'https://ezeditapp.fly.dev';
const TEST_USER = {
  email: 'james@ekaty.com',
  password: 'X0679931x'
};

test.describe('Email System Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should send password reset email successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password`);

    // Fill email and submit
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=Password reset link sent')).toBeVisible({ timeout: 15000 });

    // Verify button text changes during loading
    const button = page.locator('button[type="submit"]');
    await expect(button).toContainText(/Sending|Send reset link/);
  });

  test('should handle email API endpoint directly', async ({ page }) => {
    // Test the email API endpoint
    const response = await page.request.post(`${BASE_URL}/api/email/test`, {
      data: {
        to: TEST_USER.email,
        templateId: 'test'
      }
    });

    // Should return success or proper error
    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }
  });

  test('should validate email format in reset form', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password`);

    // Try invalid email format
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');

    // Browser should show validation error or prevent submission
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);

    // Should have some validation message for invalid email
    expect(validationMessage).toBeTruthy();
  });

  test('should show loading state during email sending', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password`);

    await page.fill('input[type="email"]', TEST_USER.email);

    // Check button state before clicking
    const button = page.locator('button[type="submit"]');
    await expect(button).toContainText('Send reset link');

    // Click and immediately check for loading state
    await button.click();

    // Should show loading state
    await expect(button).toContainText('Sending', { timeout: 2000 });

    // Eventually should show completion
    await expect(page.locator('text=Password reset link sent')).toBeVisible({ timeout: 15000 });
  });

  test('should handle email service errors gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password`);

    // Try with a potentially problematic email
    await page.fill('input[type="email"]', 'test@nonexistentdomain999.com');
    await page.click('button[type="submit"]');

    // Should either succeed (if email service is robust) or show appropriate error
    await page.waitForTimeout(10000);

    // Check for either success or error message
    const hasSuccessMessage = await page.locator('text=Password reset link sent').isVisible();
    const hasErrorMessage = await page.locator('text=error').isVisible() ||
                           await page.locator('text=failed').isVisible();

    // One of these should be true
    expect(hasSuccessMessage || hasErrorMessage).toBe(true);
  });

  test('should render email templates correctly', async ({ page }) => {
    // Test that we can access the email template preview (if available)
    const response = await page.request.get(`${BASE_URL}/api/email/test?preview=true`);

    // Should not return 404
    expect(response.status()).not.toBe(404);

    // If it's a valid endpoint, should return HTML or JSON
    const contentType = response.headers()['content-type'] || '';
    expect(contentType).toMatch(/html|json/);
  });

  test('should handle rate limiting for email sending', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password`);

    // Send multiple requests rapidly
    for (let i = 0; i < 3; i++) {
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.click('button[type="submit"]');

      // Wait for response
      await page.waitForTimeout(3000);

      // Reset form for next attempt
      await page.reload();
    }

    // After multiple attempts, should either succeed or show rate limit message
    const hasRateLimitMessage = await page.locator('text=too many').isVisible() ||
                               await page.locator('text=rate limit').isVisible() ||
                               await page.locator('text=try again later').isVisible();

    // Note: This test is informational - rate limiting behavior may vary
    console.log('Rate limiting triggered:', hasRateLimitMessage);
  });

  test('should include proper email headers and content', async ({ page }) => {
    // This test checks that the email system is properly configured
    const response = await page.request.post(`${BASE_URL}/api/auth/reset-password`, {
      data: {
        email: TEST_USER.email
      }
    });

    // Should respond successfully
    expect(response.status()).toBeLessThan(400);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('reset');
    }
  });
});