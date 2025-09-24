const { chromium } = require('playwright');

async function testEditFilesFunction() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log(`CONSOLE: ${msg.text()}`));
  page.on('pageerror', error => console.log(`PAGE ERROR: ${error.message}`));

  console.log('🎯 Testing Edit Files functionality...\n');

  try {
    // Navigate to dashboard
    console.log('1. Navigating to dashboard...');
    await page.goto('https://ezeditapp.fly.dev/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Look for the Edit Files button
    console.log('2. Looking for Edit Files button...');
    const editFilesButton = await page.$('button:has-text("Edit Files")');

    if (editFilesButton) {
      console.log('✅ Found Edit Files button!');

      // Take screenshot before clicking
      await page.screenshot({
        path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\before-edit-files.png',
        fullPage: true
      });

      // Click the Edit Files button
      console.log('3. Clicking Edit Files button...');
      await editFilesButton.click();

      // Wait for navigation/loading
      await page.waitForTimeout(3000);

      // Check what page we're on now
      const currentUrl = page.url();
      console.log(`4. Current URL after click: ${currentUrl}`);

      // Take screenshot of the editor
      await page.screenshot({
        path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\edit-files-page.png',
        fullPage: true
      });

      // Check for editor elements
      const editorElements = await page.evaluate(() => {
        const elements = {
          hasFileTree: !!document.querySelector('[class*="file"], [class*="tree"], [id*="file"], [id*="tree"], [data-testid*="file"]'),
          hasCodeEditor: !!document.querySelector('[class*="editor"], [class*="monaco"], textarea[rows], [contenteditable]'),
          hasPreview: !!document.querySelector('[class*="preview"], iframe'),
          hasThreePanes: document.querySelectorAll('[class*="pane"], [class*="panel"], [class*="column"], [class*="split"]').length >= 3,
          hasSplitter: !!document.querySelector('[class*="splitter"], [class*="resize"], [class*="gutter"]'),
          totalPanels: document.querySelectorAll('[class*="pane"], [class*="panel"], [class*="column"], [class*="split"]').length,
          title: document.title,
          bodyText: document.body.innerText.slice(0, 800)
        };

        // Look for file list elements
        const fileElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent || '';
          const classes = el.className || '';
          return (text.includes('.html') || text.includes('.css') || text.includes('.js') ||
                  text.includes('.php') || classes.includes('file') || classes.includes('directory'));
        });
        elements.hasFileList = fileElements.length > 0;
        elements.fileCount = fileElements.length;

        // Look for editor-specific UI elements
        const editorUI = {
          hasToolbar: !!document.querySelector('[class*="toolbar"], [class*="menu"], [role="toolbar"]'),
          hasStatusBar: !!document.querySelector('[class*="status"], [class*="footer"]'),
          hasLineNumbers: !!document.querySelector('[class*="line-number"], [class*="gutter"]'),
          hasTabs: !!document.querySelector('[class*="tab"], [role="tab"]')
        };
        elements.editorUI = editorUI;

        return elements;
      });

      console.log('🔍 Editor page analysis:');
      console.log(`  - Page title: "${editorElements.title}"`);
      console.log(`  - File tree/browser: ${editorElements.hasFileTree}`);
      console.log(`  - Code editor: ${editorElements.hasCodeEditor}`);
      console.log(`  - Preview pane: ${editorElements.hasPreview}`);
      console.log(`  - Three panes: ${editorElements.hasThreePanes} (${editorElements.totalPanels} panels found)`);
      console.log(`  - Splitter/resizer: ${editorElements.hasSplitter}`);
      console.log(`  - File list: ${editorElements.hasFileList} (${editorElements.fileCount} file elements)`);
      console.log(`  - Toolbar: ${editorElements.editorUI.hasToolbar}`);
      console.log(`  - Status bar: ${editorElements.editorUI.hasStatusBar}`);
      console.log(`  - Line numbers: ${editorElements.editorUI.hasLineNumbers}`);
      console.log(`  - Tabs: ${editorElements.editorUI.hasTabs}`);

      console.log(`\n📄 Page content preview:\n"${editorElements.bodyText}"`);

      // If this looks like an editor, test file loading
      if (editorElements.hasFileTree || editorElements.hasFileList || editorElements.hasCodeEditor) {
        console.log('\n🎯 This appears to be the editor! Testing file interactions...');

        // Look for clickable file elements
        const fileElements = await page.$$('[class*="file"]:not([class*="file-tree"]), li, [role="treeitem"]');
        console.log(`Found ${fileElements.length} potential file elements to click`);

        if (fileElements.length > 0) {
          // Try clicking the first few file elements
          for (let i = 0; i < Math.min(3, fileElements.length); i++) {
            try {
              const elementText = await fileElements[i].textContent();
              console.log(`Attempting to click file element ${i + 1}: "${elementText?.trim() || 'unnamed'}"`);

              await fileElements[i].click();
              await page.waitForTimeout(1000);

              // Check if code appeared in editor
              const hasCode = await page.evaluate(() => {
                const editors = document.querySelectorAll('textarea, [contenteditable], [class*="editor"]');
                return Array.from(editors).some(editor => (editor.value || editor.textContent || '').trim().length > 50);
              });

              if (hasCode) {
                console.log('✅ Code loaded in editor after clicking!');
                break;
              }
            } catch (error) {
              console.log(`Error clicking file element ${i + 1}: ${error.message}`);
            }
          }
        }

        // Look for directory/folder navigation
        const folders = await page.$$('[class*="folder"], [class*="directory"], [data-testid*="folder"]');
        if (folders.length > 0) {
          console.log(`Found ${folders.length} folder elements`);
        }

        // Test if we can navigate the file tree
        await page.waitForTimeout(2000);

        // Final screenshot after interactions
        await page.screenshot({
          path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\editor-after-interaction.png',
          fullPage: true
        });

      } else {
        console.log('❌ This does not appear to be the three-pane editor interface');
      }

    } else {
      console.log('❌ Edit Files button not found');

      // Try alternative selectors
      const alternatives = [
        'button:has-text("Edit")',
        'a:has-text("Edit Files")',
        '[data-testid*="edit"]',
        'button[title*="edit"]'
      ];

      for (const selector of alternatives) {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          console.log(`Found alternative: "${text}" with selector: ${selector}`);
        }
      }
    }

    // Also test the "View Files" button to see what it does
    console.log('\n5. Testing View Files button...');
    const viewFilesButton = await page.$('button:has-text("View Files")');
    if (viewFilesButton) {
      await viewFilesButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\view-files-page.png',
        fullPage: true
      });

      console.log(`View Files page URL: ${page.url()}`);
    }

  } catch (error) {
    console.log(`❌ Error during test: ${error.message}`);

    // Take error screenshot
    await page.screenshot({
      path: 'C:\\STRICKLAND\\Strickland Technology Marketing\\ezedit.co\\screenshots\\error-state.png',
      fullPage: true
    });
  }

  await browser.close();
  console.log('\n✅ Edit Files testing complete!');
}

testEditFilesFunction().catch(console.error);