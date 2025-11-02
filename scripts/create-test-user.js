const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file manually
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    // Handle multi-line values by joining lines that don't have = sign
    const lines = envContent.split(/\r?\n/)
    let currentKey = null
    let currentValue = []
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      
      const match = trimmed.match(/^([^=]+)=(.*)$/)
      if (match) {
        // Save previous key-value pair
        if (currentKey) {
          process.env[currentKey] = currentValue.join('')
        }
        // Start new key-value pair
        currentKey = match[1].trim()
        currentValue = [match[2].trim()]
      } else if (currentKey) {
        // Continuation of previous value
        currentValue.push(trimmed)
      }
    })
    
    // Save last key-value pair
    if (currentKey) {
      process.env[currentKey] = currentValue.join('').replace(/^["']|["']$/g, '')
    }
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

async function createTestUser() {
  console.log('🔧 Creating test user for EzEdit...\n')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const testEmail = 'testuser@ezedit.co'
  const testPassword = 'TestPassword123!'

  try {
    // First try to sign in to check if user exists
    console.log('📋 Checking if user exists...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (signInData?.user) {
      console.log('✅ Test user already exists:', testEmail)
      console.log('\n🔑 Login credentials:')
      console.log(`   Email: ${testEmail}`)
      console.log(`   Password: ${testPassword}`)
      return
    }

    // Create new user using admin API
    console.log('🆕 Creating new test user...')
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })

    if (userError) {
      console.error('❌ Error creating auth user:', userError.message)
      return
    }

    console.log('✅ Auth user created:', userData.user.id)
    console.log('\n🎉 Test user created successfully!')
    console.log('\n🔑 Login credentials:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)
    console.log('\n📍 Login URL: http://localhost:3002/auth/signin')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    console.error(error)
  }
}

createTestUser()

