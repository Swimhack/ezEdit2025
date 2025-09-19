import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global Teardown for Playwright Tests
 *
 * This cleanup runs once after all tests and:
 * - Cleans up test data
 * - Removes temporary files
 * - Generates test summary reports
 */

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Playwright global teardown...');

  try {
    // Clean up authentication files
    const authFile = path.join(__dirname, 'auth.json');
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
      console.log('✅ Cleaned up authentication test files');
    }

    // Clean up any test artifacts
    console.log('🗂️  Cleaning up test artifacts...');
    // Leave logs artifacts in place under logs/
    console.log('📁 Playwright artifacts stored in logs/test-results and logs/playwright-report');

    // Log test completion
    console.log('✅ Global teardown completed successfully');
    console.log('📊 Check logs/playwright-report/ for detailed test results');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
  }
}

export default globalTeardown;