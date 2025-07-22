// Global setup for Playwright tests
const { chromium } = require('@playwright/test');

async function globalSetup() {
  console.log('🚀 Starting EzEdit.co Playwright Test Suite');
  console.log('🌐 Testing against: http://159.65.224.175');
  
  // Create a browser instance to check if the application is accessible
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Check if the main application is accessible
    await page.goto('http://159.65.224.175', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    console.log('✅ Application is accessible');
    
    // Setup test data or configurations here if needed
    
  } catch (error) {
    console.error('❌ Application is not accessible:', error.message);
    throw new Error('Application is not accessible. Please check deployment.');
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;