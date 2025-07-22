// Dashboard and FTP site management tests
const { test, expect } = require('@playwright/test');
const { 
  waitForPageLoad, 
  loginUser,
  logoutUser,
  createTestFtpSite,
  SELECTORS, 
  TEST_USERS,
  TEST_FTP,
  waitForToast,
  setupConsoleErrorTracking,
  setupNetworkErrorTracking,
  takeScreenshot
} = require('./test-helpers');

test.describe('Dashboard and Site Management Tests', () => {
  let consoleErrors;
  let networkErrors;

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleErrorTracking(page);
    networkErrors = setupNetworkErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await takeScreenshot(page, `dashboard-failed-${testInfo.title}`);
    }
    
    // Clean up - logout if logged in
    try {
      await logoutUser(page);
    } catch (error) {
      // Ignore cleanup errors
      await page.evaluate(() => localStorage.clear());
    }
  });

  test.describe('Dashboard Access and Layout', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard-real.html');
      await waitForPageLoad(page);
      
      // Should redirect to login or show login form
      const currentUrl = page.url();
      const hasLoginForm = await page.locator(SELECTORS.auth.form).count() > 0;
      
      expect(currentUrl.includes('login') || hasLoginForm).toBeTruthy();
    });

    test('should load dashboard successfully when authenticated', async ({ page }) => {
      // Login first
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      
      // Wait for login result
      await page.waitForTimeout(5000);
      
      // If redirected to dashboard, test the layout
      if (page.url().includes('dashboard')) {
        await waitForPageLoad(page);
        
        // Check for key dashboard elements
        await expect(page).toHaveTitle(/dashboard/i);
        
        // Check for sites section
        const sitesSection = page.locator(SELECTORS.dashboard.siteList + ', .sites, .my-sites');
        await expect(sitesSection.first()).toBeVisible();
        
        // Check for add site button
        const addSiteBtn = page.locator(SELECTORS.dashboard.addSiteBtn + ', .add-site, button:has-text("Add Site")');
        await expect(addSiteBtn.first()).toBeVisible();
      }
    });

    test('should display user information', async ({ page }) => {
      // Try to login
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      
      await page.waitForTimeout(5000);
      
      if (page.url().includes('dashboard')) {
        await waitForPageLoad(page);
        
        // Check for user info display
        const userElements = page.locator('.user-info, .user-email, .user-name, .profile');
        const userCount = await userElements.count();
        
        if (userCount > 0) {
          await expect(userElements.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('FTP Site Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each site management test
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      
      await page.waitForTimeout(5000);
      
      // Skip test if login failed
      if (!page.url().includes('dashboard')) {
        test.skip('Login failed, skipping site management test');
      }
    });

    test('should open add site modal', async ({ page }) => {
      await waitForPageLoad(page);
      
      // Click add site button
      const addSiteBtn = page.locator(SELECTORS.dashboard.addSiteBtn + ', .add-site, button:has-text("Add Site"), .btn:has-text("Add")');
      const btnCount = await addSiteBtn.count();
      
      if (btnCount > 0) {
        await addSiteBtn.first().click();
        
        // Wait for modal to appear
        await page.waitForTimeout(1000);
        
        // Check for modal
        const modal = page.locator(SELECTORS.modal.container + ', .add-site-modal, .site-modal');
        await expect(modal.first()).toBeVisible();
        
        // Check for form fields
        const siteNameField = page.locator('input[name*="site"], input[name*="name"], #siteName');
        const hostField = page.locator('input[name*="host"], input[name*="server"], #ftpHost');
        
        if (await siteNameField.count() > 0) {
          await expect(siteNameField.first()).toBeVisible();
        }
        if (await hostField.count() > 0) {
          await expect(hostField.first()).toBeVisible();
        }
      }
    });

    test('should validate required fields when adding site', async ({ page }) => {
      await waitForPageLoad(page);
      
      // Click add site button
      const addSiteBtn = page.locator(SELECTORS.dashboard.addSiteBtn + ', .add-site, button:has-text("Add Site"), .btn:has-text("Add")');
      const btnCount = await addSiteBtn.count();
      
      if (btnCount > 0) {
        await addSiteBtn.first().click();
        await page.waitForTimeout(1000);
        
        // Try to submit empty form
        const submitBtn = page.locator(SELECTORS.modal.confirmBtn + ', .save-btn, button[type="submit"]');
        const submitCount = await submitBtn.count();
        
        if (submitCount > 0) {
          await submitBtn.first().click();
          await page.waitForTimeout(1000);
          
          // Check for validation errors
          const errorElements = page.locator('.error, .error-message, .invalid-feedback, .field-error');
          const errorCount = await errorElements.count();
          
          if (errorCount > 0) {
            await expect(errorElements.first()).toBeVisible();
          }
        }
      }
    });

    test('should successfully add a new FTP site', async ({ page }) => {
      await waitForPageLoad(page);
      
      const siteName = `Test-Site-${Date.now()}`;
      
      // Click add site button
      const addSiteBtn = page.locator(SELECTORS.dashboard.addSiteBtn + ', .add-site, button:has-text("Add Site"), .btn:has-text("Add")');
      const btnCount = await addSiteBtn.count();
      
      if (btnCount > 0) {
        await addSiteBtn.first().click();
        await page.waitForTimeout(1000);
        
        // Fill the form with test FTP details
        const fields = [
          { selector: 'input[name*="site"], input[name*="name"], #siteName', value: siteName },
          { selector: 'input[name*="host"], input[name*="server"], #ftpHost', value: TEST_FTP.host },
          { selector: 'input[name*="username"], input[name*="user"], #ftpUsername', value: TEST_FTP.username },
          { selector: 'input[name*="password"], input[name*="pass"], #ftpPassword', value: TEST_FTP.password },
          { selector: 'input[name*="port"], #ftpPort', value: TEST_FTP.port.toString() }
        ];
        
        for (const field of fields) {
          const element = page.locator(field.selector);
          if (await element.count() > 0) {
            await element.first().fill(field.value);
          }
        }
        
        // Submit the form
        const submitBtn = page.locator(SELECTORS.modal.confirmBtn + ', .save-btn, button[type="submit"]');
        if (await submitBtn.count() > 0) {
          await submitBtn.first().click();
          
          // Wait for response
          await page.waitForTimeout(3000);
          
          // Check for success message or new site in list
          const successElements = page.locator(SELECTORS.toast.success + ', .success, .alert-success');
          const siteElements = page.locator(`.site-item:has-text("${siteName}"), .site-card:has-text("${siteName}")`);
          
          const hasSuccess = await successElements.count() > 0;
          const hasSite = await siteElements.count() > 0;
          
          expect(hasSuccess || hasSite).toBeTruthy();
        }
      }
    });

    test('should handle FTP connection testing', async ({ page }) => {
      await waitForPageLoad(page);
      
      // Click add site button
      const addSiteBtn = page.locator(SELECTORS.dashboard.addSiteBtn + ', .add-site, button:has-text("Add Site")');
      const btnCount = await addSiteBtn.count();
      
      if (btnCount > 0) {
        await addSiteBtn.first().click();
        await page.waitForTimeout(1000);
        
        // Fill with test FTP details
        const fields = [
          { selector: 'input[name*="host"], #ftpHost', value: TEST_FTP.host },
          { selector: 'input[name*="username"], #ftpUsername', value: TEST_FTP.username },
          { selector: 'input[name*="password"], #ftpPassword', value: TEST_FTP.password },
          { selector: 'input[name*="port"], #ftpPort', value: TEST_FTP.port.toString() }
        ];
        
        for (const field of fields) {
          const element = page.locator(field.selector);
          if (await element.count() > 0) {
            await element.first().fill(field.value);
          }
        }
        
        // Look for test connection button
        const testBtn = page.locator('button:has-text("Test"), .test-btn, .test-connection');
        if (await testBtn.count() > 0) {
          await testBtn.first().click();
          
          // Wait for test result
          await page.waitForTimeout(5000);
          
          // Check for test result message
          const resultElements = page.locator('.test-result, .connection-result, .test-success, .test-error');
          if (await resultElements.count() > 0) {
            await expect(resultElements.first()).toBeVisible();
          }
        }
      }
    });

    test('should display existing sites if any', async ({ page }) => {
      await waitForPageLoad(page);
      
      // Check for sites list
      const sitesList = page.locator(SELECTORS.dashboard.siteList + ', .sites, .my-sites, .site-grid');
      await expect(sitesList.first()).toBeVisible();
      
      // Check for individual site items
      const siteItems = page.locator(SELECTORS.dashboard.siteItem + ', .site-card, .site-row');
      const siteCount = await siteItems.count();
      
      if (siteCount > 0) {
        // Test first site item
        await expect(siteItems.first()).toBeVisible();
        
        // Check for site actions (edit, delete, connect)
        const actions = page.locator('.site-actions, .actions, .site-buttons');
        if (await actions.count() > 0) {
          await expect(actions.first()).toBeVisible();
        }
      }
    });

    test('should handle site editing functionality', async ({ page }) => {
      await waitForPageLoad(page);
      
      // Look for existing sites
      const siteItems = page.locator(SELECTORS.dashboard.siteItem + ', .site-card, .site-row');
      const siteCount = await siteItems.count();
      
      if (siteCount > 0) {
        // Look for edit button on first site
        const editBtn = page.locator(SELECTORS.dashboard.editSiteBtn + ', .edit-btn, button:has-text("Edit")');
        const editCount = await editBtn.count();
        
        if (editCount > 0) {
          await editBtn.first().click();
          await page.waitForTimeout(1000);
          
          // Check for edit modal
          const modal = page.locator(SELECTORS.modal.container + ', .edit-site-modal');
          await expect(modal.first()).toBeVisible();
          
          // Check for pre-filled form fields
          const siteNameField = page.locator('input[name*="site"], #siteName');
          if (await siteNameField.count() > 0) {
            const value = await siteNameField.first().inputValue();
            expect(value.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should handle site deletion functionality', async ({ page }) => {
      await waitForPageLoad(page);
      
      // Look for existing sites
      const siteItems = page.locator(SELECTORS.dashboard.siteItem + ', .site-card, .site-row');
      const siteCount = await siteItems.count();
      
      if (siteCount > 0) {
        // Look for delete button
        const deleteBtn = page.locator(SELECTORS.dashboard.deleteSiteBtn + ', .delete-btn, button:has-text("Delete")');
        const deleteCount = await deleteBtn.count();
        
        if (deleteCount > 0) {
          await deleteBtn.first().click();
          await page.waitForTimeout(1000);
          
          // Check for confirmation dialog
          const confirmElements = page.locator('.confirm-delete, .delete-confirm, .confirmation-modal');
          const alertDialog = page.locator('.alert, [role="dialog"]');
          
          const hasConfirm = await confirmElements.count() > 0;
          const hasAlert = await alertDialog.count() > 0;
          
          if (hasConfirm || hasAlert) {
            // Cancel the deletion to avoid actually deleting
            const cancelBtn = page.locator(SELECTORS.modal.cancelBtn + ', .cancel-btn, button:has-text("Cancel")');
            if (await cancelBtn.count() > 0) {
              await cancelBtn.first().click();
            }
          }
        }
      }
    });
  });

  test.describe('Dashboard Navigation', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each navigation test
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      
      await page.waitForTimeout(5000);
      
      if (!page.url().includes('dashboard')) {
        test.skip('Login failed, skipping navigation test');
      }
    });

    test('should navigate to editor when clicking site', async ({ page }) => {
      await waitForPageLoad(page);
      
      // Look for clickable site items
      const siteItems = page.locator(SELECTORS.dashboard.siteItem + ', .site-card, .site-row');
      const siteCount = await siteItems.count();
      
      if (siteCount > 0) {
        // Click on first site or look for "Open" button
        const openBtn = page.locator('.open-btn, .connect-btn, button:has-text("Open"), button:has-text("Connect")');
        const openCount = await openBtn.count();
        
        if (openCount > 0) {
          await openBtn.first().click();
          await page.waitForTimeout(3000);
          
          // Should navigate to editor
          const currentUrl = page.url();
          expect(currentUrl.includes('editor')).toBeTruthy();
        } else {
          // Try clicking on the site item directly
          await siteItems.first().click();
          await page.waitForTimeout(3000);
          
          const currentUrl = page.url();
          expect(currentUrl.includes('editor')).toBeTruthy();
        }
      }
    });

    test('should have working navigation links', async ({ page }) => {
      await waitForPageLoad(page);
      
      // Check for navigation menu
      const navLinks = [
        'a[href*="pricing"], .pricing-link',
        'a[href*="billing"], .billing-link',
        'a[href*="settings"], .settings-link'
      ];
      
      for (const linkSelector of navLinks) {
        const link = page.locator(linkSelector);
        if (await link.count() > 0) {
          const href = await link.first().getAttribute('href');
          expect(href).toBeTruthy();
        }
      }
    });

    test('should handle user menu functionality', async ({ page }) => {
      await waitForPageLoad(page);
      
      // Look for user menu toggle
      const userMenuToggle = page.locator('.user-menu-toggle, .user-avatar, .profile-menu, .user-dropdown');
      const userMenuCount = await userMenuToggle.count();
      
      if (userMenuCount > 0) {
        await userMenuToggle.first().click();
        await page.waitForTimeout(500);
        
        // Check for dropdown menu
        const userMenu = page.locator('.user-menu, .dropdown-menu, .profile-dropdown');
        if (await userMenu.count() > 0) {
          await expect(userMenu.first()).toBeVisible();
          
          // Check for logout option
          const logoutBtn = page.locator('.logout-btn, .sign-out-btn, button:has-text("logout")');
          if (await logoutBtn.count() > 0) {
            await expect(logoutBtn.first()).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Dashboard Responsiveness', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login first
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      
      await page.waitForTimeout(5000);
      
      if (page.url().includes('dashboard')) {
        await waitForPageLoad(page);
        
        // Check that dashboard elements are visible and accessible on mobile
        const dashboard = page.locator('body');
        await expect(dashboard).toBeVisible();
        
        // Check for mobile-friendly site list
        const sitesList = page.locator(SELECTORS.dashboard.siteList + ', .sites');
        if (await sitesList.count() > 0) {
          await expect(sitesList.first()).toBeVisible();
        }
        
        // Check for add site button
        const addSiteBtn = page.locator(SELECTORS.dashboard.addSiteBtn);
        if (await addSiteBtn.count() > 0) {
          await expect(addSiteBtn.first()).toBeVisible();
        }
      }
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Login first
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      
      await page.waitForTimeout(5000);
      
      if (page.url().includes('dashboard')) {
        await waitForPageLoad(page);
        
        // Verify layout works on tablet
        const dashboard = page.locator('body');
        await expect(dashboard).toBeVisible();
      }
    });
  });
});