import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for EzEdit.co E2E Testing
 *
 * This configuration supports:
 * - Cross-browser testing (Chrome, Firefox, Safari)
 * - Mobile device simulation
 * - Security testing with authentication flows
 * - Performance monitoring
 * - Video recording and screenshot capture
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory structure
  testDir: './tests/e2e',

  // Store Playwright artifacts under logs/
  outputDir: 'logs/test-results',

  // Global test timeout - individual tests should be faster
  timeout: 30 * 1000,

  // Expect timeout for assertions
  expect: {
    timeout: 5 * 1000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only - local development should not mask flaky tests
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration for different environments
  reporter: [
    // HTML reporter for local development
    ['html', { outputFolder: 'logs/playwright-report' }],
    // JUnit for CI integration
    ['junit', { outputFile: 'logs/test-results/junit.xml' }],
    // Line reporter for terminal output
    ['line'],
    // JSON for programmatic consumption
    ['json', { outputFile: 'logs/test-results/results.json' }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test for debugging
    trace: 'on-first-retry',

    // Record video on failure for debugging
    video: 'retain-on-failure',

    // Take screenshot on failure
    screenshot: 'only-on-failure',

    // Global test timeout
    actionTimeout: 10 * 1000,

    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,

    // Browser context settings
    viewport: { width: 1280, height: 720 },

    // Enable extra debugging info
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  // Configure projects for major browsers and devices
  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools for debugging
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet Testing
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },

    // Authentication Testing Project
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        // Use authenticated state
        storageState: 'tests/auth.json',
      },
      dependencies: ['setup'],
    },
  ],

  // Global setup and teardown
  globalSetup: require.resolve('./tests/global-setup.ts'),
  globalTeardown: require.resolve('./tests/global-teardown.ts'),

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test',
    },
  },
});