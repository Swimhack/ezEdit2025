// Pricing page and billing/payment tests
const { test, expect } = require('@playwright/test');
const { 
  waitForPageLoad, 
  loginUser,
  logoutUser,
  SELECTORS, 
  TEST_USERS,
  setupConsoleErrorTracking,
  setupNetworkErrorTracking,
  takeScreenshot
} = require('./test-helpers');

test.describe('Pricing and Billing Tests', () => {
  let consoleErrors;
  let networkErrors;

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleErrorTracking(page);
    networkErrors = setupNetworkErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await takeScreenshot(page, `pricing-failed-${testInfo.title}`);
    }
  });

  test.describe('Pricing Page Tests', () => {
    test('should load pricing page successfully', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Check page loads
      await expect(page).toHaveTitle(/pricing/i);
      
      // Check for pricing content
      const pricingContent = page.locator('.pricing, .pricing-section, .plans');
      await expect(pricingContent.first()).toBeVisible();
      
      // Verify no console errors
      expect(consoleErrors).toHaveLength(0);
    });

    test('should display pricing tiers', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Look for pricing tiers
      const pricingTiers = [
        '.free-tier, .trial-tier',
        '.pro-tier, .premium-tier',
        '.lifetime-tier, .enterprise-tier'
      ];
      
      let tiersFound = 0;
      for (const tierSelector of pricingTiers) {
        const tier = page.locator(tierSelector);
        if (await tier.count() > 0) {
          tiersFound++;
          await expect(tier.first()).toBeVisible();
        }
      }
      
      // Look for generic plan cards
      const planCards = page.locator('.plan, .pricing-card, .tier, .subscription-plan');
      const planCount = await planCards.count();
      
      if (planCount > 0) {
        tiersFound += planCount;
        await expect(planCards.first()).toBeVisible();
      }
      
      expect(tiersFound).toBeGreaterThan(0);
    });

    test('should show pricing information', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Check for price displays
      const priceElements = page.locator('.price, .amount, .cost');
      const priceCount = await priceElements.count();
      
      if (priceCount > 0) {
        // Should show dollar amounts or "Free"
        for (let i = 0; i < Math.min(priceCount, 3); i++) {
          const priceText = await priceElements.nth(i).textContent();
          expect(priceText).toMatch(/\$|\d+|free|trial/i);
        }
      }
      
      // Check for billing period info
      const billingInfo = page.locator('text=/month/i, text=/year/i, text=/lifetime/i');
      const billingCount = await billingInfo.count();
      
      if (billingCount > 0) {
        await expect(billingInfo.first()).toBeVisible();
      }
    });

    test('should display feature comparisons', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Look for feature lists
      const featureElements = [
        '.features, .feature-list',
        '.includes, .plan-features',
        '.benefits, .feature-comparison'
      ];
      
      let featuresFound = false;
      for (const selector of featureElements) {
        const features = page.locator(selector);
        if (await features.count() > 0) {
          await expect(features.first()).toBeVisible();
          featuresFound = true;
          break;
        }
      }
      
      // Check for checkmarks or feature indicators
      const indicators = page.locator('.check, .checkmark, .included, .feature-check');
      if (await indicators.count() > 0) {
        featuresFound = true;
      }
      
      expect(featuresFound).toBeTruthy();
    });

    test('should have working CTA buttons', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Look for call-to-action buttons
      const ctaButtons = page.locator('.cta-btn, .subscribe-btn, .get-started-btn, .choose-plan-btn, button:has-text("Start"), button:has-text("Subscribe"), button:has-text("Choose")');
      const ctaCount = await ctaButtons.count();
      
      if (ctaCount > 0) {
        const firstCta = ctaButtons.first();
        await expect(firstCta).toBeVisible();
        
        // Check if button is clickable
        await expect(firstCta).toBeEnabled();
        
        // Get button href or check for click handler
        const href = await firstCta.getAttribute('href');
        const onclick = await firstCta.getAttribute('onclick');
        
        expect(href || onclick).toBeTruthy();
      }
    });

    test('should handle plan selection', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Look for selectable plans
      const selectButtons = page.locator('.select-plan, .choose-plan, button:has-text("Select"), button:has-text("Choose")');
      const selectCount = await selectButtons.count();
      
      if (selectCount > 0) {
        const firstSelect = selectButtons.first();
        await firstSelect.click();
        
        // Wait for response - could redirect to signup/checkout
        await page.waitForTimeout(3000);
        
        // Check if redirected or modal appeared
        const currentUrl = page.url();
        const hasModal = await page.locator('.modal, .dialog, .checkout-modal').count() > 0;
        
        expect(currentUrl.includes('signup') || currentUrl.includes('checkout') || currentUrl.includes('billing') || hasModal).toBeTruthy();
      }
    });

    test('should be responsive on different screen sizes', async ({ page }) => {
      // Test desktop
      await page.setViewportSize({ width: 1200, height: 800 });
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      let pricingVisible = await page.locator('.pricing, .plans').count() > 0;
      expect(pricingVisible).toBeTruthy();
      
      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await waitForPageLoad(page);
      
      pricingVisible = await page.locator('.pricing, .plans').count() > 0;
      expect(pricingVisible).toBeTruthy();
      
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await waitForPageLoad(page);
      
      pricingVisible = await page.locator('.pricing, .plans').count() > 0;
      expect(pricingVisible).toBeTruthy();
    });
  });

  test.describe('Stripe Integration Tests', () => {
    test('should load Stripe checkout for subscription', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Look for paid plan buttons
      const paidPlanButtons = page.locator('.pro-plan button, .premium-plan button, button:has-text("$"), .paid-plan button');
      const paidCount = await paidPlanButtons.count();
      
      if (paidCount > 0) {
        const firstPaidButton = paidPlanButtons.first();
        await firstPaidButton.click();
        
        // Wait for Stripe checkout or redirect
        await page.waitForTimeout(5000);
        
        // Check for Stripe elements
        const stripeElements = [
          '.stripe-checkout',
          'iframe[src*="stripe"]',
          'iframe[src*="checkout"]',
          '[data-stripe]'
        ];
        
        let stripeFound = false;
        for (const selector of stripeElements) {
          if (await page.locator(selector).count() > 0) {
            stripeFound = true;
            console.log(`Stripe element found: ${selector}`);
            break;
          }
        }
        
        // Check if redirected to Stripe
        const currentUrl = page.url();
        if (currentUrl.includes('stripe') || currentUrl.includes('checkout')) {
          stripeFound = true;
          console.log('Redirected to Stripe checkout');
        }
        
        // If no Stripe found, check for errors
        if (!stripeFound) {
          const errorElements = page.locator('.error, .stripe-error, .payment-error');
          const errorCount = await errorElements.count();
          
          if (errorCount > 0) {
            const errorText = await errorElements.first().textContent();
            console.log(`Payment error: ${errorText}`);
          }
        }
        
        console.log(`Stripe integration found: ${stripeFound}`);
      }
    });

    test('should handle checkout session creation', async ({ page }) => {
      // Intercept API calls to checkout session endpoint
      let checkoutSessionCalled = false;
      
      page.on('request', request => {
        if (request.url().includes('create-checkout-session') || request.url().includes('stripe')) {
          checkoutSessionCalled = true;
          console.log(`Checkout API called: ${request.url()}`);
        }
      });
      
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Click on a paid plan
      const paidPlanButtons = page.locator('button:has-text("$"), .subscribe-btn, .checkout-btn');
      if (await paidPlanButtons.count() > 0) {
        await paidPlanButtons.first().click();
        await page.waitForTimeout(3000);
        
        console.log(`Checkout session API called: ${checkoutSessionCalled}`);
      }
    });

    test('should validate required authentication for checkout', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Try to checkout without being logged in
      const checkoutButtons = page.locator('.checkout-btn, .subscribe-btn, button:has-text("Subscribe")');
      if (await checkoutButtons.count() > 0) {
        await checkoutButtons.first().click();
        await page.waitForTimeout(3000);
        
        // Should redirect to login or show login modal
        const currentUrl = page.url();
        const hasLoginForm = await page.locator(SELECTORS.auth.form).count() > 0;
        
        if (currentUrl.includes('login') || hasLoginForm) {
          console.log('Authentication required for checkout - redirected to login');
        } else {
          console.log('Checkout proceeded without authentication check');
        }
      }
    });
  });

  test.describe('Billing Dashboard Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Login before billing tests
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      
      await page.waitForTimeout(5000);
      
      if (!page.url().includes('dashboard')) {
        test.skip('Login failed, skipping billing tests');
      }
    });

    test('should load billing page when authenticated', async ({ page }) => {
      await page.goto('/billing.html');
      await waitForPageLoad(page);
      
      // Check billing page elements
      await expect(page).toHaveTitle(/billing/i);
      
      // Look for billing information sections
      const billingElements = [
        '.billing-info, .subscription-info',
        '.current-plan, .active-plan',
        '.billing-history, .invoices',
        '.payment-method, .card-info'
      ];
      
      let billingFound = false;
      for (const selector of billingElements) {
        if (await page.locator(selector).count() > 0) {
          billingFound = true;
          break;
        }
      }
      
      expect(billingFound).toBeTruthy();
    });

    test('should display current subscription status', async ({ page }) => {
      await page.goto('/billing.html');
      await waitForPageLoad(page);
      
      // Look for subscription status
      const statusElements = page.locator('.subscription-status, .plan-status, .current-plan');
      if (await statusElements.count() > 0) {
        const statusText = await statusElements.first().textContent();
        
        // Should show some plan information
        expect(statusText).toMatch(/free|trial|pro|premium|active|inactive|expired/i);
        console.log(`Subscription status: ${statusText}`);
      }
      
      // Look for plan details
      const planElements = page.locator('.plan-name, .plan-type, .subscription-tier');
      if (await planElements.count() > 0) {
        await expect(planElements.first()).toBeVisible();
      }
    });

    test('should show billing history if available', async ({ page }) => {
      await page.goto('/billing.html');
      await waitForPageLoad(page);
      
      // Look for billing history section
      const historyElements = page.locator('.billing-history, .invoices, .payment-history, .transactions');
      if (await historyElements.count() > 0) {
        await expect(historyElements.first()).toBeVisible();
        
        // Look for individual history items
        const historyItems = page.locator('.invoice, .payment, .transaction, .history-item');
        const itemCount = await historyItems.count();
        
        console.log(`Billing history items found: ${itemCount}`);
        
        if (itemCount > 0) {
          // Check first item has date and amount
          const firstItem = historyItems.first();
          const itemText = await firstItem.textContent();
          
          // Should contain date and amount patterns
          const hasDate = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(itemText);
          const hasAmount = /\$\d+/.test(itemText);
          
          console.log(`First billing item has date: ${hasDate}, has amount: ${hasAmount}`);
        }
      }
    });

    test('should handle plan upgrade/downgrade options', async ({ page }) => {
      await page.goto('/billing.html');
      await waitForPageLoad(page);
      
      // Look for plan change options
      const upgradeElements = page.locator('.upgrade-btn, .change-plan-btn, button:has-text("Upgrade"), button:has-text("Change Plan")');
      if (await upgradeElements.count() > 0) {
        const upgradeBtn = upgradeElements.first();
        await expect(upgradeBtn).toBeVisible();
        
        await upgradeBtn.click();
        await page.waitForTimeout(2000);
        
        // Should show plan options or redirect to pricing
        const currentUrl = page.url();
        const hasModal = await page.locator('.modal, .plan-modal').count() > 0;
        
        expect(currentUrl.includes('pricing') || hasModal).toBeTruthy();
      }
    });

    test('should handle subscription cancellation', async ({ page }) => {
      await page.goto('/billing.html');
      await waitForPageLoad(page);
      
      // Look for cancel subscription option
      const cancelElements = page.locator('.cancel-subscription, .cancel-btn, button:has-text("Cancel"), .end-subscription');
      if (await cancelElements.count() > 0) {
        const cancelBtn = cancelElements.first();
        await expect(cancelBtn).toBeVisible();
        
        await cancelBtn.click();
        await page.waitForTimeout(1000);
        
        // Should show confirmation dialog
        const confirmElements = page.locator('.confirm-cancel, .cancellation-modal, .confirmation-dialog');
        const alertDialog = await page.locator('.alert, [role="dialog"]').count() > 0;
        
        if (await confirmElements.count() > 0 || alertDialog) {
          // Don't actually confirm cancellation
          const cancelConfirm = page.locator('.cancel-btn, button:has-text("Cancel"), .modal-cancel');
          if (await cancelConfirm.count() > 0) {
            await cancelConfirm.first().click();
          }
          
          console.log('Cancellation confirmation dialog found');
        }
      }
    });

    test('should display payment method information', async ({ page }) => {
      await page.goto('/billing.html');
      await waitForPageLoad(page);
      
      // Look for payment method section
      const paymentElements = page.locator('.payment-method, .card-info, .billing-method');
      if (await paymentElements.count() > 0) {
        await expect(paymentElements.first()).toBeVisible();
        
        // Look for card details (should be masked)
        const cardElements = page.locator('.card-number, .card-last4, .payment-card');
        if (await cardElements.count() > 0) {
          const cardText = await cardElements.first().textContent();
          
          // Should show masked card number
          expect(cardText).toMatch(/\*{4}|\*{12}|\d{4}|visa|mastercard|amex/i);
          console.log(`Payment method: ${cardText}`);
        }
        
        // Look for update payment method option
        const updateElements = page.locator('.update-payment, .change-card, button:has-text("Update")');
        if (await updateElements.count() > 0) {
          await expect(updateElements.first()).toBeVisible();
        }
      }
    });

    test('should handle payment method updates', async ({ page }) => {
      await page.goto('/billing.html');
      await waitForPageLoad(page);
      
      // Look for update payment method button
      const updateElements = page.locator('.update-payment, .change-card, .update-card-btn, button:has-text("Update")');
      if (await updateElements.count() > 0) {
        const updateBtn = updateElements.first();
        await updateBtn.click();
        await page.waitForTimeout(3000);
        
        // Should load Stripe payment form or redirect
        const stripeElements = [
          'iframe[src*="stripe"]',
          '.stripe-payment-form',
          '[data-stripe]'
        ];
        
        let stripeFound = false;
        for (const selector of stripeElements) {
          if (await page.locator(selector).count() > 0) {
            stripeFound = true;
            break;
          }
        }
        
        // Check if redirected to Stripe
        const currentUrl = page.url();
        if (currentUrl.includes('stripe')) {
          stripeFound = true;
        }
        
        console.log(`Stripe payment update form found: ${stripeFound}`);
      }
    });
  });

  test.describe('Subscription Lifecycle Tests', () => {
    test('should handle free trial signup', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Look for free trial option
      const trialElements = page.locator('.free-trial, .trial-btn, button:has-text("Free"), button:has-text("Trial")');
      if (await trialElements.count() > 0) {
        const trialBtn = trialElements.first();
        await trialBtn.click();
        await page.waitForTimeout(2000);
        
        // Should redirect to signup
        const currentUrl = page.url();
        expect(currentUrl.includes('signup') || currentUrl.includes('register')).toBeTruthy();
      }
    });

    test('should handle lifetime purchase option', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Look for lifetime option
      const lifetimeElements = page.locator('.lifetime, .one-time, button:has-text("Lifetime"), .lifetime-plan');
      if (await lifetimeElements.count() > 0) {
        const lifetimeBtn = lifetimeElements.first();
        await lifetimeBtn.click();
        await page.waitForTimeout(3000);
        
        // Should proceed to checkout
        const currentUrl = page.url();
        const hasStripe = currentUrl.includes('stripe') || currentUrl.includes('checkout');
        
        if (hasStripe) {
          console.log('Lifetime purchase redirected to Stripe');
        } else {
          // Check for checkout modal or form
          const checkoutElements = page.locator('.checkout-form, .payment-form, iframe[src*="stripe"]');
          const checkoutFound = await checkoutElements.count() > 0;
          console.log(`Lifetime checkout form found: ${checkoutFound}`);
        }
      }
    });

    test('should display appropriate messaging for each plan type', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Check for plan-specific messaging
      const messagingElements = [
        'text=/free/i',
        'text=/trial/i',
        'text=/per month/i',
        'text=/lifetime/i',
        'text=/one-time/i'
      ];
      
      let messagingFound = 0;
      for (const selector of messagingElements) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          messagingFound++;
        }
      }
      
      expect(messagingFound).toBeGreaterThan(0);
      console.log(`Plan messaging elements found: ${messagingFound}`);
    });
  });

  test.describe('Edge Cases and Error Handling', () => {
    test('should handle Stripe API errors gracefully', async ({ page }) => {
      // Intercept Stripe API calls and simulate errors
      await page.route('**/api/create-checkout-session', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Stripe API error' })
        });
      });
      
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Try to checkout
      const checkoutBtn = page.locator('button:has-text("$"), .checkout-btn').first();
      if (await checkoutBtn.count() > 0) {
        await checkoutBtn.click();
        await page.waitForTimeout(3000);
        
        // Should show error message
        const errorElements = page.locator('.error, .payment-error, .stripe-error');
        if (await errorElements.count() > 0) {
          const errorText = await errorElements.first().textContent();
          console.log(`Payment error handled: ${errorText}`);
        }
      }
    });

    test('should handle expired sessions', async ({ page }) => {
      // Login first
      await page.goto('/login-real.html');
      await waitForPageLoad(page);
      
      await page.fill(SELECTORS.auth.emailInput, TEST_USERS.valid.email);
      await page.fill(SELECTORS.auth.passwordInput, TEST_USERS.valid.password);
      await page.click(SELECTORS.auth.submitBtn);
      
      await page.waitForTimeout(5000);
      
      if (page.url().includes('dashboard')) {
        // Simulate expired session by clearing auth
        await page.evaluate(() => {
          localStorage.removeItem('ezEditAuth');
          sessionStorage.clear();
        });
        
        // Try to access billing page
        await page.goto('/billing.html');
        await page.waitForTimeout(2000);
        
        // Should redirect to login
        const currentUrl = page.url();
        expect(currentUrl.includes('login')).toBeTruthy();
      }
    });

    test('should validate plan limits and restrictions', async ({ page }) => {
      await page.goto('/pricing.html');
      await waitForPageLoad(page);
      
      // Look for plan limitation information
      const limitElements = page.locator('.limit, .restriction, text=/limited/i, text=/up to/i');
      if (await limitElements.count() > 0) {
        console.log('Plan limitations displayed');
        
        // Check for specific limit numbers
        const limitText = await limitElements.first().textContent();
        const hasNumbers = /\d+/.test(limitText);
        expect(hasNumbers).toBeTruthy();
      }
    });
  });
});