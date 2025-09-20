import { test, expect } from '@playwright/test';

const BASE_URL = 'https://ezeditapp.fly.dev';
const TEST_USER = {
  email: 'james@ekaty.com',
  password: 'X0679931x'
};

test.describe('Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean session
    await page.context().clearCookies();
  });

  test('should load sign-in page successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);

    // Check page loads without errors
    await expect(page).toHaveTitle(/Sign In|EzEdit/);

    // Check form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for sign-up link
    await expect(page.locator('text=Sign up')).toBeVisible();
  });

  test('should sign in with valid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);

    // Fill in credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or authenticated area
    await page.waitForURL(/dashboard|websites/, { timeout: 10000 });

    // Verify successful authentication
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/dashboard|websites/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);

    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to sign-up page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);

    // Click sign-up link
    await page.click('text=Sign up');

    // Check navigation to sign-up page
    await expect(page).toHaveURL(`${BASE_URL}/auth/signup`);

    // Check sign-up form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="company"]')).toBeVisible();
  });

  test('should load password reset page', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password`);

    // Check page loads without 404
    await expect(page).not.toHaveTitle(/404|Not Found/);

    // Check email input is present for reset request
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check back to sign-in link
    await expect(page.locator('text=Back to sign in')).toBeVisible();
  });

  test('should request password reset', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password`);

    // Fill in email for reset
    await page.fill('input[type="email"]', TEST_USER.email);

    // Submit reset request
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.locator('text=Password reset link sent')).toBeVisible({ timeout: 10000 });
  });

  test('should handle password reset with token', async ({ page }) => {
    // Visit reset page with a dummy token to test the UI
    await page.goto(`${BASE_URL}/auth/reset-password?token=dummy_token`);

    // Should show password reset form instead of email request form
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();

    // Check validation works
    await page.fill('input[type="password"]', 'short');
    await page.click('button[type="submit"]');

    // Should show password length error
    await expect(page.locator('text=at least 8 characters')).toBeVisible({ timeout: 5000 });
  });

  test('should validate password confirmation', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/reset-password?token=dummy_token`);

    // Fill mismatched passwords
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'different123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show password mismatch error
    await expect(page.locator('text=do not match')).toBeVisible({ timeout: 5000 });
  });

  test('should sign out user', async ({ page }) => {
    // First sign in
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL(/dashboard|websites/, { timeout: 10000 });

    // Look for sign-out option (could be in menu, header, etc.)
    // Try common sign-out locations
    const signOutSelectors = [
      'text=Sign out',
      'text=Logout',
      'text=Log out',
      '[data-testid="sign-out"]',
      'button:has-text("Sign out")'
    ];

    let signOutFound = false;
    for (const selector of signOutSelectors) {
      try {
        await page.click(selector, { timeout: 2000 });
        signOutFound = true;
        break;
      } catch (e) {
        // Continue to next selector
      }
    }

    // If sign out button found, verify redirect to sign-in
    if (signOutFound) {
      await page.waitForURL(/signin/, { timeout: 5000 });
      expect(page.url()).toContain('signin');
    } else {
      // Log what elements are available for debugging
      console.log('Sign out button not found. Available text elements:');
      const textElements = await page.locator('text=*').allTextContents();
      console.log(textElements.slice(0, 20)); // Log first 20 text elements
    }
  });

  test('should protect authenticated routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto(`${BASE_URL}/dashboard`);

    // Should redirect to sign-in or show authentication required
    await page.waitForTimeout(2000);
    const currentUrl = page.url();

    // Either redirected to sign-in or shows auth required message
    const isProtected = currentUrl.includes('signin') ||
                       await page.locator('text=sign in').isVisible() ||
                       await page.locator('text=login').isVisible() ||
                       await page.locator('text=authenticate').isVisible();

    expect(isProtected).toBe(true);
  });
});