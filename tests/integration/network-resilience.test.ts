/**
 * Integration Test: Network Failure and Retry Mechanism
 *
 * This test validates the application's ability to handle network issues
 * and recover gracefully - directly addressing the "Failed to fetch" error
 * IMPORTANT: This test MUST FAIL initially (TDD approach) before implementation
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'
import { createEnhancedSupabaseClient, withRetry, checkNetworkConnectivity } from '../../lib/supabase-enhanced'
import { AuthError } from '../../lib/types/auth'

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000'
const TEST_EMAIL = `network.test.${Date.now()}@example.com`
const TEST_PASSWORD = 'TestPassword123!'

// Mock network conditions
const mockNetworkFailure = () => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('fetch failed'))
  ) as jest.MockedFunction<typeof fetch>
}

const mockNetworkTimeout = () => {
  global.fetch = jest.fn(() =>
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 100)
    })
  ) as jest.MockedFunction<typeof fetch>
}

const mockIntermittentFailure = () => {
  let attemptCount = 0
  global.fetch = jest.fn(() => {
    attemptCount++
    if (attemptCount <= 2) {
      return Promise.reject(new Error('Network error'))
    }
    return Promise.resolve(new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }))
  }) as jest.MockedFunction<typeof fetch>
}

const restoreRealFetch = () => {
  global.fetch = require('node-fetch')
}

describe('Network Resilience Integration Tests', () => {
  beforeAll(() => {
    console.log('🧪 Starting network resilience integration tests')
    console.log(`📍 Testing against: ${API_BASE_URL}`)
  })

  afterAll(() => {
    restoreRealFetch()
    console.log('✅ Network resilience integration tests completed')
  })

  describe('🌐 Network Connectivity Detection', () => {
    it('should detect network connectivity status', async () => {
      const isOnline = await checkNetworkConnectivity()
      expect(typeof isOnline).toBe('boolean')

      if (isOnline) {
        console.log('✅ Network connectivity detected')
      } else {
        console.log('❌ Network connectivity issues detected')
      }
    })

    it('should handle DNS resolution failures gracefully', async () => {
      // Mock DNS failure
      mockNetworkFailure()

      const isOnline = await checkNetworkConnectivity()
      expect(isOnline).toBe(false)

      restoreRealFetch()
    })
  })

  describe('🔄 Retry Mechanism', () => {
    it('should retry failed requests with exponential backoff', async () => {
      mockIntermittentFailure()

      const retryOperation = async () => {
        const response = await fetch('https://example.com/test')
        return response.json()
      }

      const startTime = Date.now()
      const result = await withRetry(retryOperation, 'test-operation', 3)
      const endTime = Date.now()

      expect(result.success).toBe(true)
      expect(endTime - startTime).toBeGreaterThan(100) // Should take time due to retries
      expect(global.fetch).toHaveBeenCalledTimes(3) // Should retry 2 times before success

      restoreRealFetch()
    })

    it('should fail after maximum retry attempts', async () => {
      mockNetworkFailure()

      const retryOperation = async () => {
        const response = await fetch('https://example.com/test')
        return response.json()
      }

      await expect(
        withRetry(retryOperation, 'failing-operation', 2)
      ).rejects.toThrow()

      expect(global.fetch).toHaveBeenCalledTimes(3) // Initial + 2 retries

      restoreRealFetch()
    })

    it('should not retry on client errors (4xx)', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ error: 'Bad Request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }))
      ) as jest.MockedFunction<typeof fetch>

      const retryOperation = async () => {
        const response = await fetch('https://example.com/test')
        if (!response.ok) {
          const error = new Error('Client error')
          ;(error as any).status = response.status
          throw error
        }
        return response.json()
      }

      await expect(
        withRetry(retryOperation, 'client-error-operation', 3)
      ).rejects.toThrow()

      expect(global.fetch).toHaveBeenCalledTimes(1) // Should not retry

      restoreRealFetch()
    })
  })

  describe('🔐 Authentication with Network Issues', () => {
    it('should handle signup with network failures and recover', async () => {
      // Test real signup with retry mechanism
      const signupData = {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
      })

      // Should eventually succeed or provide meaningful error
      if (response.ok) {
        const data = await response.json()
        expect(data.success).toBe(true)
      } else {
        const error: AuthError = await response.json()
        expect(error.error).toBeDefined()
        expect(error.message).toBeDefined()

        // Should not expose internal errors
        expect(error.message).not.toContain('fetch failed')
        expect(error.message).not.toContain('ENOTFOUND')
        expect(error.message).not.toContain('network error')
      }
    })

    it('should handle signin with network timeouts', async () => {
      // First create user
      await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `timeout.${Date.now()}@example.com`,
          password: TEST_PASSWORD
        })
      })

      // Test signin with potential timeout
      const signinData = {
        email: `timeout.${Date.now()}@example.com`,
        password: TEST_PASSWORD
      }

      const controller = new AbortController()
      setTimeout(() => controller.abort(), 5000) // 5 second timeout

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(signinData),
          signal: controller.signal
        })

        if (response.ok) {
          const data = await response.json()
          expect(data.success).toBeDefined()
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('⏰ Request timed out as expected')
        } else {
          // Should handle other network errors gracefully
          expect(error.message).not.toContain('fetch failed')
        }
      }
    })
  })

  describe('🛡️ Enhanced Supabase Client', () => {
    it('should create enhanced client with retry capabilities', () => {
      expect(() => {
        const client = createEnhancedSupabaseClient()
        expect(client).toBeDefined()
        expect(client.auth).toBeDefined()
      }).not.toThrow()
    })

    it('should handle Supabase connectivity issues', async () => {
      const client = createEnhancedSupabaseClient()

      try {
        // Test a simple operation that might fail due to network
        const { data, error } = await client.auth.getSession()

        if (error) {
          // Should be a handled error, not a raw network error
          expect(error.message).not.toContain('fetch failed')
          expect(error.message).not.toContain('ENOTFOUND')
        }
      } catch (networkError: any) {
        // If it throws, should be a handled error
        expect(networkError.message).not.toContain('fetch failed')
      }
    })
  })

  describe('🎯 Real-World Scenarios', () => {
    it('should handle poor network conditions (slow connection)', async () => {
      // Simulate slow network
      const originalFetch = global.fetch
      global.fetch = jest.fn(async (...args) => {
        // Add artificial delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        return originalFetch(...args)
      }) as jest.MockedFunction<typeof fetch>

      const startTime = Date.now()

      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `slow.${Date.now()}@example.com`,
          password: TEST_PASSWORD
        })
      })

      const endTime = Date.now()

      // Should handle slow connections
      expect(endTime - startTime).toBeGreaterThan(900)
      expect([200, 400, 500]).toContain(response.status)

      restoreRealFetch()
    })

    it('should maintain user experience during network issues', async () => {
      // Test that user gets meaningful feedback during network problems
      mockNetworkFailure()

      try {
        await withRetry(
          () => fetch('https://example.com/api/test'),
          'user-facing-operation',
          2
        )
      } catch (error: any) {
        // Error should be user-friendly
        expect(error.message).toBeDefined()
        expect(error.message.length).toBeGreaterThan(10)
        expect(error.message).not.toContain('TypeError')
        expect(error.message).not.toContain('fetch is not defined')
      }

      restoreRealFetch()
    })

    it('should handle offline scenarios gracefully', async () => {
      // Simulate complete offline state
      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network request failed'))
      ) as jest.MockedFunction<typeof fetch>

      const isOnline = await checkNetworkConnectivity()
      expect(isOnline).toBe(false)

      // Application should detect offline state
      // and provide appropriate user feedback
      restoreRealFetch()
    })
  })

  describe('📊 Performance Under Network Stress', () => {
    it('should maintain performance with multiple concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) =>
        fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `concurrent.${i}.${Date.now()}@example.com`,
            password: TEST_PASSWORD
          })
        })
      )

      const startTime = Date.now()
      const responses = await Promise.allSettled(concurrentRequests)
      const endTime = Date.now()

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000) // 10 seconds max

      // All requests should resolve (either success or handled error)
      responses.forEach(result => {
        expect(result.status).toBe('fulfilled')
      })
    })

    it('should handle request queuing during high load', async () => {
      // Test behavior under high request volume
      const highVolumeRequests = Array.from({ length: 20 }, (_, i) =>
        fetch(`${API_BASE_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `volume.${i}.${Date.now()}@example.com`,
            password: TEST_PASSWORD
          })
        })
      )

      const responses = await Promise.allSettled(highVolumeRequests)

      // Should handle high volume without complete failure
      const successfulResponses = responses.filter(r => r.status === 'fulfilled')
      expect(successfulResponses.length).toBeGreaterThan(0)
    })
  })
})

/**
 * NOTE: This test is designed to FAIL initially as part of TDD approach.
 * The implementation should include:
 * - Enhanced Supabase client with retry logic (lib/supabase-enhanced.ts)
 * - Network connectivity detection (lib/utils/network.ts)
 * - Retry mechanism with exponential backoff (lib/utils/retry-logic.ts)
 * - Proper error handling in authentication endpoints
 */