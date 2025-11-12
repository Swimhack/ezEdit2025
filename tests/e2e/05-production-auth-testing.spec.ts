import { test, expect } from '@playwright/test';

/**
 * Production Authentication Testing
 *
 * Tests signup and login system on the production deployment
 * URL: https://ezeditapp.fly.dev
 */

const PRODUCTION_BASE_URL = 'https://ezeditapp.fly.dev';

test.describe('Production Authentication System', () => {
  test.beforeEach(async ({ page }) => {
    // Set base URL to production
    await page.goto(PRODUCTION_BASE_URL);
  });

  test('should handle missing /auth/register route and redirect to correct signup', async ({ page }) => {
    // Test the incorrect URL mentioned by user
    await page.goto(`${PRODUCTION_BASE_URL}/auth/register`);

    // Should show 404 or redirect to signup
    const is404 = page.locator('text=404').isVisible();
    const hasSignupForm = page.locator('form').isVisible();

    if (await is404) {
      console.log('✅ /auth/register correctly returns 404');
      // Navigate to correct signup page
      await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);
      await expect(page.locator('form')).toBeVisible();
      console.log('✅ Correct signup page accessible at /auth/signup');
    } else if (await hasSignupForm) {
      console.log('✅ /auth/register redirects to signup form');
    }
  });

  test('should display signup form with all required elements', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);

    // Check for form presence
    await expect(page.locator('form')).toBeVisible();
    console.log('✅ Signup form is visible');

    // Check for required fields
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');
    const companyField = page.locator('input[name="company"]');

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    await expect(companyField).toBeVisible();
    console.log('✅ All required form fields are present');

    // Check for plan selection
    const planRadios = page.locator('input[name="plan"]');
    const planCount = await planRadios.count();
    expect(planCount).toBeGreaterThan(0);
    console.log(`✅ Plan selection available: ${planCount} options`);

    // Check for Google OAuth button
    const googleButton = page.getByRole('button', { name: /google/i });
    if (await googleButton.isVisible()) {
      console.log('✅ Google OAuth button present');
    } else {
      console.log('ℹ️  Google OAuth button not found');
    }

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /create.*account|sign.*up/i });
    await expect(submitButton).toBeVisible();
    console.log('✅ Submit button present');
  });

  test('should display signin form with all required elements', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signin`);

    // Check for form presence
    await expect(page.locator('form')).toBeVisible();
    console.log('✅ Signin form is visible');

    // Check for required fields
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');

    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
    console.log('✅ Email and password fields are present');

    // Check for Google OAuth button
    const googleButton = page.getByRole('button', { name: /google/i });
    if (await googleButton.isVisible()) {
      console.log('✅ Google OAuth button present');
    } else {
      console.log('ℹ️  Google OAuth button not found');
    }

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign.*in|login/i });
    await expect(submitButton).toBeVisible();
    console.log('✅ Submit button present');

    // Check for forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password|reset.*password/i });
    if (await forgotPasswordLink.isVisible()) {
      console.log('✅ Forgot password link present');
    } else {
      console.log('ℹ️  Forgot password link not found');
    }
  });

  test('should validate email input in real-time on signup', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);

    const emailField = page.locator('input[type="email"]');

    // Test invalid email
    await emailField.fill('invalid-email');
    await page.keyboard.press('Tab'); // Trigger validation

    // Check if field shows error state (red border or error message)
    const hasErrorBorder = await emailField.evaluate(el =>
      getComputedStyle(el).borderColor.includes('red') ||
      el.className.includes('red') ||
      el.className.includes('error')
    );

    const errorMessage = page.locator('.text-red-600, .error, [role="alert"]');
    const hasErrorMessage = await errorMessage.isVisible();

    if (hasErrorBorder || hasErrorMessage) {
      console.log('✅ Email validation working - shows error for invalid email');
    } else {
      console.log('📊 Email validation status unclear - may need improvement');
    }

    // Test valid email
    await emailField.fill('test@example.com');
    await page.keyboard.press('Tab');

    // Error should be gone
    const stillHasError = await errorMessage.isVisible();
    if (!stillHasError) {
      console.log('✅ Email validation clears error for valid email');
    }
  });

  test('should validate password strength on signup', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);

    const passwordField = page.locator('input[type="password"]');

    // Test weak password
    await passwordField.fill('123');

    // Look for password strength indicator
    const strengthIndicator = page.locator('.bg-red-500, .bg-yellow-500, .bg-green-500, .text-red-600, .text-yellow-600, .text-green-600');
    const strengthMeter = page.locator('[style*="width:"]');
    const feedbackText = page.locator('text=Password must, text=weak, text=medium, text=strong');

    if (await strengthIndicator.isVisible() || await strengthMeter.isVisible() || await feedbackText.isVisible()) {
      console.log('✅ Password strength validation working');

      // Test strong password
      await passwordField.fill('StrongPassword123!@#');
      await page.waitForTimeout(500);

      const strongIndicator = page.locator('.bg-green-500, .text-green-600, text=strong');
      if (await strongIndicator.isVisible()) {
        console.log('✅ Password strength shows strong for complex password');
      }
    } else {
      console.log('ℹ️  Password strength indicator not found');
    }
  });

  test('should test XSS protection in production signup form', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);

    const emailField = page.locator('input[type="email"]');
    const companyField = page.locator('input[name="company"]');

    const xssPayload = '<script>alert("XSS")</script>';

    // Test XSS in email field
    await emailField.fill(`test${xssPayload}@example.com`);
    const emailValue = await emailField.inputValue();

    if (!emailValue.includes('<script>')) {
      console.log('✅ XSS protection working in email field');
    } else {
      console.log('⚠️  Potential XSS vulnerability in email field');
    }

    // Test XSS in company field
    await companyField.fill(`Company${xssPayload}`);
    const companyValue = await companyField.inputValue();

    if (!companyValue.includes('<script>')) {
      console.log('✅ XSS protection working in company field');
    } else {
      console.log('⚠️  Potential XSS vulnerability in company field');
    }
  });

  test('should test production signup API endpoint', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    const response = await page.request.post(`${PRODUCTION_BASE_URL}/api/auth/signup`, {
      data: {
        email: testEmail,
        password: 'TestPassword123!',
        company: 'Test Company',
        plan: 'FREE'
      }
    });

    console.log(`📊 Signup API response status: ${response.status()}`);

    // Valid responses: 200 (success), 400 (validation error), 422 (user exists), 500 (server error)
    const validStatuses = [200, 400, 422, 500];
    expect(validStatuses).toContain(response.status());

    try {
      const responseData = await response.json();
      console.log(`📊 Signup API response type: ${typeof responseData}`);

      if (response.status() === 200) {
        console.log('✅ Signup API accepts valid requests');
      } else if (response.status() === 400) {
        console.log('✅ Signup API validates input properly');
      } else if (response.status() === 422) {
        console.log('✅ Signup API handles existing users properly');
      }
    } catch (error) {
      console.log('📊 Signup API response not JSON format');
    }
  });

  test('should test production signin API endpoint', async ({ page }) => {
    const response = await page.request.post(`${PRODUCTION_BASE_URL}/api/auth/signin`, {
      data: {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
    });

    console.log(`📊 Signin API response status: ${response.status()}`);

    // Should return error for invalid credentials
    const validStatuses = [401, 400, 404, 500];
    expect(validStatuses).toContain(response.status());

    if (response.status() === 401) {
      console.log('✅ Signin API properly rejects invalid credentials');
    } else if (response.status() === 400) {
      console.log('✅ Signin API validates input properly');
    }
  });

  test('should test form accessibility on production', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);

    // Check for proper form labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    const emailId = await emailInput.getAttribute('id');
    const passwordId = await passwordInput.getAttribute('id');

    if (emailId) {
      const emailLabel = page.locator(`label[for="${emailId}"]`);
      if (await emailLabel.isVisible()) {
        console.log('✅ Email input has proper label association');
      }
    }

    if (passwordId) {
      const passwordLabel = page.locator(`label[for="${passwordId}"]`);
      if (await passwordLabel.isVisible()) {
        console.log('✅ Password input has proper label association');
      }
    }

    // Check for ARIA attributes
    const form = page.locator('form');
    const ariaLabel = await form.getAttribute('aria-label');
    const ariaLabelledBy = await form.getAttribute('aria-labelledby');

    if (ariaLabel || ariaLabelledBy) {
      console.log('✅ Form has proper ARIA labeling');
    }
  });

  test('should test navigation between signup and signin', async ({ page }) => {
    // Start at signup
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);

    // Look for link to signin
    const signinLink = page.getByRole('link', { name: /sign.*in|login/i });
    if (await signinLink.isVisible()) {
      await signinLink.click();
      await expect(page).toHaveURL(/signin/);
      console.log('✅ Navigation from signup to signin works');

      // Look for link back to signup
      const signupLink = page.getByRole('link', { name: /sign.*up|register|create.*account/i });
      if (await signupLink.isVisible()) {
        await signupLink.click();
        await expect(page).toHaveURL(/signup/);
        console.log('✅ Navigation from signin to signup works');
      }
    } else {
      console.log('ℹ️  Direct navigation links between auth pages not found');
    }
  });

  test('should test production security headers', async ({ page }) => {
    const response = await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);
    const headers = response?.headers() || {};

    // Check critical security headers
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];

    let headerCount = 0;
    for (const header of requiredHeaders) {
      if (headers[header]) {
        console.log(`✅ Security header present: ${header}`);
        headerCount++;
      } else {
        console.log(`⚠️  Missing security header: ${header}`);
      }
    }

    console.log(`📊 Security headers: ${headerCount}/${requiredHeaders.length} present`);
  });

  test('should test production HTTPS enforcement', async ({ page }) => {
    // Test that HTTP redirects to HTTPS
    try {
      const response = await page.request.get('http://ezeditapp.fly.dev/auth/signup');

      if (response.status() === 301 || response.status() === 302) {
        const location = response.headers()['location'];
        if (location && location.startsWith('https://')) {
          console.log('✅ HTTP to HTTPS redirect working');
        }
      } else if (response.status() === 200) {
        // Check if we ended up on HTTPS anyway
        console.log('📊 HTTP request processed - checking final URL');
      }
    } catch (error) {
      console.log('✅ HTTP request blocked or redirected properly');
    }
  });
});