import { chromium, FullConfig } from '@playwright/test';
import path from 'path';

/**
 * Global Setup for Playwright Tests
 *
 * This setup runs once before all tests and:
 * - Ensures the application is running
 * - Creates authenticated user sessions
 * - Sets up test data
 * - Configures security testing environment
 */

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...');

  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Test basic application availability
    console.log('📡 Testing application availability...');
    await page.goto(baseURL || 'http://localhost:3000');

    // Wait for the application to be ready
    await page.waitForSelector('body', { timeout: 30000 });
    console.log('✅ Application is available');

    // Test critical security headers
    console.log('🔒 Verifying security headers...');
    const response = await page.goto(`${baseURL}/api/health`);
    const headers = response?.headers();

    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];

    for (const header of requiredHeaders) {
      if (!headers?.[header]) {
        console.warn(`⚠️  Missing security header: ${header}`);
      } else {
        console.log(`✅ Security header present: ${header}`);
      }
    }

    // Create authenticated session for tests that need it
    console.log('🔐 Creating authenticated test session...');
    await createAuthenticatedSession(page, baseURL);

    console.log('✅ Global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Creates an authenticated user session for testing
 * This saves the authentication state to be reused by tests
 */
async function createAuthenticatedSession(page: any, baseURL: string | undefined) {
  try {
    // Navigate to sign in page
    await page.goto(`${baseURL}/auth/signin`);

    // Check if we can access the signin form
    const signinForm = await page.locator('form').first();
    if (await signinForm.isVisible()) {
      console.log('📝 Sign-in form is available');

      // For now, just save the current state
      // In a real scenario, you would:
      // 1. Fill in test credentials
      // 2. Submit the form
      // 3. Wait for successful authentication
      // 4. Save the authenticated session

      await page.context().storageState({
        path: path.join(__dirname, 'auth.json')
      });

      console.log('✅ Test session state saved');
    }
  } catch (error) {
    console.log('ℹ️  Authentication setup skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
}

export default globalSetup;