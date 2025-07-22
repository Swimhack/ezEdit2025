// Global teardown for Playwright tests
async function globalTeardown() {
  console.log('🧹 Cleaning up after Playwright test suite');
  
  // Cleanup test data or configurations here if needed
  // For example: clean up test FTP sites, test user accounts, etc.
  
  console.log('✅ Teardown complete');
}

module.exports = globalTeardown;