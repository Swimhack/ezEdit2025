#!/usr/bin/env node

/**
 * Test runner for EzEdit.co Playwright tests
 * Runs tests against the live deployment and generates comprehensive reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 EzEdit.co MVP Test Suite');
console.log('==============================');
console.log('Target: http://159.65.224.175');
console.log('==============================\n');

// Create results directory
const resultsDir = './test-results';
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Test configuration
const testFiles = [
  '01-landing-page.spec.js',
  '02-authentication.spec.js', 
  '03-dashboard.spec.js',
  '04-editor.spec.js',
  '05-pricing-billing.spec.js',
  '06-end-to-end.spec.js'
];

const testResults = [];

console.log('🔍 Running individual test suites...\n');

// Run each test file individually to get detailed results
for (const testFile of testFiles) {
  console.log(`\n📋 Running ${testFile}...`);
  console.log('─'.repeat(50));
  
  try {
    const startTime = Date.now();
    
    // Try to run with chromium only (most likely to work)
    const command = `npx playwright test tests/playwright/${testFile} --project=chromium --reporter=json --output=${resultsDir}/${testFile}-results.json`;
    
    const output = execSync(command, { 
      encoding: 'utf8',
      cwd: __dirname,
      timeout: 300000 // 5 minute timeout per test file
    });
    
    const duration = Date.now() - startTime;
    
    testResults.push({
      file: testFile,
      status: 'PASSED',
      duration: duration,
      output: output
    });
    
    console.log(`✅ ${testFile} completed in ${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    testResults.push({
      file: testFile,
      status: 'FAILED',
      duration: duration,
      error: error.message,
      output: error.stdout || error.stderr
    });
    
    console.log(`❌ ${testFile} failed after ${duration}ms`);
    console.log(`Error: ${error.message}`);
  }
}

// Generate summary report
console.log('\n' + '='.repeat(60));
console.log('📊 TEST EXECUTION SUMMARY');
console.log('='.repeat(60));

const passedTests = testResults.filter(r => r.status === 'PASSED').length;
const failedTests = testResults.filter(r => r.status === 'FAILED').length;
const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);

console.log(`\n✅ Passed: ${passedTests}/${testResults.length}`);
console.log(`❌ Failed: ${failedTests}/${testResults.length}`);
console.log(`⏱️  Total Duration: ${totalDuration}ms (${(totalDuration/1000).toFixed(2)}s)`);

console.log('\n📝 Detailed Results:');
testResults.forEach(result => {
  const status = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`${status} ${result.file} (${result.duration}ms)`);
  
  if (result.status === 'FAILED') {
    console.log(`   Error: ${result.error}`);
  }
});

// Save detailed results
const reportData = {
  timestamp: new Date().toISOString(),
  summary: {
    total: testResults.length,
    passed: passedTests,
    failed: failedTests,
    duration: totalDuration
  },
  results: testResults,
  environment: {
    target: 'http://159.65.224.175',
    nodeVersion: process.version,
    platform: process.platform
  }
};

fs.writeFileSync(
  path.join(resultsDir, 'test-execution-report.json'), 
  JSON.stringify(reportData, null, 2)
);

console.log(`\n📄 Detailed report saved to: ${resultsDir}/test-execution-report.json`);

// Generate issues report if there were failures
if (failedTests > 0) {
  console.log('\n🔍 ISSUES DETECTED - Generating Issue Report...');
  
  const issuesReport = generateIssuesReport(testResults);
  fs.writeFileSync(
    path.join(resultsDir, 'issues-report.md'),
    issuesReport
  );
  
  console.log(`📋 Issues report saved to: ${resultsDir}/issues-report.md`);
}

console.log('\n✨ Test execution completed!');

/**
 * Generate markdown issues report
 */
function generateIssuesReport(results) {
  const failedResults = results.filter(r => r.status === 'FAILED');
  
  let report = `# EzEdit.co MVP Test Issues Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Target:** http://159.65.224.175\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total Tests:** ${results.length}\n`;
  report += `- **Passed:** ${results.filter(r => r.status === 'PASSED').length}\n`;
  report += `- **Failed:** ${failedResults.length}\n\n`;
  
  if (failedResults.length > 0) {
    report += `## Issues Found\n\n`;
    
    failedResults.forEach((result, index) => {
      report += `### ${index + 1}. ${result.file}\n\n`;
      report += `**Status:** ❌ FAILED\n`;
      report += `**Duration:** ${result.duration}ms\n`;
      report += `**Error:** \n\`\`\`\n${result.error}\n\`\`\`\n\n`;
      
      if (result.output) {
        report += `**Output:** \n\`\`\`\n${result.output.substring(0, 1000)}${result.output.length > 1000 ? '...' : ''}\n\`\`\`\n\n`;
      }
      
      // Generate recommended fixes based on common error patterns
      const recommendedFixes = generateRecommendedFixes(result.error, result.file);
      if (recommendedFixes.length > 0) {
        report += `**Recommended Fixes:**\n`;
        recommendedFixes.forEach(fix => {
          report += `- ${fix}\n`;
        });
        report += `\n`;
      }
      
      report += `---\n\n`;
    });
  }
  
  return report;
}

/**
 * Generate recommended fixes based on error patterns
 */
function generateRecommendedFixes(error, testFile) {
  const fixes = [];
  const errorLower = error.toLowerCase();
  
  if (errorLower.includes('timeout')) {
    fixes.push('Increase timeout values in test configuration');
    fixes.push('Check if the target server is responding slowly');
    fixes.push('Verify network connectivity to http://159.65.224.175');
  }
  
  if (errorLower.includes('selector') || errorLower.includes('element')) {
    fixes.push('Update CSS selectors to match current DOM structure');
    fixes.push('Add wait conditions for dynamic content loading');
    fixes.push('Check if page structure has changed since tests were written');
  }
  
  if (errorLower.includes('authentication') || errorLower.includes('login')) {
    fixes.push('Verify test user credentials are valid');
    fixes.push('Check if authentication flow has changed');
    fixes.push('Ensure Supabase authentication is properly configured');
  }
  
  if (errorLower.includes('stripe') || errorLower.includes('payment')) {
    fixes.push('Verify Stripe integration is properly configured');
    fixes.push('Check if Stripe API keys are set correctly');
    fixes.push('Ensure payment endpoints are accessible');
  }
  
  if (errorLower.includes('ftp')) {
    fixes.push('Verify FTP functionality is working on the server');
    fixes.push('Check if test FTP credentials (test.rebex.net) are still valid');
    fixes.push('Ensure FTP handler PHP scripts are properly deployed');
  }
  
  if (errorLower.includes('navigation') || errorLower.includes('redirect')) {
    fixes.push('Check routing configuration and URL patterns');
    fixes.push('Verify all page files are properly deployed');
    fixes.push('Ensure server-side redirects are working correctly');
  }
  
  if (testFile.includes('landing')) {
    fixes.push('Verify landing page (index.html) is accessible');
    fixes.push('Check if CSS and JavaScript files are loading correctly');
    fixes.push('Ensure responsive design is working across viewports');
  }
  
  if (testFile.includes('editor')) {
    fixes.push('Verify Monaco Editor is properly initialized');
    fixes.push('Check if FTP integration is working with file operations');
    fixes.push('Ensure AI assistant (Klein) integration is functioning');
  }
  
  return fixes;
}

// Exit with appropriate code
process.exit(failedTests > 0 ? 1 : 0);