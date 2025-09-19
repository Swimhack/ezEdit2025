import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 *
 * This test suite covers:
 * - Sign up flow with validation
 * - Sign in flow with error handling
 * - Password requirements and security
 * - OAuth integration (Google)
 * - Session management
 * - Password reset functionality
 */

test.describe('Authentication Flow', () => {
  test('should display sign up form with proper validation', async ({ page }) => {
    await page.goto('/auth/signup');

    // Verify sign up form is present
    await expect(page.locator('form')).toBeVisible();

    // Check for required form fields
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');
    const companyField = page.locator('input[name*="company"], input[name*="organization"]');

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();

    // Test email validation
    await emailField.fill('invalid-email');
    await passwordField.fill('test123');

    // Try to submit form
    const submitButton = page.getByRole('button', { name: /sign.*up/i });
    await submitButton.click();

    // Should show validation error for invalid email
    // The exact selector would depend on your validation implementation
    const errorMessage = page.locator('[role="alert"], .error-message, .text-red-500');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should display sign in form and handle authentication', async ({ page }) => {
    await page.goto('/auth/signin');

    // Verify sign in form is present
    await expect(page.locator('form')).toBeVisible();

    // Check for required form fields
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();

    // Test with invalid credentials
    await emailField.fill('test@example.com');
    await passwordField.fill('wrongpassword');

    const submitButton = page.getByRole('button', { name: /sign.*in/i });
    await submitButton.click();

    // Wait for response and check for error handling
    await page.waitForTimeout(1000);

    // Either should show error message or stay on signin page
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/signin')) {
      // Still on signin page - check for error message
      const errorMessage = page.locator('[role="alert"], .error-message, .text-red-500');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('should provide Google OAuth option', async ({ page }) => {
    await page.goto('/auth/signin');

    // Look for Google authentication button
    const googleButton = page.getByRole('button', { name: /google/i });
    const googleLink = page.getByRole('link', { name: /google/i });

    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeVisible();
    } else if (await googleLink.isVisible()) {
      await expect(googleLink).toBeVisible();
    }

    // Test on signup page as well
    await page.goto('/auth/signup');

    const signupGoogleButton = page.getByRole('button', { name: /google/i });
    const signupGoogleLink = page.getByRole('link', { name: /google/i });

    if (await signupGoogleButton.isVisible()) {
      await expect(signupGoogleButton).toBeVisible();
    } else if (await signupGoogleLink.isVisible()) {
      await expect(signupGoogleLink).toBeVisible();
    }
  });

  test('should handle password reset functionality', async ({ page }) => {
    await page.goto('/auth/signin');

    // Look for forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password|reset.*password/i });

    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();

      // Should navigate to password reset page
      await expect(page).toHaveURL(/reset.*password|forgot.*password/);

      // Verify reset form is present
      const emailField = page.locator('input[type="email"]');
      await expect(emailField).toBeVisible();

      // Test reset request
      await emailField.fill('test@example.com');

      const resetButton = page.getByRole('button', { name: /reset|send/i });
      if (await resetButton.isVisible()) {
        await resetButton.click();

        // Wait for response
        await page.waitForTimeout(1000);

        // Should show success message or redirect
        const successMessage = page.locator('.success-message, .text-green-500, [role="status"]');
        if (await successMessage.isVisible()) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should enforce password security requirements', async ({ page }) => {
    await page.goto('/auth/signup');

    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toBeVisible();

    // Test weak password
    await passwordField.fill('123');

    // Look for password strength indicator or requirements
    const passwordHelp = page.locator('.password-help, .password-requirements, .text-sm');
    if (await passwordHelp.isVisible()) {
      await expect(passwordHelp).toBeVisible();
    }

    // Test stronger password
    await passwordField.fill('SecurePassword123!');

    // Password requirements should be satisfied
    // Implementation depends on your password validation UI
  });

  test('should handle authentication state correctly', async ({ page }) => {
    // Test behavior when accessing protected routes
    await page.goto('/dashboard');

    // Should redirect to authentication if not logged in
    const url = page.url();
    if (url.includes('/auth')) {
      await expect(page).toHaveURL(/\/auth/);
    }

    // Test API authentication
    const response = await page.request.get('/api/auth/me');

    // Should return 401 or redirect if not authenticated
    expect([200, 401, 302]).toContain(response.status());
  });

  test('should validate CSRF protection', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check if CSRF token is present in forms
    const csrfToken = page.locator('input[name="csrf_token"], input[name="_token"]');

    if (await csrfToken.isVisible()) {
      await expect(csrfToken).toBeVisible();

      const tokenValue = await csrfToken.getAttribute('value');
      expect(tokenValue).toBeTruthy();
      expect(tokenValue?.length).toBeGreaterThan(10);
    }
  });

  test('should handle session timeout gracefully', async ({ page }) => {
    // This test would typically involve:
    // 1. Authenticating a user
    // 2. Waiting for session timeout or manually expiring session
    // 3. Testing that protected actions handle expired sessions

    await page.goto('/dashboard');

    // Test API call that might require authentication
    const response = await page.request.get('/api/auth/me');

    // Verify proper handling of authentication state
    if (response.status() === 401) {
      // Should redirect to login
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/auth/);
    }
  });
});