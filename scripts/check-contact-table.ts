/**
 * Quick script to check if contact_submissions table exists
 * Run with: npx tsx scripts/check-contact-table.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
  console.log('🔍 Checking if contact_submissions table exists...\n')
  
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('contact_submissions')
      .select('id')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.error('❌ Table does not exist!')
        console.error('\n📋 To fix this, run the migration:')
        console.error('   1. Go to Supabase Dashboard → SQL Editor')
        console.error('   2. Copy contents of: supabase/migrations/004_contact_submissions.sql')
        console.error('   3. Paste and run the SQL')
        console.error('\n💡 Error details:', error.message)
        process.exit(1)
      } else {
        console.error('❌ Error accessing table:', error.message)
        console.error('   Code:', error.code)
        process.exit(1)
      }
    } else {
      console.log('✅ Table exists!')
      console.log('✅ Contact form is ready to use')
      
      // Try to get count
      const { count } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
      
      console.log(`📊 Current submissions: ${count || 0}`)
    }
  } catch (err: any) {
    console.error('❌ Unexpected error:', err.message)
    process.exit(1)
  }
}

checkTable()









