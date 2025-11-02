/**
 * Script to create a super admin user in ScaleKit
 * This creates the user and sets up admin privileges
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

async function createSuperAdmin() {
  console.log('🔧 Creating super admin user for EzEdit...\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const adminEmail = 'james@ekaty.com'
  const adminPassword = 'pa$$word'

  try {
    // Check if user already exists
    console.log('📋 Checking if user exists...')
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail)

    if (existingUser) {
      console.log('✅ User already exists:', adminEmail)
      console.log('   User ID:', existingUser.id)
      
      // Update user to ensure they're confirmed
      await supabase.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true
      })
      
      // Set up admin profile
      await setupAdminProfile(existingUser.id, adminEmail)
      
      console.log('\n🎉 Super admin user is ready!')
      console.log('\n🔑 Login credentials:')
      console.log(`   Email: ${adminEmail}`)
      console.log(`   Password: ${adminPassword}`)
      console.log('\n📍 Login URL: http://localhost:3002/auth/signin')
      return
    }

    // Create new user using admin API
    console.log('🆕 Creating new super admin user...')
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'superadmin',
        isSuperAdmin: true,
        paywallBypass: true
      }
    })

    if (userError) {
      console.error('❌ Error creating auth user:', userError.message)
      return
    }

    console.log('✅ Auth user created:', userData.user.id)
    
    // Set up admin profile
    await setupAdminProfile(userData.user.id, adminEmail)

    console.log('\n🎉 Super admin user created successfully!')
    console.log('\n🔑 Login credentials:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('\n📍 Login URL: http://localhost:3002/auth/signin')
    console.log('\n⚡ This user has:')
    console.log('   ✅ Super admin role')
    console.log('   ✅ Full access to all features')
    console.log('   ✅ No paywall restrictions')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    console.error(error)
  }
}

async function setupAdminProfile(userId, email) {
  console.log('🔧 Setting up admin profile...')
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Check if profile exists in user_profiles table
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const profileData = {
    user_id: userId,
    email: email,
    role: 'superadmin',
    subscription_tier: 'enterprise', // Enterprise tier for no paywall
    is_active: true,
    metadata: {
      isSuperAdmin: true,
      paywallBypass: true,
      createdAt: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  }

  if (existingProfile) {
    // Update existing profile
    const { error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('user_id', userId)
    
    if (error) {
      console.warn('⚠️  Could not update profile:', error.message)
    } else {
      console.log('✅ Admin profile updated')
    }
  } else {
    // Create new profile
    profileData.created_at = new Date().toISOString()
    const { error } = await supabase
      .from('user_profiles')
      .insert(profileData)
    
    if (error) {
      console.warn('⚠️  Could not create profile:', error.message)
      console.warn('   This is okay - profile will be created on first login')
    } else {
      console.log('✅ Admin profile created')
    }
  }
}

createSuperAdmin()

