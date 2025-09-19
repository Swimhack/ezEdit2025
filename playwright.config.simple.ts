import { defineConfig, devices } from '@playwright/test';

/**
 * Simplified Playwright Configuration for Quick Testing
 * This runs basic tests without complex setup
 */
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'logs/test-results',
  timeout: 30 * 1000,
  expect: { timeout: 5 * 1000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,

  reporter: [
    ['line'],
    ['html', { outputFolder: 'logs/playwright-report' }],
    ['json', { outputFile: 'logs/test-results/results-simple.json' }]
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10 * 1000,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Don't start web server, assume it's already running
});