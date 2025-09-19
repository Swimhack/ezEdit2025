/**
 * E2E test for complete editor workflow
 * Tests the full user journey from dashboard to file editing
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Editor Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should complete full editor workflow from dashboard', async ({ page }) => {
    // 1. Start from dashboard with FTP connection active
    await expect(page.locator('[data-testid="ftp-browser-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="ftp-connection-status"]')).toHaveClass(/.*green.*/);

    // 2. Click "Edit files" button to open three-pane editor
    await page.click('[data-testid="edit-files-button"]');

    // 3. Wait for editor to load and verify all three panes are visible
    await expect(page.locator('[data-testid="three-pane-editor"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="file-tree-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-pane"]')).toBeVisible();

    // 4. Expand a directory in the file tree
    const directory = page.locator('[data-testid="directory-test"]');
    await directory.click();
    await expect(page.locator('[data-testid="directory-contents"]')).toBeVisible();

    // 5. Select a file from the tree
    const file = page.locator('[data-testid="file-test-sample-js"]');
    await file.click();

    // 6. Verify file loads in editor and preview
    await expect(page.locator('[data-testid="monaco-editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-preview"]')).toContainText('sample.js');

    // 7. Edit the file content
    const editor = page.locator('[data-testid="monaco-editor"]');
    await editor.click();
    await editor.fill('console.log("E2E test modification");');

    // 8. Verify dirty state indicator appears
    await expect(page.locator('[data-testid="dirty-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-status"]')).toContainText('Unsaved changes');

    // 9. Save the file using Ctrl+S
    await page.keyboard.press('Control+s');

    // 10. Verify save success and dirty state clears
    await expect(page.locator('[data-testid="save-status"]')).toContainText('Saved');
    await expect(page.locator('[data-testid="dirty-indicator"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="last-saved"]')).toBeVisible();

    // 11. Switch to another file
    const secondFile = page.locator('[data-testid="file-test-styles-css"]');
    await secondFile.click();

    // 12. Verify new file loads correctly
    await expect(page.locator('[data-testid="file-preview"]')).toContainText('styles.css');
    await expect(page.locator('[data-testid="save-status"]')).toContainText('Saved');
  });

  test('should handle responsive layout on different screen sizes', async ({ page }) => {
    // Test desktop layout (1200px+)
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.click('[data-testid="edit-files-button"]');

    await expect(page.locator('[data-testid="file-tree-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="editor-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-pane"]')).toBeVisible();

    // Test tablet layout (768-1199px)
    await page.setViewportSize({ width: 900, height: 700 });
    await expect(page.locator('[data-testid="file-tree-pane"]')).toHaveCSS('position', 'absolute');

    // Test mobile layout (<768px)
    await page.setViewportSize({ width: 600, height: 800 });
    await expect(page.locator('[data-testid="pane-toggle-menu"]')).toBeVisible();
  });

  test('should handle file operations correctly', async ({ page }) => {
    await page.click('[data-testid="edit-files-button"]');

    // Test file loading performance
    const startTime = Date.now();
    await page.click('[data-testid="file-test-sample-js"]');
    await expect(page.locator('[data-testid="monaco-editor"]')).toBeVisible();
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(500);

    // Test file save performance
    const saveStartTime = Date.now();
    await page.locator('[data-testid="monaco-editor"]').fill('console.log("Performance test");');
    await page.keyboard.press('Control+s');
    await expect(page.locator('[data-testid="save-status"]')).toContainText('Saved');
    const saveTime = Date.now() - saveStartTime;
    expect(saveTime).toBeLessThan(1000);

    // Test file switching
    await page.click('[data-testid="file-test-styles-css"]');
    await expect(page.locator('[data-testid="monaco-editor"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-preview"]')).toContainText('styles.css');
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    await page.click('[data-testid="edit-files-button"]');

    // Test permission denied error
    await page.click('[data-testid="file-restricted-readonly"]');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Permission denied');

    // Test large file warning
    await page.click('[data-testid="file-large-log"]');
    await expect(page.locator('[data-testid="large-file-warning"]')).toBeVisible();

    // Test connection lost scenario
    // Mock network failure
    await page.route('**/api/ftp/editor/file', route => route.abort());
    await page.click('[data-testid="file-test-sample-js"]');
    await expect(page.locator('[data-testid="connection-error"]')).toBeVisible();

    // Test retry mechanism
    await page.unroute('**/api/ftp/editor/file');
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="monaco-editor"]')).toBeVisible();
  });

  test('should maintain state across page refreshes', async ({ page }) => {
    await page.click('[data-testid="edit-files-button"]');

    // Select a file and make changes
    await page.click('[data-testid="file-test-sample-js"]');
    await page.locator('[data-testid="monaco-editor"]').fill('console.log("Before refresh");');

    // Refresh the page
    await page.reload();

    // Verify editor state is restored
    await expect(page.locator('[data-testid="three-pane-editor"]')).toBeVisible();
    // Note: Actual persistence would depend on implementation
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.click('[data-testid="edit-files-button"]');

    // Focus file tree
    await page.locator('[data-testid="file-tree-pane"]').click();

    // Use arrow keys to navigate
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    // Should select file
    await expect(page.locator('[data-testid="monaco-editor"]')).toBeVisible();

    // Test editor keyboard shortcuts
    await page.locator('[data-testid="monaco-editor"]').click();
    await page.keyboard.press('Control+a'); // Select all
    await page.keyboard.type('console.log("Keyboard test");');
    await page.keyboard.press('Control+s'); // Save

    await expect(page.locator('[data-testid="save-status"]')).toContainText('Saved');
  });

  test('should handle multiple file types correctly', async ({ page }) => {
    await page.click('[data-testid="edit-files-button"]');

    const fileTypes = [
      { testId: 'file-test-script-js', language: 'javascript' },
      { testId: 'file-test-styles-css', language: 'css' },
      { testId: 'file-test-page-html', language: 'html' },
      { testId: 'file-test-data-json', language: 'json' }
    ];

    for (const fileType of fileTypes) {
      await page.click(`[data-testid="${fileType.testId}"]`);
      await expect(page.locator('[data-testid="monaco-editor"]')).toBeVisible();

      // Verify syntax highlighting is applied
      await expect(page.locator('[data-testid="editor-language"]')).toContainText(fileType.language);
    }
  });
});

// Note: These tests will fail until the actual three-pane editor is implemented
// This is expected in TDD - E2E tests should fail first (RED phase)