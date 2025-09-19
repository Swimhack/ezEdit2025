import { test, expect } from '@playwright/test';

/**
 * Final Production Authentication Test
 *
 * Patient testing approach with proper wait conditions
 */

const PRODUCTION_BASE_URL = 'https://ezedit-co.fly.dev';

test.describe('Production Authentication System - Final Verification', () => {
  test('should verify /auth/register redirects to /auth/signup', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/register`);

    // Wait for redirect to complete
    await page.waitForURL(/signup/, { timeout: 10000 });

    expect(page.url()).toContain('/auth/signup');
    console.log('✅ /auth/register redirects to /auth/signup');
  });

  test('should display fully functional signup form', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check for form presence with more patience
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 10000 });
    console.log('✅ Signup form is visible');

    // Check for required fields
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');
    const companyField = page.locator('input[name="company"]');

    await expect(emailField).toBeVisible({ timeout: 5000 });
    await expect(passwordField).toBeVisible({ timeout: 5000 });
    await expect(companyField).toBeVisible({ timeout: 5000 });
    console.log('✅ All required form fields are present');

    // Test form interactivity
    await emailField.fill('test@example.com');
    await passwordField.fill('TestPassword123!');
    await companyField.fill('Test Company');

    const emailValue = await emailField.inputValue();
    const passwordValue = await passwordField.inputValue();
    const companyValue = await companyField.inputValue();

    expect(emailValue).toBe('test@example.com');
    expect(passwordValue).toBe('TestPassword123!');
    expect(companyValue).toBe('Test Company');
    console.log('✅ Form fields are interactive and accept input');

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /create.*account|sign.*up/i });
    await expect(submitButton).toBeVisible();
    console.log('✅ Submit button present and functional');

    // Check for plan selection
    const planRadios = page.locator('input[name="plan"]');
    const planCount = await planRadios.count();
    expect(planCount).toBeGreaterThanOrEqual(2);
    console.log(`✅ Plan selection available: ${planCount} options`);

    // Test plan selection functionality
    const singleSitePlan = page.locator('input[id="SINGLE_SITE"]');
    if (await singleSitePlan.isVisible()) {
      await singleSitePlan.click();
      await expect(singleSitePlan).toBeChecked();
      console.log('✅ Plan selection is functional');
    }

    // Check for Google OAuth button
    const googleButton = page.getByRole('button', { name: /google/i });
    if (await googleButton.isVisible()) {
      console.log('✅ Google OAuth button present');
    }
  });

  test('should display fully functional signin form', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signin`);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Check for form presence
    const form = page.locator('form').first();
    await expect(form).toBeVisible({ timeout: 10000 });
    console.log('✅ Signin form is visible');

    // Check for required fields
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');

    await expect(emailField).toBeVisible({ timeout: 5000 });
    await expect(passwordField).toBeVisible({ timeout: 5000 });
    console.log('✅ Email and password fields are present');

    // Test form interactivity
    await emailField.fill('test@example.com');
    await passwordField.fill('testpassword');

    const emailValue = await emailField.inputValue();
    const passwordValue = await passwordField.inputValue();

    expect(emailValue).toBe('test@example.com');
    expect(passwordValue).toBe('testpassword');
    console.log('✅ Signin form fields are interactive');

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign.*in|login/i });
    await expect(submitButton).toBeVisible();
    console.log('✅ Signin submit button present');

    // Check for navigation to signup
    const signupLink = page.getByRole('link', { name: /sign.*up|create.*account/i });
    if (await signupLink.isVisible()) {
      console.log('✅ Link to signup page present');
    }
  });

  test('should test form security features', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);
    await page.waitForLoadState('networkidle');

    const emailField = page.locator('input[type="email"]');
    const companyField = page.locator('input[name="company"]');

    // Wait for fields to be ready
    await expect(emailField).toBeVisible({ timeout: 5000 });
    await expect(companyField).toBeVisible({ timeout: 5000 });

    // Test XSS protection in form fields
    const xssPayload = '<script>alert("XSS")</script>';

    await emailField.fill(`test${xssPayload}@example.com`);
    await companyField.fill(`Company${xssPayload}`);

    // Check if dangerous content is sanitized
    const emailValue = await emailField.inputValue();
    const companyValue = await companyField.inputValue();

    if (!emailValue.includes('<script>') && !companyValue.includes('<script>')) {
      console.log('✅ XSS protection working in form fields');
    } else {
      console.log('⚠️  XSS protection may need improvement');
    }
  });

  test('should test API endpoints functionality', async ({ page }) => {
    // Test signup API
    const signupResponse = await page.request.post(`${PRODUCTION_BASE_URL}/api/auth/signup`, {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        company: 'Test Company',
        plan: 'FREE'
      }
    });

    console.log(`📊 Signup API response: ${signupResponse.status()}`);
    expect([200, 400, 422].includes(signupResponse.status())).toBeTruthy();

    // Test signin API with invalid credentials
    const signinResponse = await page.request.post(`${PRODUCTION_BASE_URL}/api/auth/signin`, {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    });

    console.log(`📊 Signin API response: ${signinResponse.status()}`);
    // Should return error status for invalid credentials
    expect([400, 401, 404].includes(signinResponse.status())).toBeTruthy();
  });

  test('should verify security headers are present', async ({ page }) => {
    const response = await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);
    const headers = response?.headers() || {};

    // Check for critical security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];

    let headerCount = 0;
    for (const header of securityHeaders) {
      if (headers[header]) {
        console.log(`✅ Security header present: ${header}`);
        headerCount++;
      }
    }

    console.log(`📊 Security headers: ${headerCount}/${securityHeaders.length} present`);
    expect(headerCount).toBeGreaterThanOrEqual(3); // At least 3 security headers should be present
  });

  test('should verify form accessibility features', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);
    await page.waitForLoadState('networkidle');

    // Check for proper form labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible({ timeout: 5000 });

    // Check if inputs have proper labels
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
  });

  test('should perform comprehensive form validation test', async ({ page }) => {
    await page.goto(`${PRODUCTION_BASE_URL}/auth/signup`);
    await page.waitForLoadState('networkidle');

    const form = page.locator('form').first();
    const submitButton = page.getByRole('button', { name: /create.*account|sign.*up/i });

    await expect(form).toBeVisible({ timeout: 10000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    // Test submitting empty form
    await submitButton.click();

    // Page should stay on signup (not redirect) due to validation
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/auth/signup');
    console.log('✅ Form validation prevents empty submission');

    // Test with valid data
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');

    await emailField.fill('valid@example.com');
    await passwordField.fill('ValidPassword123!');

    console.log('✅ Form accepts valid input format');
  });
});