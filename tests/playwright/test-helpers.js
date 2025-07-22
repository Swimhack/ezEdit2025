// Test helper functions for EzEdit.co Playwright tests

const { expect } = require('@playwright/test');

/**
 * Test user credentials for various scenarios
 */
const TEST_USERS = {
  valid: {
    email: 'test@ezedit.co',
    password: 'TestPassword123!'
  },
  invalid: {
    email: 'invalid@test.com',
    password: 'wrongpassword'
  },
  new: {
    email: `test-${Date.now()}@ezedit.co`,
    password: 'NewPassword123!'
  }
};

/**
 * Test FTP connection details (using public test server)
 */
const TEST_FTP = {
  host: 'test.rebex.net',
  username: 'demo',
  password: 'password',
  port: 21
};

/**
 * Common page selectors
 */
const SELECTORS = {
  // Navigation
  nav: {
    loginBtn: 'a[href*="login"], .login-btn',
    signupBtn: 'a[href*="signup"], .signup-btn',
    dashboardBtn: 'a[href*="dashboard"], .dashboard-btn',
    logoutBtn: '.logout-btn, [data-action="logout"]'
  },
  
  // Auth forms
  auth: {
    emailInput: 'input[name="email"], input[type="email"], #email',
    passwordInput: 'input[name="password"], input[type="password"], #password',
    confirmPasswordInput: 'input[name="confirmPassword"], input[name="confirm-password"], #confirmPassword',
    submitBtn: 'button[type="submit"], .submit-btn',
    form: 'form'
  },
  
  // Dashboard
  dashboard: {
    addSiteBtn: '.add-site-btn, [data-action="add-site"]',
    siteList: '.site-list, .sites-container',
    siteItem: '.site-item, .site-card',
    editSiteBtn: '.edit-site-btn, [data-action="edit"]',
    deleteSiteBtn: '.delete-site-btn, [data-action="delete"]'
  },
  
  // Editor
  editor: {
    fileExplorer: '.file-explorer, .file-tree',
    monacoEditor: '.monaco-editor',
    aiAssistant: '.ai-assistant, .ai-chat',
    saveBtn: '.save-btn, [data-action="save"]'
  },
  
  // Modals and alerts
  modal: {
    container: '.modal, .dialog',
    overlay: '.modal-overlay, .backdrop',
    closeBtn: '.modal-close, .close-btn',
    confirmBtn: '.confirm-btn, .modal-confirm',
    cancelBtn: '.cancel-btn, .modal-cancel'
  },
  
  // Toast notifications
  toast: {
    container: '.toast, .notification',
    success: '.toast-success, .success',
    error: '.toast-error, .error',
    warning: '.toast-warning, .warning',
    info: '.toast-info, .info'
  }
};

/**
 * Helper to wait for page to be fully loaded
 */
async function waitForPageLoad(page, timeout = 10000) {
  await page.waitForLoadState('networkidle', { timeout });
  // Additional wait for any JavaScript initialization
  await page.waitForTimeout(500);
}

/**
 * Helper to login with test credentials
 */
async function loginUser(page, user = TEST_USERS.valid) {
  await page.goto('/login-real.html');
  await waitForPageLoad(page);
  
  await page.fill(SELECTORS.auth.emailInput, user.email);
  await page.fill(SELECTORS.auth.passwordInput, user.password);
  await page.click(SELECTORS.auth.submitBtn);
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  await waitForPageLoad(page);
}

/**
 * Helper to logout user
 */
async function logoutUser(page) {
  // Try multiple possible locations for logout button
  const logoutSelectors = [
    '.logout-btn',
    '[data-action="logout"]',
    '.user-menu .logout',
    'button:has-text("logout")',
    'a:has-text("logout")'
  ];
  
  let logoutBtn = null;
  for (const selector of logoutSelectors) {
    logoutBtn = await page.$(selector);
    if (logoutBtn) break;
  }
  
  if (logoutBtn) {
    await logoutBtn.click();
    await page.waitForURL('**/index.html', { timeout: 10000 });
  } else {
    // Fallback: clear localStorage and navigate to home
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
  }
}

/**
 * Helper to create a test FTP site
 */
async function createTestFtpSite(page, siteName = `Test-${Date.now()}`) {
  await page.click(SELECTORS.dashboard.addSiteBtn);
  
  // Wait for modal to appear
  await page.waitForSelector(SELECTORS.modal.container);
  
  // Fill in FTP details
  await page.fill('input[name="site_name"], #siteName', siteName);
  await page.fill('input[name="ftp_host"], #ftpHost', TEST_FTP.host);
  await page.fill('input[name="ftp_username"], #ftpUsername', TEST_FTP.username);
  await page.fill('input[name="ftp_password"], #ftpPassword', TEST_FTP.password);
  await page.fill('input[name="ftp_port"], #ftpPort', TEST_FTP.port.toString());
  
  // Submit form
  await page.click(SELECTORS.modal.confirmBtn + ', .save-btn');
  
  // Wait for modal to close
  await page.waitForSelector(SELECTORS.modal.container, { state: 'detached' });
}

/**
 * Helper to wait for toast notification
 */
async function waitForToast(page, type = 'success', timeout = 5000) {
  const selector = type === 'success' ? SELECTORS.toast.success : 
                   type === 'error' ? SELECTORS.toast.error :
                   type === 'warning' ? SELECTORS.toast.warning :
                   SELECTORS.toast.info;
  
  await page.waitForSelector(selector, { timeout });
  return await page.textContent(selector);
}

/**
 * Helper to check if element exists without throwing
 */
async function elementExists(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Helper to take screenshot with timestamp
 */
async function takeScreenshot(page, name, fullPage = true) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage 
  });
}

/**
 * Helper to check console errors
 */
function setupConsoleErrorTracking(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  return errors;
}

/**
 * Helper to check network errors
 */
function setupNetworkErrorTracking(page) {
  const failedRequests = [];
  page.on('response', response => {
    if (!response.ok() && response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });
  return failedRequests;
}

module.exports = {
  TEST_USERS,
  TEST_FTP,
  SELECTORS,
  waitForPageLoad,
  loginUser,
  logoutUser,
  createTestFtpSite,
  waitForToast,
  elementExists,
  takeScreenshot,
  setupConsoleErrorTracking,
  setupNetworkErrorTracking
};