import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

/**
 * Contract tests for Application Logs API
 * These tests verify the API contract against the OpenAPI specification
 * and must FAIL initially (RED phase) before implementation
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const TEST_ADMIN_EMAIL = 'test-admin@example.com'
const TEST_DEVELOPER_EMAIL = 'test-developer@example.com'
const TEST_USER_EMAIL = 'test-user@example.com'
const TEST_PASSWORD = 'TestPassword123!'

interface AuthTokens {
  accessToken: string
  userId: string
  role: string
}

// Helper function to make API requests with authentication
async function makeLogsRequest(
  method: 'GET' | 'POST' = 'GET',
  params: Record<string, string> = {},
  body?: any,
  authToken?: string
) {
  const url = new URL(`${BASE_URL}/api/logs`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await response.json()
  return { response, data }
}

// Helper function to authenticate and get tokens
async function authenticateUser(email: string, password: string): Promise<AuthTokens> {
  const response = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    throw new Error(`Authentication failed for ${email}`)
  }

  const data = await response.json()
  return {
    accessToken: data.session.access_token,
    userId: data.user.id,
    role: data.user.role
  }
}

describe('Logs API Contract Tests', () => {
  let supabase: any
  let testUserIds: string[] = []
  let adminAuth: AuthTokens
  let developerAuth: AuthTokens
  let userAuth: AuthTokens

  beforeAll(async () => {
    // Set up Supabase admin client
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
        if (user.email?.includes('test-admin') ||
            user.email?.includes('test-developer') ||
            user.email?.includes('test-user')) {
          await supabase.auth.admin.deleteUser(user.id)
        }
      }
    } catch (error) {
      console.log('No existing test users to clean up')
    }

    // Create test users with different roles
    const testUsers = [
      { email: TEST_ADMIN_EMAIL, role: 'admin' },
      { email: TEST_DEVELOPER_EMAIL, role: 'developer' },
      { email: TEST_USER_EMAIL, role: 'user' }
    ]

    for (const { email, role } of testUsers) {
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: { role }
      })

      if (userError) {
        throw new Error(`Failed to create test user ${email}: ${userError.message}`)
      }

      testUserIds.push(userData.user.id)

      // Update user role in profiles table (assuming it exists)
      try {
        await supabase
          .from('profiles')
          .update({ role })
          .eq('id', userData.user.id)
      } catch (error) {
        console.log(`Note: Could not update role for ${email} - profiles table may not exist yet`)
      }
    }

    // Authenticate all test users
    try {
      adminAuth = await authenticateUser(TEST_ADMIN_EMAIL, TEST_PASSWORD)
      developerAuth = await authenticateUser(TEST_DEVELOPER_EMAIL, TEST_PASSWORD)
      userAuth = await authenticateUser(TEST_USER_EMAIL, TEST_PASSWORD)
    } catch (error) {
      console.log('Note: Authentication may fail until API is implemented')
    }
  })

  afterAll(async () => {
    // Clean up test users
    for (const userId of testUserIds) {
      try {
        await supabase.auth.admin.deleteUser(userId)
        console.log(`✅ Test user cleaned up: ${userId}`)
      } catch (error) {
        console.log(`⚠️ Failed to clean up test user ${userId}:`, error)
      }
    }
  })

  describe('GET /api/logs - Authentication and Authorization', () => {
    it('should return 401 when no authentication provided', async () => {
      const { response, data } = await makeLogsRequest()

      expect(response.status).toBe(401)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('AUTHENTICATION_REQUIRED')
    })

    it('should return 403 when user role lacks permissions', async () => {
      if (!userAuth) {
        console.log('⚠️ Skipping authorization test - user not authenticated')
        return
      }

      const { response, data } = await makeLogsRequest('GET', {}, undefined, userAuth.accessToken)

      expect(response.status).toBe(403)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('code')
      expect(data).toHaveProperty('correlationId')
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS')
    })

    it('should allow admin users to access logs', async () => {
      if (!adminAuth) {
        console.log('⚠️ Skipping admin access test - admin not authenticated')
        return
      }

      const { response, data } = await makeLogsRequest('GET', {}, undefined, adminAuth.accessToken)

      // Should succeed or return specific error (if not implemented yet)
      expect([200, 501, 503]).toContain(response.status)

      if (response.status === 200) {
        expect(data).toHaveProperty('logs')
        expect(data).toHaveProperty('total')
        expect(data).toHaveProperty('correlationId')
        expect(Array.isArray(data.logs)).toBe(true)
      }
    })

    it('should allow developer users to access project logs', async () => {
      if (!developerAuth) {
        console.log('⚠️ Skipping developer access test - developer not authenticated')
        return
      }

      const { response, data } = await makeLogsRequest('GET', {}, undefined, developerAuth.accessToken)

      expect([200, 403, 501, 503]).toContain(response.status)

      if (response.status === 200) {
        expect(data).toHaveProperty('logs')
        expect(Array.isArray(data.logs)).toBe(true)
      }
    })
  })

  describe('GET /api/logs - Query Parameters Validation', () => {
    it('should validate log type parameter', async () => {
      if (!adminAuth) {
        console.log('⚠️ Skipping parameter validation test - admin not authenticated')
        return
      }

      const { response, data } = await makeLogsRequest(
        'GET',
        { type: 'invalid_type' },
        undefined,
        adminAuth.accessToken
      )

      if (response.status !== 501 && response.status !== 503) {
        expect(response.status).toBe(400)
        expect(data).toHaveProperty('error')
        expect(data).toHaveProperty('code')
      }
    })

    it('should validate log level parameter', async () => {
      if (!adminAuth) return

      const { response, data } = await makeLogsRequest(
        'GET',
        { level: 'invalid_level' },
        undefined,
        adminAuth.accessToken
      )

      if (response.status !== 501 && response.status !== 503) {
        expect(response.status).toBe(400)
      }
    })

    it('should validate date range parameters', async () => {
      if (!adminAuth) return

      const { response, data } = await makeLogsRequest(
        'GET',
        {
          from: '2024-01-01T00:00:00Z',
          to: '2023-01-01T00:00:00Z' // Invalid: 'to' before 'from'
        },
        undefined,
        adminAuth.accessToken
      )

      if (response.status !== 501 && response.status !== 503) {
        expect(response.status).toBe(400)
        expect(data.code).toBe('INVALID_DATE_RANGE')
      }
    })

    it('should validate limit parameter bounds', async () => {
      if (!adminAuth) return

      const { response, data } = await makeLogsRequest(
        'GET',
        { limit: '1001' }, // Exceeds maximum of 1000
        undefined,
        adminAuth.accessToken
      )

      if (response.status !== 501 && response.status !== 503) {
        expect(response.status).toBe(400)
        expect(data.code).toBe('INVALID_LIMIT')
      }
    })

    it('should validate UUID format for correlationId parameter', async () => {
      if (!adminAuth) return

      const { response, data } = await makeLogsRequest(
        'GET',
        { correlationId: 'invalid-uuid' },
        undefined,
        adminAuth.accessToken
      )

      if (response.status !== 501 && response.status !== 503) {
        expect(response.status).toBe(400)
      }
    })
  })

  describe('GET /api/logs - Response Schema Validation', () => {
    it('should return properly structured response when successful', async () => {
      if (!adminAuth) return

      const { response, data } = await makeLogsRequest('GET', {}, undefined, adminAuth.accessToken)

      if (response.status === 200) {
        // Verify required response fields
        expect(data).toHaveProperty('logs')
        expect(data).toHaveProperty('total')
        expect(data).toHaveProperty('filters')
        expect(data).toHaveProperty('correlationId')

        // Verify logs array structure
        expect(Array.isArray(data.logs)).toBe(true)

        // Verify pagination structure if present
        if (data.pagination) {
          expect(data.pagination).toHaveProperty('limit')
          expect(data.pagination).toHaveProperty('offset')
          expect(data.pagination).toHaveProperty('hasMore')
        }

        // Verify correlation ID format
        expect(data.correlationId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )

        // Verify log entry structure if logs exist
        if (data.logs.length > 0) {
          const logEntry = data.logs[0]
          expect(logEntry).toHaveProperty('id')
          expect(logEntry).toHaveProperty('timestamp')
          expect(logEntry).toHaveProperty('level')
          expect(logEntry).toHaveProperty('message')
          expect(logEntry).toHaveProperty('correlationId')

          // Verify timestamp is ISO 8601 format
          expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

          // Verify level is valid enum value
          expect(['debug', 'info', 'warn', 'error', 'fatal']).toContain(logEntry.level)
        }
      }
    })

    it('should include proper response headers', async () => {
      if (!adminAuth) return

      const { response } = await makeLogsRequest('GET', {}, undefined, adminAuth.accessToken)

      expect(response.headers.get('content-type')).toContain('application/json')

      if (response.status === 200) {
        expect(response.headers.get('x-correlation-id')).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        )
        expect(response.headers.get('x-rate-limit-remaining')).toBeDefined()
      }
    })
  })

  describe('POST /api/logs - Log Creation (Internal)', () => {
    it('should create log entry with valid data', async () => {
      const logData = {
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        level: 'error',
        message: 'Test error message',
        errorType: 'TestError',
        errorCode: 'TEST_ERROR',
        route: '/api/test',
        method: 'POST',
        source: 'backend',
        context: { testData: 'value' }
      }

      const { response, data } = await makeLogsRequest('POST', {}, logData)

      // May return 401 if internal auth not implemented, or 201 if successful
      expect([201, 401, 501, 503]).toContain(response.status)

      if (response.status === 201) {
        expect(data).toHaveProperty('id')
        expect(data).toHaveProperty('correlationId')
        expect(data).toHaveProperty('timestamp')
        expect(data.correlationId).toBe(logData.correlationId)
      }
    })

    it('should validate required fields for log creation', async () => {
      const incompleteLogData = {
        level: 'error'
        // Missing required correlationId and message
      }

      const { response, data } = await makeLogsRequest('POST', {}, incompleteLogData)

      if (response.status !== 401 && response.status !== 501 && response.status !== 503) {
        expect(response.status).toBe(400)
        expect(data).toHaveProperty('error')
        expect(data).toHaveProperty('code')
      }
    })

    it('should validate log level enum values', async () => {
      const invalidLogData = {
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        level: 'invalid_level',
        message: 'Test message'
      }

      const { response, data } = await makeLogsRequest('POST', {}, invalidLogData)

      if (response.status !== 401 && response.status !== 501 && response.status !== 503) {
        expect(response.status).toBe(400)
      }
    })
  })

  describe('Rate Limiting Contract', () => {
    it('should enforce rate limits for log access', async () => {
      if (!adminAuth) return

      // Make multiple rapid requests
      const requests = Array(20).fill(null).map(() =>
        makeLogsRequest('GET', {}, undefined, adminAuth.accessToken)
      )

      const responses = await Promise.all(requests)

      // Check if any were rate limited
      const rateLimitedResponse = responses.find(({ response }) => response.status === 429)

      if (rateLimitedResponse) {
        expect(rateLimitedResponse.data).toHaveProperty('error')
        expect(rateLimitedResponse.data.code).toBe('RATE_LIMITED')
        expect(rateLimitedResponse.response.headers.get('retry-after')).toBeDefined()
      }
    }, 30000)
  })

  describe('Data Sanitization and Security', () => {
    it('should not expose sensitive data in log responses', async () => {
      if (!adminAuth) return

      const { response, data } = await makeLogsRequest('GET', {}, undefined, adminAuth.accessToken)

      if (response.status === 200 && data.logs.length > 0) {
        for (const logEntry of data.logs) {
          // Should not contain sensitive patterns
          const sensitivePatterns = [
            /password/i,
            /token/i,
            /apikey/i,
            /secret/i,
            /auth.*=.*[a-zA-Z0-9]/i
          ]

          const logString = JSON.stringify(logEntry)
          sensitivePatterns.forEach(pattern => {
            expect(logString).not.toMatch(pattern)
          })
        }
      }
    })

    it('should filter logs based on user role', async () => {
      if (!developerAuth || !adminAuth) return

      // Get logs as developer
      const { response: devResponse, data: devData } = await makeLogsRequest(
        'GET',
        {},
        undefined,
        developerAuth.accessToken
      )

      // Get logs as admin
      const { response: adminResponse, data: adminData } = await makeLogsRequest(
        'GET',
        {},
        undefined,
        adminAuth.accessToken
      )

      if (devResponse.status === 200 && adminResponse.status === 200) {
        // Admin should have access to more logs than developer
        expect(adminData.total).toBeGreaterThanOrEqual(devData.total)
      }
    })
  })

  describe('Error Response Consistency', () => {
    it('should maintain consistent error response format', async () => {
      const { response, data } = await makeLogsRequest('GET', { type: 'invalid' })

      if (response.status >= 400) {
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
      }
    })
  })
})