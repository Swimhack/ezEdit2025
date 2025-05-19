import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./apps/api/tests/setup.ts'],
  },
}); 