/**
 * UI Test Runner for ezEdit
 * Runs all Cypress tests and generates a report
 * 
 * Usage:
 * - `node run-ui-tests.js` - Run tests and generate report
 * - `node run-ui-tests.js --report-only` - Generate report from existing results (for CI)
 */
const cypress = require('cypress');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const reportOnly = args.includes('--report-only');

// Ensure the reports directory exists
const reportsDir = path.join(__dirname, 'cypress', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Function to generate the HTML report from test results
async function generateReport(results) {
  // If in report-only mode, try to read existing results
  if (reportOnly && !results) {
    try {
      // Check if there's a previous summary file
      const summaryPath = path.join(reportsDir, 'test-summary.json');
      if (fs.existsSync(summaryPath)) {
        const summaryData = fs.readFileSync(summaryPath, 'utf8');
        results = JSON.parse(summaryData);
        console.log('Using existing test results from previous run');
      } else {
        console.error('No test results found. Run tests first or provide results file.');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error reading existing test results:', error);
      process.exit(1);
    }
  }
  
  if (!results) {
    console.error('No test results available to generate report');
    process.exit(1);
  }
  
  // Generate summary report
  const summary = results.totalTests ? results : {
    totalTests: results.totalTests || 0,
    totalPassed: results.totalPassed || 0,
    totalFailed: results.totalFailed || 0,
    totalSkipped: results.totalSkipped || 0,
    totalDuration: results.totalDuration || 0,
    runs: results.runs || []
  };
  
  // Write summary to file
  fs.writeFileSync(
    path.join(reportsDir, 'test-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  // Generate HTML report
  const reportHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ezEdit UI Test Report</title>
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      h1, h2, h3 {
        color: #2563EB;
      }
      .summary {
        background-color: #f3f4f6;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }
      .summary-item {
        background-color: white;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        text-align: center;
      }
      .summary-item h3 {
        margin-top: 0;
        font-size: 16px;
      }
      .summary-item p {
        font-size: 24px;
        font-weight: bold;
        margin: 10px 0 0;
      }
      .passed { color: #10B981; }
      .failed { color: #EF4444; }
      .skipped { color: #F59E0B; }
      .duration { color: #6366F1; }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }
      th {
        background-color: #f9fafb;
        font-weight: 600;
      }
      tr:hover {
        background-color: #f9fafb;
      }
      .timestamp {
        text-align: right;
        margin-top: 40px;
        color: #6B7280;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <h1>ezEdit UI Test Report</h1>
    
    <div class="summary">
      <h2>Test Summary</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <h3>Total Tests</h3>
          <p>${summary.totalTests}</p>
        </div>
        <div class="summary-item">
          <h3>Passed</h3>
          <p class="passed">${summary.totalPassed}</p>
        </div>
        <div class="summary-item">
          <h3>Failed</h3>
          <p class="failed">${summary.totalFailed}</p>
        </div>
        <div class="summary-item">
          <h3>Skipped</h3>
          <p class="skipped">${summary.totalSkipped}</p>
        </div>
        <div class="summary-item">
          <h3>Duration</h3>
          <p class="duration">${(summary.totalDuration / 1000).toFixed(2)}s</p>
        </div>
      </div>
    </div>
    
    <h2>Test Specs</h2>
    <table>
      <thead>
        <tr>
          <th>Spec File</th>
          <th>Tests</th>
          <th>Passed</th>
          <th>Failed</th>
          <th>Skipped</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${summary.runs.map(run => `
          <tr>
            <td>${path.basename(run.spec || '')}</td>
            <td>${run.tests || 0}</td>
            <td class="passed">${run.passed || 0}</td>
            <td class="failed">${run.failed || 0}</td>
            <td class="skipped">${run.skipped || 0}</td>
            <td>${((run.duration || 0) / 1000).toFixed(2)}s</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <p class="timestamp">Report generated on ${new Date().toLocaleString()}</p>
  </body>
  </html>
  `;
  
  fs.writeFileSync(
    path.join(reportsDir, 'test-report.html'),
    reportHtml
  );
  
  console.log(`\n✅ Report generation complete!`);
  console.log(`Total tests: ${summary.totalTests}`);
  console.log(`Passed: ${summary.totalPassed}`);
  console.log(`Failed: ${summary.totalFailed}`);
  console.log(`Skipped: ${summary.totalSkipped}`);
  console.log(`Duration: ${(summary.totalDuration / 1000).toFixed(2)}s`);
  console.log(`\nReport saved to: ${path.join(reportsDir, 'test-report.html')}`);
  
  return summary.totalFailed > 0 ? 1 : 0;
}

// If report-only mode, just generate the report and exit
if (reportOnly) {
  (async () => {
    const exitCode = await generateReport();
    process.exit(exitCode);
  })();
} else {
  // Start the development server
  console.log('Starting development server...');
  const serverProcess = require('child_process').spawn('npx', ['http-server', './public', '-p', '3000'], {
    stdio: 'pipe',
    detached: true
  });

  // Give the server time to start
  setTimeout(async () => {
  try {
    console.log('Running UI tests...');
    
    // Run Cypress tests
    const results = await cypress.run({
      browser: 'chrome',
      headless: true,
      spec: [
        'cypress/e2e/ui-auth-consistency.cy.js',
        'cypress/e2e/login-functionality.cy.js',
        'cypress/e2e/dashboard-functionality.cy.js',
        'cypress/e2e/theme-toggle.cy.js',
        'cypress/e2e/toast-notifications.cy.js',
        'cypress/e2e/header-footer-components.cy.js',
        'cypress/e2e/auth-flow.cy.js',
        'cypress/e2e/site-management.cy.js',
        'cypress/e2e/code-editor.cy.js',
        'cypress/e2e/subscription-payment.cy.js',
        'cypress/e2e/onboarding-wizard.cy.js'
      ]
    });
    
    // Process test results and generate report
    const summary = {
      totalTests: results.totalTests,
      totalPassed: results.totalPassed,
      totalFailed: results.totalFailed,
      totalSkipped: results.totalSkipped,
      totalDuration: results.totalDuration,
      runs: results.runs.map(run => ({
        spec: run.spec.name,
        tests: run.tests.length,
        passed: run.stats.passes,
        failed: run.stats.failures,
        skipped: run.stats.skipped,
        duration: run.stats.duration
      }))
    };
    
    // Generate the report
    const exitCode = await generateReport(summary);
    
    // Kill the server process
    if (serverProcess && serverProcess.pid) {
      process.kill(-serverProcess.pid);
    }
    
    // Exit with appropriate code
    process.exit(exitCode);
  } catch (error) {
    console.error('Error running tests:', error);
    
    // Kill the server process
    if (serverProcess && serverProcess.pid) {
      process.kill(-serverProcess.pid);
    }
    
    process.exit(1);
  }
}, 3000);

// Handle process termination
process.on('SIGINT', () => {
  if (serverProcess && serverProcess.pid) {
    process.kill(-serverProcess.pid);
  }
  process.exit(0);
});
}
