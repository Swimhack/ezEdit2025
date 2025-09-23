/**
 * Environment Variable Validation and Setup
 * Enterprise-grade configuration management with validation
 */

import { z } from 'zod'

// Environment schema definition
const envSchema = z.object({
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .refine(url => url.includes('supabase.co'), 'Must be a valid Supabase URL'),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    .refine(key => key.startsWith('eyJ'), 'Must be a valid JWT token'),

  SUPABASE_SERVICE_ROLE_KEY: z.string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required')
    .refine(key => key.startsWith('eyJ'), 'Must be a valid JWT token')
    .optional(),

  // Application configuration
  NODE_ENV: z.enum(['development', 'production', 'test'])
    .default('development'),

  NEXT_PUBLIC_APP_URL: z.string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .optional(),

  // Security configuration
  NEXTAUTH_SECRET: z.string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters')
    .optional(),

  NEXTAUTH_URL: z.string()
    .url('NEXTAUTH_URL must be a valid URL')
    .optional(),

  // Rate limiting (optional)
  UPSTASH_REDIS_REST_URL: z.string()
    .url('UPSTASH_REDIS_REST_URL must be a valid URL')
    .optional(),

  UPSTASH_REDIS_REST_TOKEN: z.string()
    .min(1, 'UPSTASH_REDIS_REST_TOKEN is required when Redis URL is provided')
    .optional(),

  // Email service (optional)
  RESEND_API_KEY: z.string()
    .startsWith('re_', 'RESEND_API_KEY must start with "re_"')
    .optional(),

  // Monitoring and logging (optional)
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug'])
    .default('info'),

  ENABLE_REQUEST_LOGGING: z.string()
    .transform(val => val === 'true')
    .default('false'),

  // GitHub integration (optional)
  GITHUB_TOKEN: z.string()
    .startsWith('ghp_', 'GITHUB_TOKEN must start with "ghp_"')
    .optional(),

  GITHUB_REPO: z.string()
    .regex(/^[\w.-]+\/[\w.-]+$/, 'GITHUB_REPO must be in format "owner/repo"')
    .optional(),

  // Fly.io deployment (optional)
  FLY_API_TOKEN: z.string()
    .startsWith('FlyV1', 'FLY_API_TOKEN must start with "FlyV1"')
    .optional(),

  // Testing environment
  TEST_SUPABASE_URL: z.string()
    .url('TEST_SUPABASE_URL must be a valid URL')
    .optional(),

  TEST_SUPABASE_ANON_KEY: z.string()
    .min(1, 'TEST_SUPABASE_ANON_KEY is required')
    .optional()
})

// Derived environment schema for runtime
const runtimeEnvSchema = envSchema.extend({
  // Computed values
  IS_PRODUCTION: z.boolean(),
  IS_DEVELOPMENT: z.boolean(),
  IS_TEST: z.boolean(),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().url()
})

export type EnvConfig = z.infer<typeof envSchema>
export type RuntimeEnvConfig = z.infer<typeof runtimeEnvSchema>

/**
 * Validate environment variables and return typed configuration
 */
export function validateEnvironment(): RuntimeEnvConfig {
  try {
    // Parse and validate environment variables
    const env = envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      LOG_LEVEL: process.env.LOG_LEVEL,
      ENABLE_REQUEST_LOGGING: process.env.ENABLE_REQUEST_LOGGING,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      GITHUB_REPO: process.env.GITHUB_REPO,
      FLY_API_TOKEN: process.env.FLY_API_TOKEN,
      TEST_SUPABASE_URL: process.env.TEST_SUPABASE_URL,
      TEST_SUPABASE_ANON_KEY: process.env.TEST_SUPABASE_ANON_KEY
    })

    // Add computed values
    const runtimeEnv: RuntimeEnvConfig = {
      ...env,
      IS_PRODUCTION: env.NODE_ENV === 'production',
      IS_DEVELOPMENT: env.NODE_ENV === 'development',
      IS_TEST: env.NODE_ENV === 'test',
      APP_URL: env.NEXT_PUBLIC_APP_URL ||
        (env.NODE_ENV === 'production' ? 'https://ezedit.fly.dev' : 'http://localhost:3000'),
      DATABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL
    }

    return runtimeEnv
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join('\n')

      throw new Error(
        `Environment validation failed:\n${missingVars}\n\n` +
        'Please check your .env.local file and ensure all required variables are set correctly.'
      )
    }
    throw error
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = validateEnvironment()

  return {
    // Supabase configuration
    supabase: {
      url: env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: env.SUPABASE_SERVICE_ROLE_KEY
    },

    // Application settings
    app: {
      url: env.APP_URL,
      nodeEnv: env.NODE_ENV,
      isProduction: env.IS_PRODUCTION,
      isDevelopment: env.IS_DEVELOPMENT,
      isTest: env.IS_TEST
    },

    // Security settings
    security: {
      nextAuthSecret: env.NEXTAUTH_SECRET,
      nextAuthUrl: env.NEXTAUTH_URL || env.APP_URL
    },

    // Rate limiting
    rateLimit: {
      enabled: !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
      redisUrl: env.UPSTASH_REDIS_REST_URL,
      redisToken: env.UPSTASH_REDIS_REST_TOKEN
    },

    // Email service
    email: {
      enabled: !!env.RESEND_API_KEY,
      apiKey: env.RESEND_API_KEY
    },

    // Logging
    logging: {
      level: env.LOG_LEVEL,
      enableRequestLogging: env.ENABLE_REQUEST_LOGGING
    },

    // GitHub integration
    github: {
      enabled: !!(env.GITHUB_TOKEN && env.GITHUB_REPO),
      token: env.GITHUB_TOKEN,
      repo: env.GITHUB_REPO
    },

    // Deployment
    deployment: {
      flyToken: env.FLY_API_TOKEN,
      platform: env.FLY_API_TOKEN ? 'fly.io' : 'unknown'
    },

    // Testing
    testing: {
      supabaseUrl: env.TEST_SUPABASE_URL,
      supabaseKey: env.TEST_SUPABASE_ANON_KEY
    }
  }
}

/**
 * Validate specific environment variable
 */
export function validateEnvVar(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Environment variable ${name} is required but not set`)
  }
  return value
}

/**
 * Check if all required variables are present for a feature
 */
export function checkFeatureRequirements(feature: string): boolean {
  const config = getEnvironmentConfig()

  switch (feature) {
    case 'authentication':
      return !!(config.supabase.url && config.supabase.anonKey)

    case 'rate-limiting':
      return config.rateLimit.enabled

    case 'email':
      return config.email.enabled

    case 'github-integration':
      return config.github.enabled

    case 'deployment':
      return !!config.deployment.flyToken

    default:
      return false
  }
}

/**
 * Generate environment template for development
 */
export function generateEnvTemplate(): string {
  return `# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Security Configuration (Production)
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
NEXTAUTH_URL=http://localhost:3000

# Rate Limiting (Optional)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Email Service (Optional)
RESEND_API_KEY=re_your-resend-api-key

# Logging Configuration
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=false

# GitHub Integration (Optional)
GITHUB_TOKEN=ghp_your-github-token
GITHUB_REPO=owner/repository

# Deployment (Optional)
FLY_API_TOKEN=FlyV1_your-fly-token

# Testing (Optional)
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your-test-anon-key`
}

/**
 * Log configuration status (safe for production)
 */
export function logConfigurationStatus(): void {
  try {
    const config = getEnvironmentConfig()

    console.info('🔧 Environment Configuration:')
    console.info(`  📦 Environment: ${config.app.nodeEnv}`)
    console.info(`  🌐 App URL: ${config.app.url}`)
    console.info(`  🔐 Authentication: ${config.supabase.url ? '✅ Configured' : '❌ Missing'}`)
    console.info(`  🛡️  Rate Limiting: ${config.rateLimit.enabled ? '✅ Enabled' : '🔇 Disabled'}`)
    console.info(`  📧 Email Service: ${config.email.enabled ? '✅ Enabled' : '🔇 Disabled'}`)
    console.info(`  📊 GitHub Integration: ${config.github.enabled ? '✅ Enabled' : '🔇 Disabled'}`)
    console.info(`  🚀 Deployment: ${config.deployment.platform}`)

  } catch (error) {
    console.error('❌ Configuration validation failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

// Validate environment on module load (except in test environment)
if (process.env.NODE_ENV !== 'test') {
  try {
    validateEnvironment()

    // Log configuration in development
    if (process.env.NODE_ENV === 'development') {
      logConfigurationStatus()
    }
  } catch (error) {
    console.error('Environment validation failed on startup:', error)

    if (process.env.NODE_ENV === 'development') {
      console.info('\n📝 Example .env.local file:')
      console.info(generateEnvTemplate())
    }
  }
}