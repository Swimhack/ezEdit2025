const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 5000,
    video: false,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    experimentalStudio: true
  },
  env: {
    // Environment variables for tests
    supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co',
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
  }
});
