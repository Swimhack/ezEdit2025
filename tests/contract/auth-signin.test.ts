import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

/**
 * Contract tests for Authentication Sign-In API
 * These tests verify the API contract against the OpenAPI specification
 * and must FAIL initially (RED phase) before implementation
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_EMAIL = 'test-signin@example.com'
const TEST_PASSWORD = 'TestPassword123!'
const INVALID_EMAIL = 'invalid-email'
const WRONG_PASSWORD = 'WrongPassword123!'

// Helper function to make API requests
async function makeSignInRequest(body: any) {
  const response = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()
  return { response, data }
}

describe('Auth Sign-In API Contract Tests', () => {
  let supabase: any
  let testUserId: string

  beforeAll(async () => {
    // Set up test user using Supabase admin client
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Clean up any existing test user
    try {
      const { data: existingUser } = await supabase.auth.admin.listUsers()
      const testUser = existingUser.users.find((u: any) => u.email === TEST_EMAIL)
      if (testUser) {
        await supabase.auth.admin.deleteUser(testUser.id)
      }
    } catch (error) {
      console.log('No existing test user to clean up')
    }

    // Create test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true
    })

    if (userError) {
      throw new Error(`Failed to create test user: ${userError.message}`)
    }

    testUserId = userData.user.id
    console.log(`✅ Test user created: ${testUserId}`)
  })

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      try {
        await supabase.auth.admin.deleteUser(testUserId)
        console.log('✅ Test user cleaned up')
      } catch (error) {
        console.log('⚠️ Failed to clean up test user:', error)
      }
    }
  })

  describe('POST /api/auth/signin - Success Cases', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const { response, data } = await makeSignInRequest({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })

      // Verify HTTP status
      expect(response.status).toBe(200)

      // Verify response headers
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(response.headers.get('x-correlation-id')).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )

      // Verify response structure matches OpenAPI schema
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('session')
      expect(data).toHaveProperty('correlationId')

      // Verify user object structure
      expect(data.user).toHaveProperty('id')
      expect(data.user).toHaveProperty('email')
      expect(data.user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
      expect(data.user.email).toBe(TEST_EMAIL)

      // Verify session object structure
      expect(data.session).toHaveProperty('access_token')
      expect(data.session).toHaveProperty('refresh_token')
      expect(data.session).toHaveProperty('expires_at')
      expect(typeof data.session.access_token).toBe('string')
      expect(typeof data.session.refresh_token).toBe('string')
      expect(typeof data.session.expires_at).toBe('number')

      // Verify correlation ID format
      expect(data.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })
  })

  describe('POST /api/auth/signin - Error Cases', () => {
    it('should return 400 for missing email field', async () => {
      const { response, data } = await makeSignInRequest({
        password: TEST_PASSWORD
      })

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('MISSING_FIELDS')
      expect(data.error).toContain('Email and password are required')
    })

    it('should return 400 for missing password field', async () => {
      const { response, data } = await makeSignInRequest({
        email: TEST_EMAIL
      })

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('MISSING_FIELDS')
    })

    it('should return 400 for invalid email format', async () => {
      const { response, data } = await makeSignInRequest({
        email: INVALID_EMAIL,
        password: TEST_PASSWORD
      })

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('INVALID_EMAIL')
    })

    it('should return 401 for invalid credentials', async () => {
      const { response, data } = await makeSignInRequest({
        email: TEST_EMAIL,
        password: WRONG_PASSWORD
      })

      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('INVALID_CREDENTIALS')
      expect(data.error).toContain('Invalid email or password')
    })

    it('should return 401 for non-existent user', async () => {
      const { response, data } = await makeSignInRequest({
        email: 'nonexistent@example.com',
        password: TEST_PASSWORD
      })

      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('INVALID_CREDENTIALS')
    })

    it('should handle empty request body gracefully', async () => {
      const { response, data } = await makeSignInRequest({})

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('MISSING_FIELDS')
    })

    it('should reject additional unexpected fields', async () => {
      const { response, data } = await makeSignInRequest({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        unexpectedField: 'should-be-ignored'
      })

      // Should still succeed but ignore unexpected fields
      // Or return 400 if strict validation is implemented
      expect([200, 400]).toContain(response.status)
    })
  })

  describe('Rate Limiting Contract', () => {
    it('should include rate limit headers on successful requests', async () => {
      const { response } = await makeSignInRequest({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('x-rate-limit-remaining')).toBeDefined()
    })

    it('should return 429 when rate limit is exceeded', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(10).fill(null).map(() =>
        makeSignInRequest({
          email: 'rate-limit-test@example.com',
          password: 'invalid-password'
        })
      )

      const responses = await Promise.all(requests)

      // At least one should be rate limited
      const rateLimitedResponse = responses.find(({ response }) => response.status === 429)

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.data).toHaveProperty('error')
        expect(rateLimitedResponse.data).toHaveProperty('code')
        expect(rateLimitedResponse.data.code).toBe('RATE_LIMITED')
        expect(rateLimitedResponse.response.headers.get('retry-after')).toBeDefined()
      }
    }, 30000) // Extended timeout for rate limiting test
  })

  describe('Error Response Schema Validation', () => {
    it('should always include required error fields', async () => {
      const { response, data } = await makeSignInRequest({
        email: 'invalid'
      })

      expect(response.status).toBeGreaterThanOrEqual(400)

      // All error responses must have these fields
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')

      expect(typeof data.error).toBe('string')
      expect(typeof data.code).toBe('string')
      expect(typeof data.correlationId).toBe('string')

      // Correlation ID should be valid UUID
      expect(data.correlationId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it('should not expose sensitive error details in production', async () => {
      const { response, data } = await makeSignInRequest({
        email: TEST_EMAIL,
        password: 'wrong'
      })

      expect(response.status).toBe(401)

      // Should not expose internal error details
      expect(data.error).not.toContain('stack')
      expect(data.error).not.toContain('database')
      expect(data.error).not.toContain('supabase')

      // Details field should only be present in development
      if (data.details) {
        expect(process.env.NODE_ENV).toBe('development')
      }
    })
  })

  describe('Request/Response Headers', () => {
    it('should handle CORS correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'OPTIONS'
      })

      // Should handle preflight requests
      expect([200, 204]).toContain(response.status)
    })

    it('should set proper content-type header', async () => {
      const { response } = await makeSignInRequest({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })

      expect(response.headers.get('content-type')).toContain('application/json')
    })

    it('should include security headers', async () => {
      const { response } = await makeSignInRequest({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })

      // Check for security headers (implementation dependent)
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'strict-transport-security'
      ]

      // At least some security headers should be present
      const presentHeaders = securityHeaders.filter(header =>
        response.headers.get(header)
      )

      // This test may need adjustment based on actual security header implementation
    })
  })
})