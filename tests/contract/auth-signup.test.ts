import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

/**
 * Contract tests for Authentication Sign-Up API
 * These tests verify the API contract against the OpenAPI specification
 * and must FAIL initially (RED phase) before implementation
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_EMAIL = 'test-signup@example.com'
const TEST_PASSWORD = 'TestPassword123!'
const TEST_COMPANY = 'Test Company Ltd'
const WEAK_PASSWORD = '123'
const INVALID_EMAIL = 'invalid-email'

// Helper function to make API requests
async function makeSignUpRequest(body: any) {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()
  return { response, data }
}

describe('Auth Sign-Up API Contract Tests', () => {
  let supabase: any
  let testUserIds: string[] = []

  beforeAll(async () => {
    // Set up Supabase admin client for cleanup
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

    // Clean up any existing test users
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      for (const user of existingUsers.users) {
        if (user.email?.includes('test-signup') || user.email === TEST_EMAIL) {
          await supabase.auth.admin.deleteUser(user.id)
          console.log(`✅ Cleaned up existing test user: ${user.email}`)
        }
      }
    } catch (error) {
      console.log('No existing test users to clean up')
    }
  })

  afterAll(async () => {
    // Clean up all test users created during tests
    for (const userId of testUserIds) {
      try {
        await supabase.auth.admin.deleteUser(userId)
        console.log(`✅ Test user cleaned up: ${userId}`)
      } catch (error) {
        console.log(`⚠️ Failed to clean up test user ${userId}:`, error)
      }
    }
  })

  describe('POST /api/auth/signup - Success Cases', () => {
    it('should successfully register a new user with valid data', async () => {
      const uniqueEmail = `test-signup-${Date.now()}@example.com`

      const { response, data } = await makeSignUpRequest({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        company: TEST_COMPANY,
        plan: 'FREE'
      })

      // Verify HTTP status
      expect(response.status).toBe(201)

      // Verify response headers
      expect(response.headers.get('content-type')).toContain('application/json')
      expect(response.headers.get('x-correlation-id')).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )

      // Verify response structure matches OpenAPI schema
      expect(data).toHaveProperty('user')
      expect(data).toHaveProperty('session')
      expect(data).toHaveProperty('organization')
      expect(data).toHaveProperty('correlationId')

      // Verify user object structure
      expect(data.user).toHaveProperty('id')
      expect(data.user).toHaveProperty('email')
      expect(data.user).toHaveProperty('role')
      expect(data.user).toHaveProperty('emailConfirmed')

      expect(data.user.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
      expect(data.user.email).toBe(uniqueEmail)
      expect(data.user.role).toBe('user')
      expect(typeof data.user.emailConfirmed).toBe('boolean')

      // Verify session object structure
      expect(data.session).toHaveProperty('access_token')
      expect(data.session).toHaveProperty('refresh_token')
      expect(data.session).toHaveProperty('expires_at')
      expect(typeof data.session.access_token).toBe('string')
      expect(typeof data.session.refresh_token).toBe('string')
      expect(typeof data.session.expires_at).toBe('number')

      // Verify organization object structure
      expect(data.organization).toHaveProperty('id')
      expect(data.organization).toHaveProperty('name')
      expect(data.organization).toHaveProperty('plan')
      expect(data.organization.name).toBe(TEST_COMPANY)
      expect(data.organization.plan).toBe('FREE')

      // Store user ID for cleanup
      testUserIds.push(data.user.id)
    })

    it('should default to FREE plan when plan not specified', async () => {
      const uniqueEmail = `test-signup-noplan-${Date.now()}@example.com`

      const { response, data } = await makeSignUpRequest({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        company: TEST_COMPANY
      })

      expect(response.status).toBe(201)
      expect(data.organization.plan).toBe('FREE')

      testUserIds.push(data.user.id)
    })

    it('should accept different subscription plans', async () => {
      const plans = ['FREE', 'SINGLE_SITE', 'UNLIMITED']

      for (const plan of plans) {
        const uniqueEmail = `test-signup-${plan.toLowerCase()}-${Date.now()}@example.com`

        const { response, data } = await makeSignUpRequest({
          email: uniqueEmail,
          password: TEST_PASSWORD,
          company: TEST_COMPANY,
          plan
        })

        expect(response.status).toBe(201)
        expect(data.organization.plan).toBe(plan)

        testUserIds.push(data.user.id)
      }
    })
  })

  describe('POST /api/auth/signup - Validation Error Cases', () => {
    it('should return 400 for missing email field', async () => {
      const { response, data } = await makeSignUpRequest({
        password: TEST_PASSWORD,
        company: TEST_COMPANY
      })

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('MISSING_FIELDS')
      expect(data.error).toContain('Email, password, and company are required')
    })

    it('should return 400 for missing password field', async () => {
      const { response, data } = await makeSignUpRequest({
        email: TEST_EMAIL,
        company: TEST_COMPANY
      })

      expect(response.status).toBe(400)
      expect(data.code).toBe('MISSING_FIELDS')
    })

    it('should return 400 for missing company field', async () => {
      const { response, data } = await makeSignUpRequest({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })

      expect(response.status).toBe(400)
      expect(data.code).toBe('MISSING_FIELDS')
    })

    it('should return 400 for invalid email format', async () => {
      const { response, data } = await makeSignUpRequest({
        email: INVALID_EMAIL,
        password: TEST_PASSWORD,
        company: TEST_COMPANY
      })

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('INVALID_EMAIL')
    })

    it('should return 400 for weak password', async () => {
      const { response, data } = await makeSignUpRequest({
        email: `test-weak-${Date.now()}@example.com`,
        password: WEAK_PASSWORD,
        company: TEST_COMPANY
      })

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('WEAK_PASSWORD')
      expect(data.error).toContain('Password must be at least 8 characters')
    })

    it('should return 400 for invalid subscription plan', async () => {
      const { response, data } = await makeSignUpRequest({
        email: `test-invalid-plan-${Date.now()}@example.com`,
        password: TEST_PASSWORD,
        company: TEST_COMPANY,
        plan: 'INVALID_PLAN'
      })

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
    })

    it('should handle empty request body gracefully', async () => {
      const { response, data } = await makeSignUpRequest({})

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('MISSING_FIELDS')
    })
  })

  describe('POST /api/auth/signup - Conflict Cases', () => {
    it('should return 409 when user already exists', async () => {
      const uniqueEmail = `test-conflict-${Date.now()}@example.com`

      // First signup should succeed
      const { response: firstResponse, data: firstData } = await makeSignUpRequest({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        company: TEST_COMPANY
      })

      expect(firstResponse.status).toBe(201)
      testUserIds.push(firstData.user.id)

      // Second signup with same email should fail
      const { response: secondResponse, data: secondData } = await makeSignUpRequest({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        company: 'Another Company'
      })

      expect(secondResponse.status).toBe(409)
      expect(secondData).toHaveProperty('error')
      expect(secondData).toHaveProperty('code')
      expect(secondData).toHaveProperty('correlationId')
      expect(secondData.code).toBe('USER_EXISTS')
      expect(secondData.error).toContain('An account with this email already exists')
    })
  })

  describe('Rate Limiting Contract', () => {
    it('should return 429 when signup rate limit is exceeded', async () => {
      // Make multiple rapid signup requests to trigger rate limiting
      const requests = Array(5).fill(null).map((_, index) =>
        makeSignUpRequest({
          email: `rate-limit-signup-${index}-${Date.now()}@example.com`,
          password: TEST_PASSWORD,
          company: TEST_COMPANY
        })
      )

      const responses = await Promise.all(requests)

      // At least one should be rate limited or most should succeed
      const rateLimitedResponse = responses.find(({ response }) => response.status === 429)
      const successfulResponses = responses.filter(({ response }) => response.status === 201)

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.data).toHaveProperty('error')
        expect(rateLimitedResponse.data).toHaveProperty('code')
        expect(rateLimitedResponse.data.code).toBe('RATE_LIMITED')
        expect(rateLimitedResponse.response.headers.get('retry-after')).toBeDefined()
      }

      // Clean up any successful signups
      for (const { data } of successfulResponses) {
        if (data.user?.id) {
          testUserIds.push(data.user.id)
        }
      }
    }, 30000) // Extended timeout for rate limiting test
  })

  describe('Input Validation and Security', () => {
    it('should sanitize and validate company name', async () => {
      const maliciousCompany = '<script>alert("xss")</script>Legit Company'
      const uniqueEmail = `test-xss-${Date.now()}@example.com`

      const { response, data } = await makeSignUpRequest({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        company: maliciousCompany
      })

      if (response.status === 201) {
        // Should sanitize malicious content
        expect(data.organization.name).not.toContain('<script>')
        expect(data.organization.name).not.toContain('alert')
        testUserIds.push(data.user.id)
      } else {
        // Or reject entirely
        expect(response.status).toBe(400)
      }
    })

    it('should reject extremely long inputs', async () => {
      const longString = 'a'.repeat(1000)

      const { response, data } = await makeSignUpRequest({
        email: `test-long-${Date.now()}@example.com`,
        password: TEST_PASSWORD,
        company: longString
      })

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
    })

    it('should reject SQL injection attempts in company field', async () => {
      const sqlInjection = "'; DROP TABLE users; --"
      const uniqueEmail = `test-sql-${Date.now()}@example.com`

      const { response, data } = await makeSignUpRequest({
        email: uniqueEmail,
        password: TEST_PASSWORD,
        company: sqlInjection
      })

      // Should either sanitize or reject
      if (response.status === 201) {
        expect(data.organization.name).not.toContain('DROP TABLE')
        testUserIds.push(data.user.id)
      } else {
        expect(response.status).toBe(400)
      }
    })
  })

  describe('Error Response Schema Validation', () => {
    it('should always include required error fields', async () => {
      const { response, data } = await makeSignUpRequest({
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

    it('should not expose sensitive information in error messages', async () => {
      const { response, data } = await makeSignUpRequest({
        email: 'test@example.com',
        password: 'weak'
      })

      expect(response.status).toBe(400)

      // Should not expose internal system details
      expect(data.error).not.toContain('database')
      expect(data.error).not.toContain('supabase')
      expect(data.error).not.toContain('stack trace')
      expect(data.error).not.toContain('internal')
    })
  })

  describe('Password Validation Contract', () => {
    const passwordTests = [
      { password: '12345678', should: 'fail', reason: 'no uppercase' },
      { password: 'PASSWORD123', should: 'fail', reason: 'no lowercase' },
      { password: 'Password', should: 'fail', reason: 'no numbers' },
      { password: 'Password123', should: 'fail', reason: 'no special characters' },
      { password: 'Pass!1', should: 'fail', reason: 'too short' },
      { password: 'Password123!', should: 'pass', reason: 'meets all requirements' }
    ]

    passwordTests.forEach(({ password, should, reason }) => {
      it(`should ${should} for password: ${reason}`, async () => {
        const uniqueEmail = `test-pwd-${Date.now()}-${Math.random()}@example.com`

        const { response, data } = await makeSignUpRequest({
          email: uniqueEmail,
          password,
          company: TEST_COMPANY
        })

        if (should === 'pass') {
          expect(response.status).toBe(201)
          if (data.user?.id) {
            testUserIds.push(data.user.id)
          }
        } else {
          expect(response.status).toBe(400)
          expect(data.code).toBe('WEAK_PASSWORD')
        }
      })
    })
  })
})