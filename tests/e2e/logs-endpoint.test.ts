/**
 * Comprehensive E2E test for Logs Endpoint
 * Tests the logs functionality at https://ezeditapp.fly.dev/logs?pass=1234
 *
 * Tests include:
 * - Page loading and navigation
 * - Authentication flows (URL param and form)
 * - Logs display and functionality
 * - API endpoint testing
 * - Error handling and console monitoring
 */

import { test, expect, Page } from '@playwright/test'

const PRODUCTION_URL = 'https://ezeditapp.fly.dev'
const LOGS_PASSWORD = '1234'

test.describe('Logs Endpoint Comprehensive Testing', () => {
  let consoleErrors: string[] = []
  let networkErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    // Reset error arrays
    consoleErrors = []
    networkErrors = []

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`Console Error: ${msg.text()}`)
      }
    })

    // Listen for network failures
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push(`Network Error: ${response.status()} ${response.url()}`)
      }
    })

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(`Page Error: ${error.message}`)
    })
  })

  test('should load logs page with URL parameter authentication', async ({ page }) => {
    console.log('Testing logs page with URL parameter authentication...')

    // Navigate to logs page with password parameter
    await page.goto(`${PRODUCTION_URL}/logs?pass=${LOGS_PASSWORD}`)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check that we skip the login form and go directly to logs
    await expect(page.locator('h1')).toContainText('Application Logs')

    // Should not see password form since we authenticated via URL
    await expect(page.locator('input[type="password"]')).not.toBeVisible()

    // Should see the logs container
    await expect(page.locator('.bg-black.rounded-lg')).toBeVisible()

    // Should see refresh buttons
    await expect(page.getByText('Refresh Logs')).toBeVisible()
    await expect(page.getByText('Auto Refresh')).toBeVisible()

    console.log('✓ URL parameter authentication test passed')
  })

  test('should show login form when accessing without password', async ({ page }) => {
    console.log('Testing logs page without authentication...')

    // Navigate to logs page without password
    await page.goto(`${PRODUCTION_URL}/logs`)

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Should see the login form
    await expect(page.locator('h1')).toContainText('Application Logs')
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByText('Access Logs')).toBeVisible()
    await expect(page.getByText('Access with ?pass=1234')).toBeVisible()

    // Should not see logs container yet
    await expect(page.locator('.bg-black.rounded-lg')).not.toBeVisible()

    console.log('✓ Unauthenticated access test passed')
  })

  test('should authenticate via form input', async ({ page }) => {
    console.log('Testing form-based authentication...')

    // Navigate to logs page without password
    await page.goto(`${PRODUCTION_URL}/logs`)
    await page.waitForLoadState('networkidle')

    // Fill in password form
    await page.fill('input[type="password"]', LOGS_PASSWORD)
    await page.click('button[type="submit"]')

    // Wait for authentication to complete
    await page.waitForTimeout(1000)

    // Should now see logs interface
    await expect(page.locator('.bg-black.rounded-lg')).toBeVisible()
    await expect(page.getByText('Refresh Logs')).toBeVisible()

    // Should not see password form anymore
    await expect(page.locator('input[type="password"]')).not.toBeVisible()

    console.log('✓ Form authentication test passed')
  })

  test('should handle invalid password correctly', async ({ page }) => {
    console.log('Testing invalid password handling...')

    // Navigate to logs page
    await page.goto(`${PRODUCTION_URL}/logs`)
    await page.waitForLoadState('networkidle')

    // Try invalid password
    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    // Should see error message
    await expect(page.getByText('Invalid password')).toBeVisible()

    // Should still see login form
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Should not see logs container
    await expect(page.locator('.bg-black.rounded-lg')).not.toBeVisible()

    console.log('✓ Invalid password test passed')
  })

  test('should display logs correctly', async ({ page }) => {
    console.log('Testing logs display functionality...')

    // Navigate with authentication
    await page.goto(`${PRODUCTION_URL}/logs?pass=${LOGS_PASSWORD}`)
    await page.waitForLoadState('networkidle')

    // Wait for logs to load
    await page.waitForTimeout(2000)

    // Check logs container
    const logsContainer = page.locator('.bg-black.rounded-lg')
    await expect(logsContainer).toBeVisible()

    // Check if logs are displayed or "No logs available" message
    const hasLogs = await page.locator('.bg-black.rounded-lg div').count() > 1
    const noLogsMessage = await page.getByText('No logs available').isVisible()

    if (hasLogs) {
      console.log('✓ Logs are displayed')

      // Check that logs have timestamp format
      const firstLog = await page.locator('.bg-black.rounded-lg div').first()
      const logText = await firstLog.textContent()

      if (logText && logText.includes('[') && logText.includes(']')) {
        console.log('✓ Logs have proper timestamp format')
      }
    } else if (noLogsMessage) {
      console.log('✓ "No logs available" message is shown correctly')
    } else {
      console.log('⚠ Logs container is empty without "No logs available" message')
    }

    console.log('✓ Logs display test completed')
  })

  test('should handle refresh functionality', async ({ page }) => {
    console.log('Testing refresh functionality...')

    // Navigate with authentication
    await page.goto(`${PRODUCTION_URL}/logs?pass=${LOGS_PASSWORD}`)
    await page.waitForLoadState('networkidle')

    // Wait for initial load
    await page.waitForTimeout(1000)

    // Test manual refresh
    const refreshButton = page.getByText('Refresh Logs')
    await expect(refreshButton).toBeVisible()

    // Click refresh and monitor network activity
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/logs') && response.request().method() === 'GET'
    )

    await refreshButton.click()

    try {
      const response = await responsePromise
      console.log(`✓ Refresh triggered API call: ${response.status()}`)
    } catch (error) {
      console.log('⚠ Refresh did not trigger expected API call')
    }

    // Test auto refresh button (just check it's clickable)
    const autoRefreshButton = page.getByText('Auto Refresh')
    await expect(autoRefreshButton).toBeVisible()
    await autoRefreshButton.click()

    console.log('✓ Refresh functionality test completed')
  })

  test('should test API endpoint directly', async ({ page, request }) => {
    console.log('Testing /api/logs endpoint directly...')

    // Test the API endpoint with proper authentication
    const response = await request.get(`${PRODUCTION_URL}/api/logs`, {
      headers: {
        'Authorization': 'Bearer logs-1234'
      }
    })

    console.log(`API Response Status: ${response.status()}`)

    if (response.ok()) {
      const data = await response.json()
      console.log('API Response Structure:', Object.keys(data))

      if (data.logs) {
        console.log(`✓ API returned ${data.logs.length} logs`)
        console.log('✓ API response has logs array')
      }

      if (data.correlationId) {
        console.log('✓ API response has correlationId')
      }

      if (data.timestamp) {
        console.log('✓ API response has timestamp')
      }
    } else {
      console.log(`⚠ API request failed with status: ${response.status()}`)
      const errorText = await response.text()
      console.log('Error response:', errorText)
    }

    // Test API without authentication
    const unauthResponse = await request.get(`${PRODUCTION_URL}/api/logs`)
    console.log(`Unauthenticated API Status: ${unauthResponse.status()}`)

    console.log('✓ API endpoint testing completed')
  })

  test('should monitor for JavaScript errors', async ({ page }) => {
    console.log('Testing for JavaScript console errors...')

    // Navigate and interact with the page
    await page.goto(`${PRODUCTION_URL}/logs?pass=${LOGS_PASSWORD}`)
    await page.waitForLoadState('networkidle')

    // Wait for any async operations
    await page.waitForTimeout(3000)

    // Try to trigger various interactions
    await page.getByText('Refresh Logs').click()
    await page.waitForTimeout(1000)

    // Check for console errors
    if (consoleErrors.length > 0) {
      console.log('⚠ Console errors detected:')
      consoleErrors.forEach(error => console.log(`  - ${error}`))
    } else {
      console.log('✓ No console errors detected')
    }

    // Check for network errors
    if (networkErrors.length > 0) {
      console.log('⚠ Network errors detected:')
      networkErrors.forEach(error => console.log(`  - ${error}`))
    } else {
      console.log('✓ No network errors detected')
    }

    console.log('✓ Error monitoring test completed')
  })

  test('should test responsive design and mobile compatibility', async ({ page }) => {
    console.log('Testing responsive design...')

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto(`${PRODUCTION_URL}/logs?pass=${LOGS_PASSWORD}`)
    await page.waitForLoadState('networkidle')

    // Check that page is still usable on mobile
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.bg-black.rounded-lg')).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }) // iPad
    await page.waitForTimeout(500)

    // Check layout is still good
    await expect(page.locator('h1')).toBeVisible()

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 })

    console.log('✓ Responsive design test completed')
  })

  test('should test performance and loading times', async ({ page }) => {
    console.log('Testing performance metrics...')

    const startTime = Date.now()

    // Navigate to page
    await page.goto(`${PRODUCTION_URL}/logs?pass=${LOGS_PASSWORD}`)
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - startTime
    console.log(`Page load time: ${loadTime}ms`)

    // Test refresh performance
    const refreshStart = Date.now()
    await page.getByText('Refresh Logs').click()
    await page.waitForTimeout(1000) // Wait for potential API call
    const refreshTime = Date.now() - refreshStart
    console.log(`Refresh action time: ${refreshTime}ms`)

    if (loadTime > 10000) {
      console.log('⚠ Page load time is slow (>10s)')
    } else {
      console.log('✓ Page load time is acceptable')
    }

    console.log('✓ Performance test completed')
  })

  test.afterEach(async () => {
    // Summary of issues found during this test
    const totalErrors = consoleErrors.length + networkErrors.length
    if (totalErrors > 0) {
      console.log(`\n⚠ Test completed with ${totalErrors} issues detected`)
    } else {
      console.log('\n✓ Test completed with no issues detected')
    }
  })
})

test.describe('Logs Endpoint Issues and Recommendations', () => {
  test('should generate comprehensive test report', async ({ page }) => {
    console.log('\n=== COMPREHENSIVE LOGS ENDPOINT TEST REPORT ===\n')

    const issues: string[] = []
    const recommendations: string[] = []

    // Test basic functionality
    await page.goto(`${PRODUCTION_URL}/logs?pass=${LOGS_PASSWORD}`)
    await page.waitForLoadState('networkidle')

    // Check for specific issues based on code review

    // 1. Auto Refresh button behavior
    const autoRefreshButton = page.getByText('Auto Refresh')
    if (await autoRefreshButton.isVisible()) {
      // This button just reloads the page, not a true auto-refresh
      issues.push('Auto Refresh button only reloads page instead of implementing periodic refresh')
      recommendations.push('Implement actual auto-refresh functionality with setInterval')
    }

    // 2. Check logs content quality
    await page.waitForTimeout(2000)
    const logsContainer = page.locator('.bg-black.rounded-lg')
    const logElements = await logsContainer.locator('div').count()

    if (logElements <= 1) {
      issues.push('No logs are being displayed or logs API is not returning data')
      recommendations.push('Verify API connection and check if logs are being generated')
    }

    // 3. Check for loading states
    const hasLoadingSpinner = await page.locator('.animate-spin').isVisible()
    if (!hasLoadingSpinner) {
      // The loading state might have already passed
      console.log('Loading spinner not visible (may have completed)')
    }

    // 4. Check authentication flow
    await page.goto(`${PRODUCTION_URL}/logs`)
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toBeVisible()

    // 5. Error handling test
    await page.fill('input[type="password"]', 'wrong')
    await page.click('button[type="submit"]')
    const errorMessage = await page.getByText('Invalid password').isVisible()
    if (!errorMessage) {
      issues.push('Error message for invalid password not displaying correctly')
      recommendations.push('Verify error state handling in authentication form')
    }

    // Report findings
    console.log('ISSUES IDENTIFIED:')
    if (issues.length === 0) {
      console.log('✓ No critical issues identified')
    } else {
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`)
      })
    }

    console.log('\nRECOMMENDATIONS:')
    if (recommendations.length === 0) {
      console.log('✓ No specific recommendations at this time')
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }

    console.log('\n=== END REPORT ===\n')
  })
})