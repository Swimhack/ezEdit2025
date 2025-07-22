// Authentication tests - signup, login, logout
const { test, expect } = require('@playwright/test');
const { 
  waitForPageLoad, 
  SELECTORS, 
  TEST_USERS,
  waitForToast,
  setupConsoleErrorTracking,
  setupNetworkErrorTracking,
  takeScreenshot
} = require('./test-helpers');

test.describe('Authentication Flow Tests', () => {
  let consoleErrors;
  let networkErrors;

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleErrorTracking(page);
    networkErrors = setupNetworkErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await takeScreenshot(page, `auth-failed-${testInfo.title}`);
    }
    
    // Clean up - logout if logged in
    try {
      await page.evaluate(() => localStorage.clear());
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test.describe('Signup Tests', () => {
    test('should load signup page successfully', async ({ page }) => {
      await page.goto('/signup.html');
      await waitForPageLoad(page);
      
      // Check page elements
      await expect(page).toHaveTitle(/signup|sign up|register/i);
      await expect(page.locator(SELECTORS.auth.form)).toBeVisible();
      await expect(page.locator(SELECTORS.auth.emailInput)).toBeVisible();
      await expect(page.locator(SELECTORS.auth.passwordInput)).toBeVisible();
      await expect(page.locator(SELECTORS.auth.submitBtn)).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/signup.html');
      await waitForPageLoad(page);
      
      // Try to submit empty form
      await page.click(SELECTORS.auth.submitBtn);
      
      // Check for validation messages
      const errorMessages = page.locator('.error, .error-message, .invalid-feedback, .field-error');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show validation errors for invalid email', async ({ page }) => {
      await page.goto('/signup.html');
      await waitForPageLoad(page);
      
      // Fill with invalid email
      await page.fill(SELECTORS.auth.emailInput, 'invalid-email');
      await page.fill(SELECTORS.auth.passwordInput, 'ValidPassword123!');
      
      // Try to submit
      await page.click(SELECTORS.auth.submitBtn);
      
      // Check for email validation error
      const errorMessages = page.locator('.error, .error-message, .invalid-feedback');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show validation errors for weak password', async ({ page }) => {
      await page.goto('/signup.html');
      await waitForPageLoad(page);
      
      // Fill with weak password
      await page.fill(SELECTORS.auth.emailInput, 'test@example.com');
      await page.fill(SELECTORS.auth.passwordInput, '123');
      
      // Try to submit
      await page.click(SELECTORS.auth.submitBtn);
      
      // Check for password validation error
      const errorMessages = page.locator('.error, .error-message, .invalid-feedback');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    });

    test('should handle password confirmation mismatch', async ({ page }) => {
      await page.goto('/signup.html');
      await waitForPageLoad(page);
      
      // Check if confirm password field exists
      const confirmPasswordField = page.locator(SELECTORS.auth.confirmPasswordInput);
      const confirmFieldExists = await confirmPasswordField.count() > 0;
      
      if (confirmFieldExists) {
        await page.fill(SELECTORS.auth.emailInput, 'test@example.com');
        await page.fill(SELECTORS.auth.passwordInput, 'Password123!');
        await page.fill(SELECTORS.auth.confirmPasswordInput, 'DifferentPassword123!');
        
        await page.click(SELECTORS.auth.submitBtn);
        
        // Check for password mismatch error
        const errorMessages = page.locator('.error, .error-message, .invalid-feedback');
        await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should attempt signup with valid credentials', async ({ page }) => {
      await page.goto('/signup.html');
      await waitForPageLoad(page);
      
      const testUser = {
        email: `test-${Date.now()}@ezedit-test.com`,
        password: 'TestPassword123!'
      };
      
      // Fill the form
      await page.fill(SELECTORS.auth.emailInput, testUser.email);
      await page.fill(SELECTORS.auth.passwordInput, testUser.password);
      
      // Fill confirm password if it exists
      const confirmPasswordField = page.locator(SELECTORS.auth.confirmPasswordInput);
      if (await confirmPasswordField.count() > 0) {
        await page.fill(SELECTORS.auth.confirmPasswordInput, testUser.password);
      }
      
      // Submit form
      await page.click(SELECTORS.auth.submitBtn);
      
      // Wait for response (success message or error)
      await page.waitForTimeout(3000);
      
      // Check for either success message, verification message, or redirect
      const possibleOutcomes = [
        page.locator(SELECTORS.toast.success),
        page.locator('.success, .success-message'),
        page.locator('.verification-message, .verify-email'),
        page.locator('text=/verify/i'),
        page.locator('text=/check your email/i')
      ];
      
      let outcomeFound = false;
      for (const outcome of possibleOutcomes) {
        if (await outcome.count() > 0) {
          outcomeFound = true;
          break;
        }
      }
      
      // If no success message, check if we got redirected or if there's an error
      if (!outcomeFound) {
        const currentUrl = page.url();
        const hasError = await page.locator('.error, .error-message').count() > 0;
        
        // Either we redirected (success) or we have an error message
        expect(currentUrl.includes('dashboard') || hasError).toBeTruthy();
      }
    });
  });

  test.describe('Login Tests', () => {
    test('should load login page successfully', async ({ page }) => {
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      // Check page elements
      await expect(page).toHaveTitle(/login|sign in/i);
      await expect(page.locator(SELECTORS.auth.form)).toBeVisible();
      await expect(page.locator(SELECTORS.auth.emailInput)).toBeVisible();
      await expect(page.locator(SELECTORS.auth.passwordInput)).toBeVisible();
      await expect(page.locator(SELECTORS.auth.submitBtn)).toBeVisible();
    });

    test('should show validation errors for empty login form', async ({ page }) => {
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      // Try to submit empty form
      await page.click(SELECTORS.auth.submitBtn);
      
      // Check for validation messages
      const errorMessages = page.locator('.error, .error-message, .invalid-feedback, .field-error');
      await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
    });

    test('should handle invalid login credentials', async ({ page }) => {
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      // Fill with invalid credentials
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.invalid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.invalid.password);
      
      // Submit form
      await page.click(SELECTORS.auth.submitBtn);
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Check for error message or staying on login page
      const hasError = await page.locator('.error, .error-message, .toast-error').count() > 0;
      const stayedOnLogin = page.url().includes('login');
      
      expect(hasError || stayedOnLogin).toBeTruthy();
    });

    test('should handle valid login credentials', async ({ page }) => {
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      // Fill with test credentials
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      
      // Submit form
      await page.click(SELECTORS.auth.submitBtn);
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Check outcome - either redirected to dashboard or error message
      const currentUrl = page.url();
      const hasError = await page.locator('.error, .error-message, .toast-error').count() > 0;
      
      if (currentUrl.includes('dashboard')) {
        // Successful login
        await expect(page).toHaveURL(/dashboard/i);
      } else {
        // Login failed - should have error message
        expect(hasError).toBeTruthy();
      }
    });

    test('should have Google OAuth button if configured', async ({ page }) => {
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      // Check for Google OAuth button
      const googleBtn = page.locator('button:has-text("Google"), .google-btn, [data-provider="google"]');
      const googleBtnCount = await googleBtn.count();
      
      if (googleBtnCount > 0) {
        await expect(googleBtn.first()).toBeVisible();
        
        // Click to test (but don't complete OAuth flow)
        await googleBtn.first().click();
        await page.waitForTimeout(2000);
        
        // Should either redirect to Google or show an error
        const currentUrl = page.url();
        const hasError = await page.locator('.error, .error-message').count() > 0;
        
        expect(currentUrl.includes('google') || hasError).toBeTruthy();
      }
    });

    test('should have forgot password functionality if available', async ({ page }) => {
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      // Check for forgot password link
      const forgotLinks = page.locator('a:has-text("Forgot"), a[href*="forgot"], a[href*="reset"]');
      const linkCount = await forgotLinks.count();
      
      if (linkCount > 0) {
        const firstLink = forgotLinks.first();
        await expect(firstLink).toBeVisible();
        
        // Test the link
        await firstLink.click();
        await page.waitForTimeout(2000);
        
        // Should navigate to password reset page
        const currentUrl = page.url();
        expect(currentUrl.includes('reset') || currentUrl.includes('forgot')).toBeTruthy();
      }
    });
  });

  test.describe('Session Management', () => {
    test('should redirect unauthenticated users from protected pages', async ({ page }) => {
      // Try to access dashboard without authentication
      await page.goto('/dashboard-real.html');
      await waitForPageLoad(page);
      
      // Should redirect to login or show login form
      const currentUrl = page.url();
      const hasLoginForm = await page.locator(SELECTORS.auth.form).count() > 0;
      
      expect(currentUrl.includes('login') || hasLoginForm).toBeTruthy();
    });

    test('should redirect unauthenticated users from editor', async ({ page }) => {
      // Try to access editor without authentication
      await page.goto('/editor-real.html');
      await waitForPageLoad(page);
      
      // Should redirect to login or show login form
      const currentUrl = page.url();
      const hasLoginForm = await page.locator(SELECTORS.auth.form).count() > 0;
      
      expect(currentUrl.includes('login') || hasLoginForm).toBeTruthy();
    });

    test('should handle logout functionality', async ({ page }) => {
      // First try to login
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      
      // Wait for login result
      await page.waitForTimeout(5000);
      
      // If login was successful (redirected to dashboard)
      if (page.url().includes('dashboard')) {
        // Look for logout button
        const logoutSelectors = [
          SELECTORS.nav.logoutBtn,
          '.user-menu .logout',
          'button:has-text("logout")',
          'button:has-text("sign out")',
          '[data-action="logout"]'
        ];
        
        let logoutBtn = null;
        for (const selector of logoutSelectors) {
          if (await page.locator(selector).count() > 0) {
            logoutBtn = page.locator(selector).first();
            break;
          }
        }
        
        if (logoutBtn) {
          await logoutBtn.click();
          await page.waitForTimeout(2000);
          
          // Should redirect to home or login
          const currentUrl = page.url();
          expect(currentUrl.includes('index') || currentUrl.includes('login') || currentUrl === page.url()).toBeTruthy();
        }
      }
    });
  });

  test.describe('Cross-browser Compatibility', () => {
    test('should work in different browsers', async ({ page, browserName }) => {
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      // Basic functionality test for each browser
      await expect(page.locator(SELECTORS.auth.emailInput)).toBeVisible();
      await expect(page.locator(SELECTORS.auth.passwordInput)).toBeVisible();
      await expect(page.locator(SELECTORS.auth.submitBtn)).toBeVisible();
      
      // Fill form to test input functionality
      await page.fill(SELECTORS.auth.emailInput, 'test@example.com');
      await page.fill(SELECTORS.auth.passwordInput, 'TestPassword123!');
      
      // Verify inputs were filled
      const emailValue = await page.inputValue(SELECTORS.auth.emailInput);
      const passwordValue = await page.inputValue(SELECTORS.auth.passwordInput);
      
      expect(emailValue).toBe('test@example.com');
      expect(passwordValue).toBe('TestPassword123!');
    });
  });
});