/**
 * Test script to troubleshoot ScaleKit authentication for james@ekaty.com
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split(/\r?\n/)
    let currentKey = null
    let currentValue = []

    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return

      const match = trimmed.match(/^([^=]+)=(.*)$/)
      if (match) {
        if (currentKey) {
          process.env[currentKey] = currentValue.join('')
        }
        currentKey = match[1].trim()
        currentValue = [match[2].trim()]
      } else if (currentKey) {
        currentValue.push(trimmed)
      }
    })

    if (currentKey) {
      process.env[currentKey] = currentValue.join('').replace(/^["']|["']$/g, '')
    }
  }
}

loadEnv()

async function testScaleKitConfig() {
  console.log('🔍 Testing ScaleKit Configuration for james@ekaty.com\n')

  const environmentUrl = process.env.SCALEKIT_ENVIRONMENT_URL
  const clientId = process.env.SCALEKIT_CLIENT_ID
  const clientSecret = process.env.SCALEKIT_CLIENT_SECRET

  console.log('📋 Configuration Check:')
  console.log('   Environment URL:', environmentUrl ? '✓ Set' : '✗ Missing')
  console.log('   Client ID:', clientId ? '✓ Set' : '✗ Missing')
  console.log('   Client Secret:', clientSecret ? '✓ Set' : '✗ Missing')
  console.log('')

  if (!environmentUrl || !clientId || !clientSecret) {
    console.error('❌ ScaleKit environment variables are missing!')
    console.error('   Please check your .env.local file')
    return
  }

  // Check for placeholders
  if (environmentUrl.includes('your-') || clientId.includes('your_') || clientSecret.includes('your_')) {
    console.error('❌ ScaleKit environment variables contain placeholder values!')
    console.error('   Please replace with actual values from ScaleKit dashboard')
    return
  }

  console.log('✅ Environment variables look valid\n')

  // Test ScaleKit SDK
  try {
    const { Scalekit } = require('@scalekit-sdk/node')
    console.log('📦 Testing ScaleKit SDK...')
    
    const scalekit = new Scalekit(environmentUrl, clientId, clientSecret)
    
    console.log('✅ ScaleKit client created successfully\n')
    
    // Test authorization URL generation
    const testRedirectUri = 'http://localhost:3002/auth/callback'
    console.log('🔗 Testing authorization URL generation...')
    console.log('   Redirect URI:', testRedirectUri)
    
    try {
      const authUrl = scalekit.getAuthorizationUrl(testRedirectUri, {
        loginHint: 'james@ekaty.com'
      })
      
      console.log('✅ Authorization URL generated successfully!')
      console.log('   URL:', authUrl.substring(0, 80) + '...')
      console.log('')
      console.log('📝 Next Steps:')
      console.log('   1. Verify callback URL is configured in ScaleKit dashboard:')
      console.log('      ', testRedirectUri)
      console.log('   2. Ensure user james@ekaty.com exists in ScaleKit')
      console.log('   3. Try logging in at: http://localhost:3002/auth/signin')
      console.log('   4. Check browser console (F12) for any errors')
      console.log('   5. Check server console for ScaleKit errors')
      
    } catch (urlError) {
      console.error('❌ Error generating authorization URL:')
      console.error('   Error:', urlError.message)
      console.error('   Stack:', urlError.stack)
      console.log('')
      console.log('💡 Common causes:')
      console.log('   - Callback URL not configured in ScaleKit dashboard')
      console.log('   - Invalid credentials')
      console.log('   - ScaleKit SDK version mismatch')
    }
    
  } catch (sdkError) {
    console.error('❌ Error initializing ScaleKit SDK:')
    console.error('   Error:', sdkError.message)
    console.error('')
    console.log('💡 Try:')
    console.log('   npm install @scalekit-sdk/node')
  }
}

testScaleKitConfig().catch(console.error)

