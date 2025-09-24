const { chromium } = require('playwright');

async function testEditorStructure() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  page.on('pageerror', error => console.log(`PAGE ERROR: ${error.message}`));

  console.log('🔍 Testing editor structure and three-pane layout...\n');

  try {
    // Navigate directly to the editor URL we discovered
    console.log('1. Navigating to editor...');
    await page.goto('https://ezeditapp.fly.dev/editor/w_mfqaki011hc6q3', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Dismiss the error dialog to see the editor underneath
    console.log('2. Dismissing error dialog...');
    const dismissButton = await page.$('button:has-text("Dismiss")');
    if (dismissButton) {
      await dismissButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Error dialog dismissed');
    }

    // Take screenshot of editor without error dialog
    await page.screenshot({
      path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\editor-structure.png',
      fullPage: true
    });

    // Analyze the editor structure
    console.log('3. Analyzing editor layout...');
    const editorStructure = await page.evaluate(() => {
      // Look for common editor layout patterns
      const structure = {
        hasMainContainer: !!document.querySelector('[class*="editor"], [class*="workspace"], [class*="layout"]'),
        hasSidebar: !!document.querySelector('[class*="sidebar"], [class*="panel"], [class*="tree"]'),
        hasMainArea: !!document.querySelector('[class*="main"], [class*="content"], [class*="editor-main"]'),
        hasPreviewArea: !!document.querySelector('[class*="preview"], [class*="view"], iframe'),
        totalDivs: document.querySelectorAll('div').length,
        totalColumns: document.querySelectorAll('[class*="col"], [class*="column"], [class*="pane"]').length,
        hasGridLayout: !!document.querySelector('[style*="grid"], [class*="grid"]'),
        hasFlexLayout: !!document.querySelector('[style*="flex"], [class*="flex"]'),
        hasSplitter: !!document.querySelector('[class*="split"], [class*="resize"], [class*="gutter"]')
      };

      // Check for specific editor components
      const components = {
        fileTree: !!document.querySelector('[class*="file-tree"], [class*="explorer"], [data-testid*="file"]'),
        codeEditor: !!document.querySelector('[class*="monaco"], [class*="editor"], [class*="code"]'),
        tabs: !!document.querySelector('[class*="tab"], [role="tab"]'),
        toolbar: !!document.querySelector('[class*="toolbar"], [class*="menu"]'),
        statusBar: !!document.querySelector('[class*="status"], [class*="footer"]'),
        minimap: !!document.querySelector('[class*="minimap"], [class*="overview"]')
      };

      // Look at the DOM structure more carefully
      const bodyStructure = {
        directChildren: Array.from(document.body.children).map(child => ({
          tagName: child.tagName,
          className: child.className,
          id: child.id,
          hasChildren: child.children.length > 0,
          childCount: child.children.length
        })),
        bodyText: document.body.innerText.slice(0, 500)
      };

      // Check for any hidden elements that might be the editor
      const hiddenElements = Array.from(document.querySelectorAll('[style*="display: none"], [hidden]')).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id
      }));

      return {
        structure,
        components,
        bodyStructure,
        hiddenElements,
        title: document.title,
        currentUrl: window.location.href
      };
    });

    console.log('🏗️ Editor Structure Analysis:');
    console.log('Layout Structure:');
    console.log(`  - Main container: ${editorStructure.structure.hasMainContainer}`);
    console.log(`  - Sidebar: ${editorStructure.structure.hasSidebar}`);
    console.log(`  - Main area: ${editorStructure.structure.hasMainArea}`);
    console.log(`  - Preview area: ${editorStructure.structure.hasPreviewArea}`);
    console.log(`  - Total divs: ${editorStructure.structure.totalDivs}`);
    console.log(`  - Columns/panes: ${editorStructure.structure.totalColumns}`);
    console.log(`  - Grid layout: ${editorStructure.structure.hasGridLayout}`);
    console.log(`  - Flex layout: ${editorStructure.structure.hasFlexLayout}`);
    console.log(`  - Splitter: ${editorStructure.structure.hasSplitter}`);

    console.log('\nEditor Components:');
    console.log(`  - File tree: ${editorStructure.components.fileTree}`);
    console.log(`  - Code editor: ${editorStructure.components.codeEditor}`);
    console.log(`  - Tabs: ${editorStructure.components.tabs}`);
    console.log(`  - Toolbar: ${editorStructure.components.toolbar}`);
    console.log(`  - Status bar: ${editorStructure.components.statusBar}`);
    console.log(`  - Minimap: ${editorStructure.components.minimap}`);

    console.log('\nDOM Structure:');
    editorStructure.bodyStructure.directChildren.forEach((child, i) => {
      console.log(`  ${i + 1}. <${child.tagName}> class="${child.className}" id="${child.id}" (${child.childCount} children)`);
    });

    if (editorStructure.hiddenElements.length > 0) {
      console.log('\nHidden Elements:');
      editorStructure.hiddenElements.forEach((el, i) => {
        console.log(`  ${i + 1}. <${el.tagName}> class="${el.className}" id="${el.id}"`);
      });
    }

    // Try clicking around to see if there are hidden elements that appear
    console.log('\n4. Testing for interactive elements...');

    // Look for any loading states or elements that might reveal the editor
    const loadingElements = await page.$$('[class*="loading"], [class*="spinner"], [aria-busy="true"]');
    if (loadingElements.length > 0) {
      console.log(`Found ${loadingElements.length} loading elements - waiting for them to finish...`);
      await page.waitForTimeout(5000);
    }

    // Try right-clicking to see if there's a context menu
    await page.click('body', { button: 'right' });
    await page.waitForTimeout(1000);

    // Check if any new elements appeared
    const afterInteraction = await page.evaluate(() => {
      return {
        newElements: document.querySelectorAll('[style*="display: block"], [class*="show"], [class*="visible"]').length,
        contextMenu: !!document.querySelector('[class*="context"], [class*="menu"], [role="menu"]')
      };
    });

    console.log(`After interaction - New elements: ${afterInteraction.newElements}, Context menu: ${afterInteraction.contextMenu}`);

    // Final screenshot
    await page.screenshot({
      path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\editor-final.png',
      fullPage: true
    });

    // Check the network requests to understand what the editor is trying to load
    console.log('\n5. Testing connection retry...');
    const retryButton = await page.$('button:has-text("Try Again")');
    if (retryButton) {
      console.log('Found Try Again button - testing connection retry...');

      // Listen for network requests
      const requests = [];
      page.on('request', request => {
        if (request.url().includes('api') || request.url().includes('ftp')) {
          requests.push({
            url: request.url(),
            method: request.method(),
            headers: Object.fromEntries(Object.entries(request.headers()).filter(([key]) =>
              ['authorization', 'content-type', 'accept'].includes(key.toLowerCase())
            ))
          });
        }
      });

      await retryButton.click();
      await page.waitForTimeout(5000);

      console.log('API/FTP Requests made:');
      requests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.url}`);
        if (req.headers.authorization) {
          console.log(`     Auth: ${req.headers.authorization.substring(0, 20)}...`);
        }
      });

      // Screenshot after retry
      await page.screenshot({
        path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\after-retry.png',
        fullPage: true
      });
    }

    console.log(`\n📄 Page content:\n"${editorStructure.bodyStructure.bodyText}"`);

  } catch (error) {
    console.log(`❌ Error during analysis: ${error.message}`);
    await page.screenshot({
      path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\analysis-error.png',
      fullPage: true
    });
  }

  await browser.close();
  console.log('\n✅ Editor structure analysis complete!');
}

testEditorStructure().catch(console.error);