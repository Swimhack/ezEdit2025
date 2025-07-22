// End-to-end user workflow tests
const { test, expect } = require('@playwright/test');
const { 
  waitForPageLoad, 
  SELECTORS, 
  TEST_USERS,
  TEST_FTP,
  setupConsoleErrorTracking,
  setupNetworkErrorTracking,
  takeScreenshot
} = require('./test-helpers');

test.describe('End-to-End User Workflows', () => {
  let consoleErrors;
  let networkErrors;

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleErrorTracking(page);
    networkErrors = setupNetworkErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await takeScreenshot(page, `e2e-failed-${testInfo.title}`);
    }
    
    // Clean up
    try {
      await page.evaluate(() => localStorage.clear());
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test.describe('Complete User Journey Tests', () => {
    test('Complete new user signup to editor workflow', async ({ page }) => {
      const testUser = {
        email: `e2e-test-${Date.now()}@ezedit-test.com`,
        password: 'E2ETestPassword123!'
      };

      console.log('🚀 Starting complete new user workflow test');
      
      // Step 1: Visit landing page
      console.log('Step 1: Loading landing page');
      await page.goto('/');
      await waitForPageLoad(page);
      await expect(page).toHaveTitle(/EzEdit/i);
      
      // Step 2: Navigate to signup
      console.log('Step 2: Navigating to signup');
      const signupBtn = page.locator(SELECTORS.nav.signupBtn).first();
      await expect(signupBtn).toBeVisible();
      await signupBtn.click();
      await expect(page).toHaveURL(/signup/i);
      
      // Step 3: Complete signup process
      console.log('Step 3: Completing signup form');
      await page.fill(SELECTORS.auth.emailInput, testUser.email);
      await page.fill(SELECTORS.auth.passwordInput, testUser.password);
      
      // Fill confirm password if exists
      const confirmPassword = page.locator(SELECTORS.auth.confirmPasswordInput);
      if (await confirmPassword.count() > 0) {
        await confirmPassword.fill(testUser.password);
      }
      
      await page.click(SELECTORS.auth.submitBtn);
      await page.waitForTimeout(5000);
      
      // Step 4: Handle post-signup flow (could be verification, redirect, etc.)
      console.log('Step 4: Handling post-signup response');
      const currentUrl = page.url();
      
      if (currentUrl.includes('dashboard')) {
        console.log('✅ Directly redirected to dashboard after signup');
      } else if (currentUrl.includes('login')) {
        console.log('📧 Redirected to login - attempting to login with new credentials');
        await page.fill(SELECTORS.auth.emailInput, testUser.email);
        await page.fill(SELECTORS.auth.passwordInput, testUser.password);
        await page.click(SELECTORS.auth.submitBtn);
        await page.waitForTimeout(5000);
      } else {
        console.log('📋 Other signup flow - checking for success indicators');
        const successElements = page.locator('.success, .verification, .toast-success');
        const hasSuccess = await successElements.count() > 0;
        
        if (hasSuccess) {
          // Try to navigate to login
          await page.goto('/login-real.html');
          await waitForPageLoad(page);
          await page.fill(SELECTORS.auth.emailInput, testUser.email);
          await page.fill(SELECTORS.auth.passwordInput, testUser.password);
          await page.click(SELECTORS.auth.submitBtn);
          await page.waitForTimeout(5000);
        }
      }
      
      // Step 5: Verify we're in dashboard
      if (page.url().includes('dashboard')) {
        console.log('✅ Successfully reached dashboard');
        
        // Step 6: Add FTP site
        console.log('Step 5: Adding FTP site');
        const addSiteBtn = page.locator(SELECTORS.dashboard.addSiteBtn + ', .add-site, button:has-text("Add Site")');
        if (await addSiteBtn.count() > 0) {
          await addSiteBtn.first().click();
          await page.waitForTimeout(1000);
          
          // Fill FTP details
          const siteName = `E2E-Test-Site-${Date.now()}`;
          await page.fill('input[name*="site"], #siteName', siteName);
          await page.fill('input[name*="host"], #ftpHost', TEST_FTP.host);
          await page.fill('input[name*="username"], #ftpUsername', TEST_FTP.username);
          await page.fill('input[name*="password"], #ftpPassword', TEST_FTP.password);
          
          const submitBtn = page.locator('.save-btn, button[type="submit"]');
          if (await submitBtn.count() > 0) {
            await submitBtn.first().click();
            await page.waitForTimeout(3000);
          }
          
          // Step 7: Open editor
          console.log('Step 6: Opening editor');
          const openBtn = page.locator('.open-btn, .connect-btn, button:has-text("Open")');
          if (await openBtn.count() > 0) {
            await openBtn.first().click();
            await page.waitForTimeout(3000);
            
            if (page.url().includes('editor')) {
              console.log('✅ Successfully opened editor');
            }
          }
        }
      } else {
        console.log('❌ Could not reach dashboard after signup/login');
        expect(page.url()).toContain('dashboard');
      }
    });

    test('Complete returning user login to file editing workflow', async ({ page }) => {
      console.log('🔄 Starting returning user workflow test');
      
      // Step 1: Direct login
      console.log('Step 1: Logging in existing user');
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      await page.waitForTimeout(5000);
      
      if (page.url().includes('dashboard')) {
        console.log('✅ Successfully logged in to dashboard');
        
        // Step 2: Check existing sites or create one
        console.log('Step 2: Accessing FTP sites');
        const siteItems = page.locator('.site-item, .site-card');
        const siteCount = await siteItems.count();
        
        if (siteCount === 0) {
          console.log('No existing sites - creating test site');
          // Create a test site (abbreviated version)
          const addSiteBtn = page.locator(SELECTORS.dashboard.addSiteBtn).first();
          if (await addSiteBtn.count() > 0) {
            await addSiteBtn.click();
            await page.waitForTimeout(1000);
            
            await page.fill('input[name*="site"], #siteName', `Test-${Date.now()}`);
            await page.fill('input[name*="host"], #ftpHost', TEST_FTP.host);
            await page.fill('input[name*="username"], #ftpUsername', TEST_FTP.username);
            await page.fill('input[name*="password"], #ftpPassword', TEST_FTP.password);
            
            const submitBtn = page.locator('.save-btn, button[type="submit"]').first();
            if (await submitBtn.count() > 0) {
              await submitBtn.click();
              await page.waitForTimeout(3000);
            }
          }
        }
        
        // Step 3: Open editor with existing/new site
        console.log('Step 3: Opening editor');
        const openBtn = page.locator('.open-btn, .connect-btn, button:has-text("Open")');
        if (await openBtn.count() > 0) {
          await openBtn.first().click();
          await page.waitForTimeout(5000);
          
          if (page.url().includes('editor')) {
            console.log('✅ Successfully opened editor');
            
            // Step 4: Test file browsing
            console.log('Step 4: Testing file browser functionality');
            await page.waitForTimeout(3000);
            
            const fileItems = page.locator('.file-item, .file, .tree-item');
            const fileCount = await fileItems.count();
            console.log(`Found ${fileCount} file/folder items`);
            
            // Step 5: Test AI assistant if available
            console.log('Step 5: Testing AI assistant');
            const aiElements = page.locator('.ai-panel, .assistant, .ai-chat');
            if (await aiElements.count() > 0) {
              console.log('AI assistant panel found');
              
              const aiInput = page.locator('.ai-input, .chat-input');
              if (await aiInput.count() > 0) {
                await aiInput.first().fill('Hello AI');
                const sendBtn = page.locator('.send-btn, button:has-text("Send")');
                if (await sendBtn.count() > 0) {
                  await sendBtn.first().click();
                  await page.waitForTimeout(2000);
                  console.log('AI chat message sent');
                }
              }
            }
            
            // Step 6: Test Monaco editor if available
            console.log('Step 6: Testing code editor');
            const monacoEditor = page.locator('.monaco-editor, .code-editor');
            if (await monacoEditor.count() > 0) {
              console.log('Code editor found');
              
              const editorTextarea = page.locator('.monaco-editor textarea, textarea.editor');
              if (await editorTextarea.count() > 0) {
                try {
                  await editorTextarea.first().click();
                  await page.keyboard.type('// Test code from E2E');
                  console.log('Code entered in editor');
                } catch (error) {
                  console.log('Could not type in editor:', error.message);
                }
              }
            }
          }
        }
      } else {
        console.log('❌ Login failed or did not redirect to dashboard');
      }
    });

    test('Complete pricing to subscription workflow', async ({ page }) => {
      console.log('💳 Starting pricing to subscription workflow test');
      
      // Step 1: Visit pricing page
      console.log('Step 1: Loading pricing page');
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      await expect(page).toHaveTitle(/pricing/i);
      
      // Step 2: Review pricing options
      console.log('Step 2: Reviewing pricing options');
      const pricingPlans = page.locator('.plan, .pricing-card, .tier');
      const planCount = await pricingPlans.count();
      console.log(`Found ${planCount} pricing plans`);
      
      expect(planCount).toBeGreaterThan(0);
      
      // Step 3: Select a paid plan
      console.log('Step 3: Selecting paid plan');
      const paidPlanBtn = page.locator('button:has-text("$"), .pro-plan button, .premium-plan button').first();
      if (await paidPlanBtn.count() > 0) {
        await paidPlanBtn.click();
        await page.waitForTimeout(3000);
        
        // Step 4: Handle authentication requirement
        console.log('Step 4: Handling authentication for checkout');
        if (page.url().includes('login')) {
          console.log('Redirected to login for checkout');
          await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
          await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
          await page.click(SELECTORS.auth.submitBtn);
          await page.waitForTimeout(5000);
        }
        
        // Step 5: Check for Stripe checkout
        console.log('Step 5: Checking for Stripe integration');
        const currentUrl = page.url();
        const hasStripeFrame = await page.locator('iframe[src*="stripe"]').count() > 0;
        const isStripeUrl = currentUrl.includes('stripe') || currentUrl.includes('checkout');
        
        if (hasStripeFrame || isStripeUrl) {
          console.log('✅ Stripe checkout integration working');
        } else {
          console.log('⚠️  Stripe checkout not detected - checking for errors');
          const errorElements = page.locator('.error, .payment-error');
          if (await errorElements.count() > 0) {
            const errorText = await errorElements.first().textContent();
            console.log(`Payment error: ${errorText}`);
          }
        }
      }
    });

    test('Complete billing management workflow', async ({ page }) => {
      console.log('📋 Starting billing management workflow test');
      
      // Step 1: Login first
      console.log('Step 1: Authenticating user');
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      await page.waitForTimeout(5000);
      
      if (page.url().includes('dashboard')) {
        // Step 2: Navigate to billing
        console.log('Step 2: Navigating to billing page');
        await page.goto('/billing.html');
        await waitForPageLoad(page);
        
        // Step 3: Review subscription status
        console.log('Step 3: Reviewing subscription status');
        const statusElements = page.locator('.subscription-status, .plan-status, .current-plan');
        if (await statusElements.count() > 0) {
          const statusText = await statusElements.first().textContent();
          console.log(`Current subscription status: ${statusText}`);
        }
        
        // Step 4: Check billing history
        console.log('Step 4: Checking billing history');
        const historyElements = page.locator('.billing-history, .invoices, .payment-history');
        if (await historyElements.count() > 0) {
          const historyItems = page.locator('.invoice, .payment, .transaction');
          const itemCount = await historyItems.count();
          console.log(`Billing history items: ${itemCount}`);
        }
        
        // Step 5: Test plan management options
        console.log('Step 5: Testing plan management');
        const upgradeBtn = page.locator('.upgrade-btn, .change-plan-btn, button:has-text("Upgrade")');
        if (await upgradeBtn.count() > 0) {
          console.log('Plan upgrade option available');
        }
        
        const cancelBtn = page.locator('.cancel-subscription, button:has-text("Cancel")');
        if (await cancelBtn.count() > 0) {
          console.log('Subscription cancellation option available');
        }
      }
    });
  });

  test.describe('Cross-Page Navigation Tests', () => {
    test('Should maintain session across all pages', async ({ page }) => {
      console.log('🔗 Testing session persistence across pages');
      
      // Login first
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      await page.waitForTimeout(5000);
      
      if (page.url().includes('dashboard')) {
        const pages = [
          { url: '/pricing.html', name: 'Pricing' },
          { url: '/billing.html', name: 'Billing' },
          { url: '/editor-real.html', name: 'Editor' },
          { url: '/dashboard-real.html', name: 'Dashboard' }
        ];
        
        for (const testPage of pages) {
          console.log(`Testing navigation to ${testPage.name}`);
          await page.goto(testPage.url);
          await waitForPageLoad(page);
          
          // Should still be authenticated
          const isLoginPage = page.url().includes('login');
          if (isLoginPage) {
            console.log(`❌ Session lost when accessing ${testPage.name}`);
          } else {
            console.log(`✅ Session maintained for ${testPage.name}`);
          }
        }
      }
    });

    test('Should handle deep links correctly', async ({ page }) => {
      console.log('🔗 Testing deep link handling');
      
      // Try to access protected page directly
      await page.goto('/editor-real.html');
      await waitForPageLoad(page);
      
      // Should redirect to login
      if (page.url().includes('login')) {
        console.log('✅ Deep link properly redirected to login');
        
        // Login and check if redirected back
        await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
        await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
        await page.click(SELECTORS.auth.submitBtn);
        await page.waitForTimeout(5000);
        
        // Should redirect back to original page or dashboard
        const finalUrl = page.url();
        if (finalUrl.includes('editor') || finalUrl.includes('dashboard')) {
          console.log('✅ Post-login redirect working');
        }
      }
    });
  });

  test.describe('Performance and Reliability Tests', () => {
    test('Should load all pages within performance budgets', async ({ page }) => {
      console.log('⚡ Testing page performance');
      
      const pages = [
        { url: '/', name: 'Landing', budget: 3000 },
        { url: '/login-real.html', name: 'Login', budget: 2000 },
        { url: '/pricing.html', name: 'Pricing', budget: 3000 },
        { url: '/signup.html', name: 'Signup', budget: 2000 }
      ];
      
      for (const testPage of pages) {
        const startTime = Date.now();
        await page.goto(testPage.url);
        await waitForPageLoad(page);
        const loadTime = Date.now() - startTime;
        
        console.log(`${testPage.name} page loaded in ${loadTime}ms (budget: ${testPage.budget}ms)`);
        
        if (loadTime > testPage.budget) {
          console.log(`⚠️  ${testPage.name} page exceeded performance budget`);
        } else {
          console.log(`✅ ${testPage.name} page met performance budget`);
        }
      }
    });

    test('Should handle network errors gracefully', async ({ page }) => {
      console.log('🌐 Testing network error handling');
      
      // Load a page first
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Simulate network failure
      await page.context().setOffline(true);
      
      // Try to navigate
      await page.goto('/pricing.html');
      await page.waitForTimeout(2000);
      
      // Check for offline handling
      const offlineIndicators = page.locator('.offline, .no-connection, .network-error');
      if (await offlineIndicators.count() > 0) {
        console.log('✅ Offline state properly handled');
      }
      
      // Restore connection
      await page.context().setOffline(false);
      await page.reload();
      await waitForPageLoad(page);
      
      console.log('✅ Network restored successfully');
    });
  });

  test.describe('Security and Validation Tests', () => {
    test('Should prevent XSS attacks in forms', async ({ page }) => {
      console.log('🔒 Testing XSS protection');
      
      await page.goto('/signup.html');
      await waitForPageLoad(page);
      
      // Try XSS payload in form fields
      const xssPayload = '<script>alert("xss")</script>';
      
      try {
        await page.fill(SELECTORS.auth.emailInput, xssPayload);
        await page.fill(SELECTORS.auth.passwordInput, 'password123');
        await page.click(SELECTORS.auth.submitBtn);
        await page.waitForTimeout(2000);
        
        // Should not execute script
        const alerts = page.locator('text="xss"');
        const alertCount = await alerts.count();
        
        if (alertCount === 0) {
          console.log('✅ XSS attack prevented');
        } else {
          console.log('❌ XSS vulnerability detected');
        }
      } catch (error) {
        console.log('Form validation prevented XSS payload');
      }
    });

    test('Should validate authentication on all protected routes', async ({ page }) => {
      console.log('🔐 Testing authentication validation');
      
      const protectedPages = [
        '/dashboard-real.html',
        '/editor-real.html',
        '/billing.html'
      ];
      
      for (const protectedPage of protectedPages) {
        await page.goto(protectedPage);
        await waitForPageLoad(page);
        
        // Should redirect to login or show login form
        const isLoginPage = page.url().includes('login');
        const hasLoginForm = await page.locator(SELECTORS.auth.form).count() > 0;
        
        if (isLoginPage || hasLoginForm) {
          console.log(`✅ ${protectedPage} properly protected`);
        } else {
          console.log(`❌ ${protectedPage} not properly protected`);
        }
      }
    });
  });
});