const { chromium } = require('playwright');

async function testFtpSettings() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  console.log('🔧 Testing FTP connection settings access...\n');

  try {
    // Navigate back to dashboard
    console.log('1. Navigating to dashboard to check connection settings...');
    await page.goto('https://ezeditapp.fly.dev/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Look for manage websites or settings links
    console.log('2. Looking for website management options...');
    const manageButton = await page.$('button:has-text("Manage Websites"), a:has-text("Manage Websites")');
    if (manageButton) {
      console.log('✅ Found Manage Websites button');
      await manageButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\manage-websites.png',
        fullPage: true
      });

      console.log(`Manage websites URL: ${page.url()}`);
    }

    // Also check if there's a settings or edit connection option in the editor
    console.log('3. Checking for FTP settings in editor...');
    await page.goto('https://ezeditapp.fly.dev/editor/w_mfqaki011hc6q3', {
      waitUntil: 'networkidle'
    });

    await page.waitForTimeout(2000);

    // Look for settings, configuration, or connection options
    const settingsOptions = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = (el.textContent || '').toLowerCase();
        const attrs = Array.from(el.attributes || []).map(attr => attr.value.toLowerCase()).join(' ');
        return text.includes('settings') || text.includes('config') || text.includes('connection') ||
               text.includes('credentials') || attrs.includes('settings') || attrs.includes('config');
      });

      return elements.map(el => ({
        tagName: el.tagName,
        textContent: el.textContent?.trim() || '',
        className: el.className,
        id: el.id
      })).slice(0, 10);
    });

    console.log('Settings-related elements found:');
    settingsOptions.forEach((el, i) => {
      console.log(`  ${i + 1}. <${el.tagName}> "${el.textContent}" class="${el.className}"`);
    });

    // Test right-clicking for context menu
    console.log('4. Testing right-click context menu...');
    await page.click('[data-testid="file-tree"], .file-tree, body', { button: 'right' });
    await page.waitForTimeout(1000);

    const contextMenu = await page.$('[role="menu"], [class*="context"], [class*="menu"]');
    if (contextMenu) {
      console.log('✅ Found context menu');
      await page.screenshot({
        path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\context-menu.png'
      });
    }

    // Check browser developer tools network tab by triggering a connection attempt
    console.log('5. Testing connection retry to see network requests...');
    const retryButton = await page.$('button:has-text("Try Again")');
    if (retryButton) {
      // Monitor network requests
      const networkRequests = [];
      page.on('request', request => {
        if (request.url().includes('api/') || request.method() === 'POST') {
          networkRequests.push({
            url: request.url(),
            method: request.method(),
            postData: request.postData()
          });
        }
      });

      await retryButton.click();
      await page.waitForTimeout(3000);

      console.log('Network requests made during retry:');
      networkRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          console.log(`     Data: ${req.postData.substring(0, 100)}${req.postData.length > 100 ? '...' : ''}`);
        }
      });
    }

    // Check if there are any API endpoints we can explore
    console.log('6. Checking for API endpoints...');
    const apiEndpoints = [
      '/api/websites',
      '/api/connections',
      '/api/ftp',
      '/api/editor'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await page.goto(`https://ezeditapp.fly.dev${endpoint}`, {
          waitUntil: 'networkidle',
          timeout: 5000
        });
        console.log(`${endpoint}: ${response.status()}`);

        if (response.status() === 200) {
          const content = await page.content();
          console.log(`  Content preview: ${content.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`${endpoint}: Error - ${error.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Error during FTP settings test: ${error.message}`);
  }

  await browser.close();
  console.log('\n✅ FTP settings test complete!');
}

testFtpSettings().catch(console.error);