import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'apps/api/tests/e2e',
  use: { baseURL: process.env.BASE_URL || 'http://localhost:3000' },
}); 