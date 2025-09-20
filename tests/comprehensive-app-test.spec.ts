import { test, expect, Page } from '@playwright/test';

test.describe('Ezedit Application Comprehensive Test', () => {
  let consoleErrors: any[] = [];
  let networkRequests: any[] = [];
  let retryCount = 0;

  test.beforeEach(async ({ page }) => {
    // Reset tracking arrays
    consoleErrors = [];
    networkRequests = [];
    retryCount = 0;

    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
        console.log(`Console Error: ${msg.text()}`);
      }
    });

    // Monitor network requests and track retries
    page.on('request', (request) => {
      const url = request.url();

      // Track all requests
      networkRequests.push({
        url,
        method: request.method(),
        timestamp: new Date().toISOString()
      });

      // Specifically track potential retry patterns
      if (url.includes('/api/') || url.includes('/logs')) {
        const existingRequests = networkRequests.filter(req => req.url === url);
        if (existingRequests.length > 1) {
          retryCount++;
          console.log(`Potential retry detected for ${url}. Count: ${retryCount}`);
        }
      }
    });

    // Monitor failed requests
    page.on('requestfailed', (request) => {
      console.log(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Monitor responses for 429 errors
    page.on('response', (response) => {
      if (response.status() === 429) {
        console.log(`429 Too Many Requests detected: ${response.url()}`);
        consoleErrors.push({
          type: 'network',
          text: `429 Too Many Requests: ${response.url()}`,
          timestamp: new Date().toISOString()
        });
      }
    });
  });

  test('1. Test logs page - Verify infinite retry loop fix', async ({ page }) => {
    console.log('Testing logs page at https://ezeditapp.fly.dev/logs?pass=1234');

    // Navigate to logs page
    await page.goto('https://ezeditapp.fly.dev/logs?pass=1234', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take initial screenshot
    await page.screenshot({
      path: 'test-results/logs-page-initial.png',
      fullPage: true
    });

    // Wait for page to stabilize
    await page.waitForTimeout(5000);

    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Check if logs are displayed
    const logsContainer = page.locator('pre, .logs, [data-testid="logs"]').first();
    if (await logsContainer.isVisible()) {
      console.log('Logs container found and visible');
      const logsContent = await logsContainer.textContent();
      console.log(`Logs content length: ${logsContent?.length || 0} characters`);
    } else {
      console.log('No logs container found, checking for other content indicators');
      const bodyText = await page.textContent('body');
      console.log(`Page body text (first 200 chars): ${bodyText?.substring(0, 200) || 'No content'}`);
    }

    // Wait longer to observe any auto-refresh behavior
    console.log('Observing for 10 seconds to check for infinite retries...');
    const initialRequestCount = networkRequests.length;
    const initialRetryCount = retryCount;

    await page.waitForTimeout(10000);

    const finalRequestCount = networkRequests.length;
    const finalRetryCount = retryCount;

    console.log(`Initial requests: ${initialRequestCount}, Final requests: ${finalRequestCount}`);
    console.log(`Initial retries: ${initialRetryCount}, Final retries: ${finalRetryCount}`);

    // Take final screenshot
    await page.screenshot({
      path: 'test-results/logs-page-after-10s.png',
      fullPage: true
    });

    // Check for excessive requests (indicating infinite retry)
    const requestIncrease = finalRequestCount - initialRequestCount;
    expect(requestIncrease).toBeLessThan(20); // Allow some requests but not excessive

    // Check for 429 errors
    const has429Errors = consoleErrors.some(error => error.text.includes('429'));
    expect(has429Errors).toBe(false);

    // Check for ERR_INSUFFICIENT_RESOURCES
    const hasResourceErrors = consoleErrors.some(error =>
      error.text.includes('ERR_INSUFFICIENT_RESOURCES') ||
      error.text.includes('insufficient resources')
    );
    expect(hasResourceErrors).toBe(false);
  });

  test('2. Test main application page', async ({ page }) => {
    console.log('Testing main application at https://ezeditapp.fly.dev');

    await page.goto('https://ezeditapp.fly.dev', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take screenshot
    await page.screenshot({
      path: 'test-results/main-page.png',
      fullPage: true
    });

    // Check page loads successfully
    const title = await page.title();
    console.log(`Main page title: ${title}`);

    // Look for navigation or access to editor/dashboard
    const navElements = await page.locator('nav, .nav, [role="navigation"]').count();
    const buttonElements = await page.locator('button, .btn, [role="button"]').count();
    const linkElements = await page.locator('a[href*="edit"], a[href*="dashboard"], a[href*="editor"]').count();

    console.log(`Navigation elements: ${navElements}`);
    console.log(`Button elements: ${buttonElements}`);
    console.log(`Editor/Dashboard links: ${linkElements}`);

    // Check for any login or authentication forms
    const loginForm = page.locator('form[action*="login"], form[action*="auth"], input[type="password"]');
    const hasLoginForm = await loginForm.count() > 0;
    console.log(`Has login form: ${hasLoginForm}`);

    if (hasLoginForm) {
      console.log('Login form detected, authentication may be required');
    }

    // Check for error messages
    const errorElements = await page.locator('.error, .alert-error, [role="alert"]').count();
    console.log(`Error elements: ${errorElements}`);

    // Ensure no infinite retry loops on main page
    await page.waitForTimeout(5000);
    const requestsAfterWait = networkRequests.length;
    console.log(`Network requests after 5s wait: ${requestsAfterWait}`);
  });

  test('3. Test FTP connection functionality', async ({ page }) => {
    console.log('Testing FTP connection functionality');

    await page.goto('https://ezeditapp.fly.dev', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Look for FTP connection interface
    const ftpElements = await page.locator('input[placeholder*="ftp"], input[placeholder*="host"], input[placeholder*="server"]').count();
    const connectButtons = await page.locator('button:has-text("Connect"), button:has-text("connect")').count();

    console.log(`FTP input elements: ${ftpElements}`);
    console.log(`Connect buttons: ${connectButtons}`);

    if (ftpElements > 0 || connectButtons > 0) {
      await page.screenshot({
        path: 'test-results/ftp-interface.png',
        fullPage: true
      });

      // Try to interact with FTP form if visible
      const hostInput = page.locator('input[placeholder*="host"], input[placeholder*="server"]').first();
      if (await hostInput.isVisible()) {
        console.log('FTP host input found and visible');
      }
    } else {
      console.log('No obvious FTP interface found on main page');

      // Check for navigation to FTP/connection page
      const ftpLinks = await page.locator('a[href*="ftp"], a[href*="connect"], a[href*="server"]').count();
      console.log(`FTP-related links: ${ftpLinks}`);
    }
  });

  test('4. Test three-pane editor functionality', async ({ page }) => {
    console.log('Testing three-pane editor functionality');

    await page.goto('https://ezeditapp.fly.dev', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Look for editor interface
    const editorElements = await page.locator('.editor, .pane, [class*="editor"], textarea, .monaco-editor').count();
    console.log(`Editor elements found: ${editorElements}`);

    // Look for three-pane layout
    const paneElements = await page.locator('.pane, [class*="pane"], [data-testid*="pane"]').count();
    console.log(`Pane elements found: ${paneElements}`);

    // Check for file browser/tree
    const fileBrowserElements = await page.locator('.file-tree, .file-browser, [class*="file"]').count();
    console.log(`File browser elements: ${fileBrowserElements}`);

    if (editorElements > 0) {
      await page.screenshot({
        path: 'test-results/editor-interface.png',
        fullPage: true
      });

      // Test file loading capability
      const fileInputs = await page.locator('input[type="file"], input[accept*="text"]').count();
      console.log(`File input elements: ${fileInputs}`);

      // Look for file list or directory structure
      const fileListElements = await page.locator('ul li, .file-item, [class*="file-list"]').count();
      console.log(`File list elements: ${fileListElements}`);

      // Test middle pane editing
      const textareas = page.locator('textarea, .monaco-editor, [contenteditable="true"]');
      const textareaCount = await textareas.count();
      console.log(`Editable text areas: ${textareaCount}`);

      if (textareaCount > 0) {
        const firstTextarea = textareas.first();
        if (await firstTextarea.isVisible()) {
          console.log('Attempting to test editing in middle pane');
          await firstTextarea.click();
          await firstTextarea.fill('// Test content added by Playwright');

          const content = await firstTextarea.inputValue();
          console.log(`Editor content after edit: ${content}`);

          await page.screenshot({
            path: 'test-results/editor-with-content.png',
            fullPage: true
          });
        }
      }
    } else {
      console.log('No editor interface found, looking for editor access');

      // Try to find links to editor
      const editorLinks = await page.locator('a[href*="edit"], a:has-text("Edit"), a:has-text("Editor")').count();
      console.log(`Editor links found: ${editorLinks}`);

      if (editorLinks > 0) {
        const editorLink = page.locator('a[href*="edit"], a:has-text("Edit"), a:has-text("Editor")').first();
        console.log('Attempting to navigate to editor');
        await editorLink.click();
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: 'test-results/editor-page-after-navigation.png',
          fullPage: true
        });
      }
    }
  });

  test('5. Monitor overall application health', async ({ page }) => {
    console.log('Testing overall application health and performance');

    const testUrls = [
      'https://ezeditapp.fly.dev',
      'https://ezeditapp.fly.dev/logs?pass=1234'
    ];

    for (const url of testUrls) {
      console.log(`Testing ${url}`);

      const startTime = Date.now();
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      const loadTime = Date.now() - startTime;

      console.log(`Load time for ${url}: ${loadTime}ms`);

      // Check for JavaScript errors
      const jsErrors = consoleErrors.filter(error =>
        error.type === 'error' &&
        !error.text.includes('429') &&
        !error.text.includes('network')
      );

      console.log(`JavaScript errors for ${url}: ${jsErrors.length}`);

      // Wait and monitor for stability
      const beforeWaitRequests = networkRequests.length;
      await page.waitForTimeout(3000);
      const afterWaitRequests = networkRequests.length;

      const requestsInWaitPeriod = afterWaitRequests - beforeWaitRequests;
      console.log(`Requests during 3s stability test: ${requestsInWaitPeriod}`);

      // Take performance screenshot
      await page.screenshot({
        path: `test-results/health-check-${url.replace(/[^a-zA-Z0-9]/g, '-')}.png`,
        fullPage: true
      });
    }
  });

  test.afterEach(async () => {
    // Log summary of errors and requests
    console.log('\n--- Test Summary ---');
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Total network requests: ${networkRequests.length}`);
    console.log(`Total retry count: ${retryCount}`);

    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.timestamp}] ${error.text}`);
      });
    }

    // Check for patterns indicating infinite retry
    const suspiciousRequestPatterns = networkRequests.reduce((acc, req) => {
      acc[req.url] = (acc[req.url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const excessiveRequests = Object.entries(suspiciousRequestPatterns)
      .filter(([url, count]) => count > 10)
      .sort(([,a], [,b]) => b - a);

    if (excessiveRequests.length > 0) {
      console.log('\nURLs with excessive requests (potential retry loops):');
      excessiveRequests.forEach(([url, count]) => {
        console.log(`${count}x: ${url}`);
      });
    }
  });
});