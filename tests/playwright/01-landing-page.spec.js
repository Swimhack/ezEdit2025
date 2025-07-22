// Landing page and navigation tests
const { test, expect } = require('@playwright/test');
const { 
  waitForPageLoad, 
  SELECTORS, 
  setupConsoleErrorTracking,
  setupNetworkErrorTracking,
  takeScreenshot
} = require('./test-helpers');

test.describe('Landing Page Tests', () => {
  let consoleErrors;
  let networkErrors;

  test.beforeEach(async ({ page }) => {
    consoleErrors = setupConsoleErrorTracking(page);
    networkErrors = setupNetworkErrorTracking(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      await takeScreenshot(page, `failed-${testInfo.title}`);
    }
  });

  test('should load landing page successfully', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check page title
    await expect(page).toHaveTitle(/EzEdit/i);
    
    // Check main heading
    const mainHeading = page.locator('h1, .hero h2, .hero-title');
    await expect(mainHeading.first()).toBeVisible();
    
    // Check navigation elements
    await expect(page.locator(SELECTORS.nav.loginBtn).first()).toBeVisible();
    await expect(page.locator(SELECTORS.nav.signupBtn).first()).toBeVisible();
    
    // Verify no console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should display hero section with key messaging', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check for hero section
    const heroSection = page.locator('.hero, .hero-section, .landing-hero');
    await expect(heroSection.first()).toBeVisible();
    
    // Check for key messaging
    await expect(page.locator('text=/ftp/i').first()).toBeVisible();
    await expect(page.locator('text=/editor/i').first()).toBeVisible();
    
    // Check for CTA buttons
    const ctaButtons = page.locator('a:has-text("Get Started"), a:has-text("Try Free"), .cta-btn');
    await expect(ctaButtons.first()).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Scroll to features section
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    
    // Check for features section
    const featuresSection = page.locator('.features, .features-section, #features');
    await expect(featuresSection.first()).toBeVisible();
    
    // Check for feature items
    const featureItems = page.locator('.feature, .feature-item, .feature-card');
    await expect(featureItems.first()).toBeVisible();
  });

  test('should display pricing preview', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Scroll to find pricing section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for pricing section or link to pricing page
    const pricingElements = page.locator('.pricing, .pricing-preview, a[href*="pricing"]');
    const exists = await pricingElements.count() > 0;
    
    if (exists) {
      await expect(pricingElements.first()).toBeVisible();
    }
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Test login link
    const loginLink = page.locator(SELECTORS.nav.loginBtn).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/login/i);
    
    // Go back and test signup link
    await page.goBack();
    await waitForPageLoad(page);
    
    const signupLink = page.locator(SELECTORS.nav.signupBtn).first();
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL(/signup/i);
  });

  test('should have responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    await waitForPageLoad(page);
    
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await waitForPageLoad(page);
    
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await waitForPageLoad(page);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should load all critical resources', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check for CSS files
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
    
    // Check for JavaScript files
    const scripts = await page.locator('script[src]').count();
    expect(scripts).toBeGreaterThan(0);
    
    // Verify no critical network errors
    const criticalErrors = networkErrors.filter(error => 
      error.url.includes('.css') || 
      error.url.includes('.js') || 
      error.status >= 500
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have proper meta tags and SEO elements', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
    
    // Check meta viewport
    const metaViewport = page.locator('meta[name="viewport"]');
    await expect(metaViewport).toHaveAttribute('content', /width=device-width/);
    
    // Check for favicon
    const favicon = page.locator('link[rel*="icon"]');
    await expect(favicon.first()).toHaveAttribute('href', /.+/);
  });

  test('should handle contact/support links if present', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    // Check for contact or support links
    const contactLinks = page.locator('a[href*="contact"], a[href*="support"], a[href*="help"]');
    const count = await contactLinks.count();
    
    if (count > 0) {
      const firstLink = contactLinks.first();
      await expect(firstLink).toBeVisible();
      
      // Check if link is valid (doesn't have to actually navigate)
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});