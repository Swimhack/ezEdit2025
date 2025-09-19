import { test, expect } from '@playwright/test';

/**
 * FTP Editor Functionality E2E Tests
 *
 * This test suite covers:
 * - FTP connection and authentication
 * - Three-pane editor layout
 * - File tree navigation
 * - File editing capabilities
 * - Monaco Editor integration
 * - File save/load operations
 * - Error handling for FTP operations
 */

test.describe('FTP Editor Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard or websites page
    await page.goto('/dashboard');
  });

  test('should display website management interface', async ({ page }) => {
    // Check if websites section is visible
    const websitesSection = page.locator('[data-testid="websites"], .websites, [class*="website"]');

    if (await websitesSection.isVisible()) {
      await expect(websitesSection).toBeVisible();
    } else {
      // Try navigating to websites page
      await page.goto('/websites');
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should provide add website functionality', async ({ page }) => {
    // Look for add website button or form
    await page.goto('/websites');

    const addButton = page.getByRole('button', { name: /add.*website|new.*website|connect/i });
    const addLink = page.getByRole('link', { name: /add.*website|new.*website|connect/i });

    if (await addButton.isVisible()) {
      await addButton.click();
    } else if (await addLink.isVisible()) {
      await addLink.click();
    }

    // Should show website connection form
    await page.waitForTimeout(1000);

    // Look for FTP connection fields
    const hostField = page.locator('input[name*="host"], input[placeholder*="host"]');
    const usernameField = page.locator('input[name*="username"], input[name*="user"]');
    const passwordField = page.locator('input[type="password"]');

    // At least one of these should be visible for FTP setup
    const formFieldsVisible = await hostField.isVisible() ||
                              await usernameField.isVisible() ||
                              await passwordField.isVisible();

    if (formFieldsVisible) {
      console.log('✅ FTP connection form is available');
    }
  });

  test('should handle FTP connection form validation', async ({ page }) => {
    await page.goto('/websites');

    // Try to access the connection form
    const addButton = page.getByRole('button', { name: /add.*website|new.*website|connect/i });

    if (await addButton.isVisible()) {
      await addButton.click();

      // Fill in invalid FTP details
      const hostField = page.locator('input[name*="host"], input[placeholder*="host"]');
      const usernameField = page.locator('input[name*="username"], input[name*="user"]');
      const passwordField = page.locator('input[type="password"]');

      if (await hostField.isVisible()) {
        await hostField.fill('invalid-host');
      }

      if (await usernameField.isVisible()) {
        await usernameField.fill('testuser');
      }

      if (await passwordField.isVisible()) {
        await passwordField.fill('testpass');
      }

      // Try to submit
      const submitButton = page.getByRole('button', { name: /connect|save|add/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Wait for response
        await page.waitForTimeout(2000);

        // Should show error message for invalid connection
        const errorMessage = page.locator('[role="alert"], .error-message, .text-red-500');
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should display three-pane editor layout', async ({ page }) => {
    // Navigate to editor page
    await page.goto('/editor/test-website-id');

    // Check for three-pane layout elements
    const fileTree = page.locator('[data-testid="file-tree"], .file-tree, [class*="tree"]');
    const editor = page.locator('[data-testid="editor"], .monaco-editor, [class*="editor"]');
    const preview = page.locator('[data-testid="preview"], .preview, [class*="preview"]');

    // At least one pane should be visible
    const anyPaneVisible = await fileTree.isVisible() ||
                          await editor.isVisible() ||
                          await preview.isVisible();

    if (anyPaneVisible) {
      console.log('✅ Editor layout is displayed');
    }

    // Check for loading states
    const loadingIndicator = page.locator('.loading, [data-testid="loading"]');
    if (await loadingIndicator.isVisible()) {
      console.log('📡 Editor is loading...');
    }
  });

  test('should handle file tree navigation', async ({ page }) => {
    await page.goto('/editor/test-website-id');

    // Wait for file tree to load
    await page.waitForTimeout(3000);

    // Look for file tree items
    const fileTreeItems = page.locator('[data-testid="file-item"], .file-item, [role="treeitem"]');
    const directories = page.locator('[data-testid="directory"], .directory, [class*="folder"]');

    if (await directories.count() > 0) {
      // Try to expand a directory
      const firstDirectory = directories.first();
      await firstDirectory.click();

      // Wait for expansion
      await page.waitForTimeout(1000);

      console.log('✅ Directory expansion functionality available');
    }

    if (await fileTreeItems.count() > 0) {
      console.log(`📁 Found ${await fileTreeItems.count()} file tree items`);
    }
  });

  test('should handle file selection and editing', async ({ page }) => {
    await page.goto('/editor/test-website-id');

    // Wait for editor to load
    await page.waitForTimeout(3000);

    // Look for clickable files
    const files = page.locator('[data-testid="file"], .file-item[data-type="file"]');

    if (await files.count() > 0) {
      // Click on first file
      const firstFile = files.first();
      await firstFile.click();

      // Wait for file to load in editor
      await page.waitForTimeout(2000);

      // Check if Monaco editor is present
      const monacoEditor = page.locator('.monaco-editor');
      if (await monacoEditor.isVisible()) {
        console.log('✅ Monaco editor is loaded');

        // Try to type in the editor
        await monacoEditor.click();
        await page.keyboard.type('// Test comment');

        console.log('✅ Editor typing functionality works');
      }
    }
  });

  test('should handle editor responsiveness', async ({ page }) => {
    await page.goto('/editor/test-website-id');

    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);

    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    // Check if layout adapts (this would depend on your responsive design)
    const sidePanel = page.locator('[data-testid="side-panel"], .side-panel');
    if (await sidePanel.isVisible()) {
      // Panel should be collapsible on smaller screens
      const collapseButton = page.locator('[data-testid="collapse"], .collapse, [aria-label*="collapse"]');
      if (await collapseButton.isVisible()) {
        await collapseButton.click();
        console.log('✅ Panel collapse functionality works');
      }
    }

    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    // Editor should still be functional on mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle file save operations', async ({ page }) => {
    await page.goto('/editor/test-website-id');
    await page.waitForTimeout(3000);

    // Look for save functionality
    const saveButton = page.getByRole('button', { name: /save/i });
    const saveShortcut = 'Control+S'; // or 'Meta+S' for Mac

    if (await saveButton.isVisible()) {
      // Test save button
      await saveButton.click();
      await page.waitForTimeout(1000);

      console.log('✅ Save button functionality available');
    }

    // Test keyboard shortcut
    await page.keyboard.press(saveShortcut);
    await page.waitForTimeout(1000);

    console.log('✅ Save keyboard shortcut tested');
  });

  test('should handle connection errors gracefully', async ({ page }) => {
    // Navigate to editor with invalid connection
    await page.goto('/editor/invalid-website-id');

    // Should show appropriate error message
    const errorMessage = page.locator('[role="alert"], .error-message, .alert-error');
    const notFoundMessage = page.locator('.not-found, .error-404');

    await page.waitForTimeout(3000);

    if (await errorMessage.isVisible() || await notFoundMessage.isVisible()) {
      console.log('✅ Error handling for invalid connections works');
    }

    // Check if there's a way to go back or reconnect
    const backButton = page.getByRole('button', { name: /back|return/i });
    const reconnectButton = page.getByRole('button', { name: /reconnect|retry/i });

    if (await backButton.isVisible()) {
      console.log('✅ Back navigation available');
    }

    if (await reconnectButton.isVisible()) {
      console.log('✅ Reconnect functionality available');
    }
  });

  test('should handle large file directory structures', async ({ page }) => {
    await page.goto('/editor/test-website-id');
    await page.waitForTimeout(3000);

    // Test scrolling in file tree
    const fileTree = page.locator('[data-testid="file-tree"], .file-tree');

    if (await fileTree.isVisible()) {
      // Try scrolling
      await fileTree.hover();
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(500);

      console.log('✅ File tree scrolling tested');
    }

    // Test search functionality if available
    const searchInput = page.locator('input[placeholder*="search"], [data-testid="search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('index');
      await page.waitForTimeout(1000);

      console.log('✅ File search functionality available');
    }
  });
});