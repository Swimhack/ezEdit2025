const { chromium } = require('playwright');

async function testEditorRoutes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  page.on('pageerror', error => console.log(`PAGE ERROR: ${error.message}`));

  const baseUrl = 'https://ezeditapp.fly.dev';
  const routes = [
    '/dashboard',
    '/editor',
    '/ftp-editor',
    '/auth/signin',
    '/auth/signup'
  ];

  console.log('🔍 Testing potential editor routes...\n');

  for (const route of routes) {
    const url = `${baseUrl}${route}`;
    console.log(`\n=== Testing: ${url} ===`);

    try {
      // Navigate to route
      const response = await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      console.log(`Status: ${response.status()}`);

      if (response.status() === 200) {
        // Wait for content to load
        await page.waitForTimeout(2000);

        // Take screenshot
        const screenshotPath = `C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\route-${route.replace(/\//g, '-')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`✅ Screenshot saved: ${screenshotPath}`);

        // Check page title
        const title = await page.title();
        console.log(`Page title: "${title}"`);

        // Look for editor-related elements
        const editorElements = await page.evaluate(() => {
          const elements = {
            hasFileTree: !!document.querySelector('[class*="file"], [class*="tree"], [id*="file"], [id*="tree"]'),
            hasCodeEditor: !!document.querySelector('[class*="editor"], [class*="monaco"], textarea, [contenteditable]'),
            hasPreview: !!document.querySelector('[class*="preview"], iframe'),
            hasFtpElements: !!document.querySelector('[class*="ftp"], [class*="connection"], [data-testid*="ftp"]'),
            hasThreePanes: document.querySelectorAll('[class*="pane"], [class*="panel"], [class*="column"]').length >= 3,
            hasLoginForm: !!document.querySelector('form[action*="login"], input[type="email"], input[type="password"]'),
            hasSignupForm: !!document.querySelector('form[action*="signup"], form[action*="register"]'),
            bodyText: document.body.innerText.slice(0, 500)
          };

          // Check for specific button/link text
          const buttons = Array.from(document.querySelectorAll('button, a')).map(el => el.textContent.trim());
          elements.relevantButtons = buttons.filter(text =>
            text.toLowerCase().includes('edit') ||
            text.toLowerCase().includes('ftp') ||
            text.toLowerCase().includes('connect') ||
            text.toLowerCase().includes('dashboard') ||
            text.toLowerCase().includes('file')
          );

          return elements;
        });

        console.log('🔍 Editor elements found:');
        console.log(`  - File tree: ${editorElements.hasFileTree}`);
        console.log(`  - Code editor: ${editorElements.hasCodeEditor}`);
        console.log(`  - Preview pane: ${editorElements.hasPreview}`);
        console.log(`  - FTP elements: ${editorElements.hasFtpElements}`);
        console.log(`  - Three panes: ${editorElements.hasThreePanes}`);
        console.log(`  - Login form: ${editorElements.hasLoginForm}`);
        console.log(`  - Signup form: ${editorElements.hasSignupForm}`);

        if (editorElements.relevantButtons.length > 0) {
          console.log(`  - Relevant buttons: ${editorElements.relevantButtons.join(', ')}`);
        }

        // Log partial body text for context
        console.log(`Page content preview: "${editorElements.bodyText.substring(0, 200)}..."`);

        // If this looks like an editor page, test FTP functionality
        if (editorElements.hasCodeEditor || editorElements.hasFtpElements || editorElements.hasThreePanes) {
          console.log('🎯 This appears to be an editor page! Testing FTP functionality...');

          // Look for FTP connection forms or buttons
          const ftpConnectionElements = await page.$$('button:has-text("Connect"), button:has-text("FTP"), input[placeholder*="host"], input[placeholder*="server"]');
          if (ftpConnectionElements.length > 0) {
            console.log(`Found ${ftpConnectionElements.length} potential FTP connection elements`);
          }

          // Look for file tree or file browser
          const fileElements = await page.$$('[class*="file"], [class*="tree"], [data-testid*="file"]');
          if (fileElements.length > 0) {
            console.log(`Found ${fileElements.length} potential file tree elements`);
          }
        }

        // Check for navigation links to other routes
        const navigationLinks = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a[href]')).map(link => ({
            text: link.textContent.trim(),
            href: link.href
          })).filter(link =>
            link.href.includes('editor') ||
            link.href.includes('dashboard') ||
            link.href.includes('ftp') ||
            link.text.toLowerCase().includes('edit') ||
            link.text.toLowerCase().includes('dashboard')
          );
        });

        if (navigationLinks.length > 0) {
          console.log('🔗 Found relevant navigation links:');
          navigationLinks.forEach(link => {
            console.log(`  - "${link.text}" -> ${link.href}`);
          });
        }

      } else if (response.status() === 404) {
        console.log('❌ Route not found (404)');
      } else if (response.status() === 302 || response.status() === 301) {
        console.log(`🔄 Redirect (${response.status()}) - Final URL: ${page.url()}`);

        // Take screenshot of redirected page
        const screenshotPath = `C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\redirect-${route.replace(/\//g, '-')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Redirect screenshot: ${screenshotPath}`);
      } else {
        console.log(`⚠️ Unexpected status: ${response.status()}`);
      }

    } catch (error) {
      console.log(`❌ Error accessing ${url}: ${error.message}`);
    }
  }

  // Test the landing page for any hidden editor links
  console.log('\n=== Testing landing page for editor access ===');
  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for any editor-related content that might not be immediately visible
    const hiddenEditorAccess = await page.evaluate(() => {
      // Check for hidden elements, data attributes, or scripts that might reveal editor routes
      const hiddenElements = Array.from(document.querySelectorAll('[style*="display: none"], [hidden], [class*="hidden"]'));
      const dataAttributes = Array.from(document.querySelectorAll('[data-*]')).map(el =>
        Array.from(el.attributes).filter(attr => attr.name.startsWith('data-')).map(attr => `${attr.name}="${attr.value}"`).join(' ')
      ).filter(attrs => attrs.includes('editor') || attrs.includes('ftp'));

      const scripts = Array.from(document.querySelectorAll('script')).map(script => script.textContent).join(' ');
      const hasEditorReferences = scripts.includes('editor') || scripts.includes('ftp') || scripts.includes('/dashboard');

      return {
        hiddenCount: hiddenElements.length,
        dataAttributes,
        hasEditorReferences
      };
    });

    console.log('🔍 Hidden editor access analysis:');
    console.log(`  - Hidden elements: ${hiddenEditorAccess.hiddenCount}`);
    console.log(`  - Editor data attributes: ${hiddenEditorAccess.dataAttributes.join(', ') || 'none'}`);
    console.log(`  - Script references to editor: ${hiddenEditorAccess.hasEditorReferences}`);

  } catch (error) {
    console.log(`Error analyzing landing page: ${error.message}`);
  }

  await browser.close();
  console.log('\n✅ Route testing complete!');
}

testEditorRoutes().catch(console.error);