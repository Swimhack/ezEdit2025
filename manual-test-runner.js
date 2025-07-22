#!/usr/bin/env node

/**
 * Manual Test Runner for EzEdit.co MVP
 * Uses HTTP requests to test APIs and basic functionality
 * Since Playwright browser dependencies are not available
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://159.65.224.175';
const results = [];

console.log('🚀 EzEdit.co MVP Manual Test Suite');
console.log('====================================');
console.log(`Target: ${BASE_URL}`);
console.log('====================================\n');

// Test utilities
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const requestUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
    const protocol = requestUrl.startsWith('https') ? https : http;
    
    const req = protocol.get(requestUrl, {
      timeout: 10000,
      ...options
    }, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: requestUrl
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function logTest(category, test, status, details = '') {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} [${category}] ${test} ${details}`);
  
  results.push({
    category,
    test,
    status,
    details,
    timestamp: new Date().toISOString()
  });
}

// Test runner
async function runTests() {
  console.log('🔍 Starting manual tests...\n');
  
  // Test 1: Basic connectivity and pages
  await testPageAccessibility();
  
  // Test 2: API endpoints
  await testAPIEndpoints();
  
  // Test 3: Resource loading
  await testResourceLoading();
  
  // Test 4: Security headers
  await testSecurityHeaders();
  
  // Generate report
  generateReport();
}

async function testPageAccessibility() {
  console.log('📄 Testing Page Accessibility...');
  
  const pages = [
    { path: '/', name: 'Landing Page', required: true },
    { path: '/index.html', name: 'Landing Page (index.html)', required: true },
    { path: '/login-real.html', name: 'Login Page', required: true },
    { path: '/signup.html', name: 'Signup Page', required: true },
    { path: '/dashboard-real.html', name: 'Dashboard', required: true },
    { path: '/editor-real.html', name: 'Editor', required: true },
    { path: '/pricing.html', name: 'Pricing Page', required: true },
    { path: '/billing.html', name: 'Billing Page', required: true }
  ];
  
  for (const page of pages) {
    try {
      const response = await makeRequest(page.path);
      
      if (response.statusCode === 200) {
        // Check for basic HTML structure
        const hasHtml = response.body.includes('<html') || response.body.includes('<!DOCTYPE html');
        const hasTitle = response.body.includes('<title');
        const hasBody = response.body.includes('<body');
        
        if (hasHtml && hasTitle && hasBody) {
          logTest('Pages', page.name, 'PASS', `(${response.statusCode})`);
        } else {
          logTest('Pages', page.name, 'WARN', `(${response.statusCode}) - Missing HTML structure`);
        }
        
        // Check for specific page content
        await checkPageContent(page, response.body);
        
      } else if (response.statusCode >= 300 && response.statusCode < 400) {
        logTest('Pages', page.name, 'WARN', `(${response.statusCode}) - Redirect`);
      } else {
        logTest('Pages', page.name, page.required ? 'FAIL' : 'WARN', `(${response.statusCode})`);
      }
      
    } catch (error) {
      logTest('Pages', page.name, page.required ? 'FAIL' : 'WARN', `Error: ${error.message}`);
    }
  }
}

async function checkPageContent(page, body) {
  const bodyLower = body.toLowerCase();
  
  switch (page.path) {
    case '/':
    case '/index.html':
      if (bodyLower.includes('ezedit') || bodyLower.includes('ftp') || bodyLower.includes('editor')) {
        logTest('Content', 'Landing - Has EzEdit branding', 'PASS');
      } else {
        logTest('Content', 'Landing - Has EzEdit branding', 'WARN', 'No clear branding found');
      }
      
      if (bodyLower.includes('login') || bodyLower.includes('sign in')) {
        logTest('Content', 'Landing - Has login link', 'PASS');
      } else {
        logTest('Content', 'Landing - Has login link', 'WARN');
      }
      break;
      
    case '/login-real.html':
      if (bodyLower.includes('email') && (bodyLower.includes('password') || bodyLower.includes('pass'))) {
        logTest('Content', 'Login - Has email/password fields', 'PASS');
      } else {
        logTest('Content', 'Login - Has email/password fields', 'FAIL');
      }
      
      if (bodyLower.includes('supabase') || bodyLower.includes('auth')) {
        logTest('Content', 'Login - Has authentication system', 'PASS');
      } else {
        logTest('Content', 'Login - Has authentication system', 'WARN');
      }
      break;
      
    case '/pricing.html':
      if (bodyLower.includes('$') || bodyLower.includes('price') || bodyLower.includes('plan')) {
        logTest('Content', 'Pricing - Has pricing information', 'PASS');
      } else {
        logTest('Content', 'Pricing - Has pricing information', 'WARN');
      }
      
      if (bodyLower.includes('stripe')) {
        logTest('Content', 'Pricing - Has Stripe integration', 'PASS');
      } else {
        logTest('Content', 'Pricing - Has Stripe integration', 'WARN');
      }
      break;
      
    case '/editor-real.html':
      if (bodyLower.includes('monaco')) {
        logTest('Content', 'Editor - Has Monaco Editor', 'PASS');
      } else {
        logTest('Content', 'Editor - Has Monaco Editor', 'WARN');
      }
      
      if (bodyLower.includes('ftp') || bodyLower.includes('file')) {
        logTest('Content', 'Editor - Has FTP/File functionality', 'PASS');
      } else {
        logTest('Content', 'Editor - Has FTP/File functionality', 'WARN');
      }
      break;
  }
}

async function testAPIEndpoints() {
  console.log('\n🔌 Testing API Endpoints...');
  
  const endpoints = [
    { path: '/api.php', name: 'Main API Endpoint' },
    { path: '/public/api.php', name: 'Public API Endpoint' },
    { path: '/public/ftp/ftp-handler.php', name: 'FTP Handler' },
    { path: '/public/auth/auth-handler.php', name: 'Auth Handler' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.path);
      
      if (response.statusCode === 200) {
        logTest('API', endpoint.name, 'PASS', `(${response.statusCode})`);
      } else if (response.statusCode === 405) {
        logTest('API', endpoint.name, 'PASS', `(${response.statusCode}) - Method not allowed (expected)`);
      } else if (response.statusCode === 404) {
        logTest('API', endpoint.name, 'WARN', `(${response.statusCode}) - Not found`);
      } else {
        logTest('API', endpoint.name, 'WARN', `(${response.statusCode})`);
      }
      
    } catch (error) {
      logTest('API', endpoint.name, 'WARN', `Error: ${error.message}`);
    }
  }
}

async function testResourceLoading() {
  console.log('\n📦 Testing Resource Loading...');
  
  const resources = [
    { path: '/public/styles.css', name: 'Main Stylesheet', type: 'CSS' },
    { path: '/public/css/auth.css', name: 'Auth Stylesheet', type: 'CSS' },
    { path: '/public/js/auth-service.js', name: 'Auth Service JS', type: 'JavaScript' },
    { path: '/public/js/dashboard.js', name: 'Dashboard JS', type: 'JavaScript' },
    { path: '/public/js/monaco-editor.js', name: 'Monaco Editor JS', type: 'JavaScript' },
    { path: '/public/js/ftp-service.js', name: 'FTP Service JS', type: 'JavaScript' }
  ];
  
  for (const resource of resources) {
    try {
      const response = await makeRequest(resource.path);
      
      if (response.statusCode === 200) {
        // Check content type
        const contentType = response.headers['content-type'] || '';
        let correctType = false;
        
        if (resource.type === 'CSS' && contentType.includes('css')) {
          correctType = true;
        } else if (resource.type === 'JavaScript' && (contentType.includes('javascript') || contentType.includes('js'))) {
          correctType = true;
        } else if (contentType.includes('text')) {
          correctType = true; // Generic text type is acceptable
        }
        
        if (correctType) {
          logTest('Resources', resource.name, 'PASS', `(${response.statusCode})`);
        } else {
          logTest('Resources', resource.name, 'WARN', `(${response.statusCode}) Wrong content-type: ${contentType}`);
        }
        
      } else {
        logTest('Resources', resource.name, 'WARN', `(${response.statusCode})`);
      }
      
    } catch (error) {
      logTest('Resources', resource.name, 'WARN', `Error: ${error.message}`);
    }
  }
}

async function testSecurityHeaders() {
  console.log('\n🔒 Testing Security Headers...');
  
  try {
    const response = await makeRequest('/');
    const headers = response.headers;
    
    // Check for security headers
    if (headers['x-frame-options']) {
      logTest('Security', 'X-Frame-Options header', 'PASS', headers['x-frame-options']);
    } else {
      logTest('Security', 'X-Frame-Options header', 'WARN', 'Missing');
    }
    
    if (headers['x-content-type-options']) {
      logTest('Security', 'X-Content-Type-Options header', 'PASS', headers['x-content-type-options']);
    } else {
      logTest('Security', 'X-Content-Type-Options header', 'WARN', 'Missing');
    }
    
    if (headers['strict-transport-security']) {
      logTest('Security', 'Strict-Transport-Security header', 'PASS', headers['strict-transport-security']);
    } else {
      logTest('Security', 'Strict-Transport-Security header', 'WARN', 'Missing (HTTP only)');
    }
    
    if (headers['content-security-policy'] || headers['content-security-policy-report-only']) {
      logTest('Security', 'Content-Security-Policy header', 'PASS');
    } else {
      logTest('Security', 'Content-Security-Policy header', 'WARN', 'Missing');
    }
    
  } catch (error) {
    logTest('Security', 'Security Headers Check', 'FAIL', `Error: ${error.message}`);
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST EXECUTION SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`📊 Total: ${results.length}`);
  
  // Group by category
  const categories = [...new Set(results.map(r => r.category))];
  console.log('\n📈 Results by Category:');
  
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const catPassed = categoryResults.filter(r => r.status === 'PASS').length;
    const catFailed = categoryResults.filter(r => r.status === 'FAIL').length;
    const catWarnings = categoryResults.filter(r => r.status === 'WARN').length;
    
    console.log(`  ${category}: ✅ ${catPassed} ❌ ${catFailed} ⚠️  ${catWarnings}`);
  });
  
  // Generate detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    target: BASE_URL,
    summary: {
      total: results.length,
      passed,
      failed,
      warnings
    },
    results: results,
    environment: {
      nodeVersion: process.version,
      platform: process.platform
    }
  };
  
  const resultsDir = './test-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(resultsDir, 'manual-test-results.json'),
    JSON.stringify(reportData, null, 2)
  );
  
  // Generate markdown report
  const markdownReport = generateMarkdownReport(reportData);
  fs.writeFileSync(
    path.join(resultsDir, 'manual-test-results.md'),
    markdownReport
  );
  
  console.log(`\n📄 Reports saved to:`);
  console.log(`  - ${resultsDir}/manual-test-results.json`);
  console.log(`  - ${resultsDir}/manual-test-results.md`);
  
  // Generate issues and recommendations
  if (failed > 0 || warnings > 0) {
    const issuesReport = generateIssuesAndFixes();
    fs.writeFileSync(
      path.join(resultsDir, 'issues-and-fixes.md'),
      issuesReport
    );
    console.log(`  - ${resultsDir}/issues-and-fixes.md`);
  }
  
  console.log('\n✨ Manual testing completed!');
  return { passed, failed, warnings };
}

function generateMarkdownReport(data) {
  let report = `# EzEdit.co MVP Manual Test Results\n\n`;
  report += `**Generated:** ${data.timestamp}\n`;
  report += `**Target:** ${data.target}\n`;
  report += `**Node Version:** ${data.environment.nodeVersion}\n\n`;
  
  report += `## Summary\n\n`;
  report += `| Status | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| ✅ Passed | ${data.summary.passed} |\n`;
  report += `| ❌ Failed | ${data.summary.failed} |\n`;
  report += `| ⚠️ Warnings | ${data.summary.warnings} |\n`;
  report += `| **Total** | **${data.summary.total}** |\n\n`;
  
  // Group results by category
  const categories = [...new Set(data.results.map(r => r.category))];
  
  categories.forEach(category => {
    report += `## ${category} Tests\n\n`;
    report += `| Test | Status | Details |\n`;
    report += `|------|--------|--------|\n`;
    
    const categoryResults = data.results.filter(r => r.category === category);
    categoryResults.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      report += `| ${result.test} | ${statusIcon} ${result.status} | ${result.details || '-'} |\n`;
    });
    
    report += `\n`;
  });
  
  return report;
}

function generateIssuesAndFixes() {
  const failedResults = results.filter(r => r.status === 'FAIL');
  const warningResults = results.filter(r => r.status === 'WARN');
  
  let report = `# EzEdit.co MVP Issues and Recommended Fixes\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Target:** ${BASE_URL}\n\n`;
  
  if (failedResults.length > 0) {
    report += `## Critical Issues (${failedResults.length})\n\n`;
    
    failedResults.forEach((result, index) => {
      report += `### ${index + 1}. ${result.test}\n\n`;
      report += `**Category:** ${result.category}\n`;
      report += `**Status:** ❌ FAILED\n`;
      report += `**Details:** ${result.details}\n\n`;
      
      const fixes = getRecommendedFixes(result);
      if (fixes.length > 0) {
        report += `**Recommended Fixes:**\n`;
        fixes.forEach(fix => {
          report += `- ${fix}\n`;
        });
        report += `\n`;
      }
      
      report += `---\n\n`;
    });
  }
  
  if (warningResults.length > 0) {
    report += `## Warnings and Improvements (${warningResults.length})\n\n`;
    
    warningResults.forEach((result, index) => {
      report += `### ${index + 1}. ${result.test}\n\n`;
      report += `**Category:** ${result.category}\n`;
      report += `**Status:** ⚠️ WARNING\n`;
      report += `**Details:** ${result.details}\n\n`;
      
      const fixes = getRecommendedFixes(result);
      if (fixes.length > 0) {
        report += `**Recommended Improvements:**\n`;
        fixes.forEach(fix => {
          report += `- ${fix}\n`;
        });
        report += `\n`;
      }
      
      report += `---\n\n`;
    });
  }
  
  return report;
}

function getRecommendedFixes(result) {
  const fixes = [];
  const test = result.test.toLowerCase();
  const details = result.details.toLowerCase();
  
  // Page accessibility issues
  if (result.category === 'Pages') {
    if (details.includes('404')) {
      fixes.push('Verify the file exists in the correct location on the server');
      fixes.push('Check nginx/Apache configuration for proper routing');
      fixes.push('Ensure file permissions allow web server access');
    }
    
    if (details.includes('500')) {
      fixes.push('Check server error logs for detailed error information');
      fixes.push('Verify PHP configuration and extensions are properly installed');
      fixes.push('Check database connectivity if the page requires it');
    }
    
    if (details.includes('missing html structure')) {
      fixes.push('Verify the HTML file contains proper DOCTYPE, html, head, and body tags');
      fixes.push('Check if the file is being served as plain text instead of HTML');
    }
  }
  
  // Content issues
  if (result.category === 'Content') {
    if (test.includes('branding')) {
      fixes.push('Add proper EzEdit.co branding and messaging to the landing page');
      fixes.push('Include clear value proposition and product description');
    }
    
    if (test.includes('login link')) {
      fixes.push('Add prominent login/signup buttons to the navigation');
      fixes.push('Ensure buttons link to correct authentication pages');
    }
    
    if (test.includes('email/password')) {
      fixes.push('Verify login form has proper input fields with correct names/IDs');
      fixes.push('Ensure form validation is working correctly');
    }
    
    if (test.includes('monaco')) {
      fixes.push('Verify Monaco Editor CDN links are correct and accessible');
      fixes.push('Check JavaScript console for Monaco initialization errors');
    }
    
    if (test.includes('stripe')) {
      fixes.push('Verify Stripe API keys are properly configured');
      fixes.push('Check that Stripe SDK is properly loaded');
    }
  }
  
  // API issues
  if (result.category === 'API') {
    if (details.includes('404')) {
      fixes.push('Verify the API endpoint file exists in the correct location');
      fixes.push('Check URL routing configuration');
    }
    
    if (details.includes('500')) {
      fixes.push('Check PHP error logs for specific error details');
      fixes.push('Verify database connections and configurations');
      fixes.push('Ensure all required PHP extensions are installed');
    }
    
    if (test.includes('ftp')) {
      fixes.push('Verify FTP extension is enabled in PHP configuration');
      fixes.push('Check FTP server connectivity and credentials');
      fixes.push('Ensure proper error handling in FTP operations');
    }
  }
  
  // Resource loading issues
  if (result.category === 'Resources') {
    if (details.includes('404')) {
      fixes.push('Verify the resource file exists in the correct directory');
      fixes.push('Check file paths in HTML/CSS references');
    }
    
    if (details.includes('wrong content-type')) {
      fixes.push('Configure web server to serve files with correct MIME types');
      fixes.push('Add .htaccess rules for proper content-type headers');
    }
  }
  
  // Security issues
  if (result.category === 'Security') {
    if (test.includes('x-frame-options')) {
      fixes.push('Add X-Frame-Options header to prevent clickjacking attacks');
      fixes.push('Configure web server or add PHP header() calls');
    }
    
    if (test.includes('content-security-policy')) {
      fixes.push('Implement Content Security Policy to prevent XSS attacks');
      fixes.push('Start with a restrictive policy and gradually allow necessary sources');
    }
    
    if (test.includes('strict-transport-security')) {
      fixes.push('Implement HTTPS and add HSTS header for secure connections');
      fixes.push('Configure SSL certificate for the domain');
    }
  }
  
  return fixes;
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});