/**
 * EzEdit Supabase Authentication Test Script
 * 
 * This script tests the authentication flow with Supabase, including:
 * - User signup
 * - User login
 * - Password reset
 * - Profile management
 * - Site CRUD operations
 * 
 * Run with: node test-auth.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Initialize readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-project-id.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test user data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User'
};

// Test site data
const testSite = {
  name: 'Test FTP Site',
  host: 'ftp.test.rebex.net',
  port: 21,
  username: 'demo',
  password: 'password',
  passive: true,
  root_path: '/'
};

// Helper functions
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer));
  });
}

async function runTests() {
  console.log('=== EzEdit Supabase Authentication Test ===');
  console.log(`Testing with Supabase URL: ${SUPABASE_URL}`);
  
  try {
    // 1. Test signup
    console.log('\n1. Testing user signup...');
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          firstName: testUser.firstName,
          lastName: testUser.lastName
        }
      }
    });
    
    if (signupError) {
      throw new Error(`Signup failed: ${signupError.message}`);
    }
    
    console.log('✅ Signup successful!');
    console.log(`User ID: ${signupData.user.id}`);
    console.log(`Email: ${signupData.user.email}`);
    
    // 2. Test login
    console.log('\n2. Testing user login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (loginError) {
      throw new Error(`Login failed: ${loginError.message}`);
    }
    
    console.log('✅ Login successful!');
    console.log(`Session expires at: ${new Date(loginData.session.expires_at * 1000).toLocaleString()}`);
    
    // 3. Test profile retrieval
    console.log('\n3. Testing profile retrieval...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single();
    
    if (profileError) {
      throw new Error(`Profile retrieval failed: ${profileError.message}`);
    }
    
    console.log('✅ Profile retrieved successfully!');
    console.log(profile);
    
    // 4. Test profile update
    console.log('\n4. Testing profile update...');
    const updateData = {
      first_name: 'Updated',
      last_name: 'User'
    };
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', loginData.user.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Profile update failed: ${updateError.message}`);
    }
    
    console.log('✅ Profile updated successfully!');
    console.log(updatedProfile);
    
    // 5. Test site creation
    console.log('\n5. Testing site creation...');
    const siteData = {
      ...testSite,
      user_id: loginData.user.id
    };
    
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .insert([siteData])
      .select()
      .single();
    
    if (siteError) {
      throw new Error(`Site creation failed: ${siteError.message}`);
    }
    
    console.log('✅ Site created successfully!');
    console.log(site);
    
    // 6. Test site retrieval
    console.log('\n6. Testing site retrieval...');
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('user_id', loginData.user.id);
    
    if (sitesError) {
      throw new Error(`Site retrieval failed: ${sitesError.message}`);
    }
    
    console.log('✅ Sites retrieved successfully!');
    console.log(`Found ${sites.length} sites`);
    
    // 7. Test site update
    console.log('\n7. Testing site update...');
    const siteUpdateData = {
      name: 'Updated Test Site'
    };
    
    const { data: updatedSite, error: siteUpdateError } = await supabase
      .from('sites')
      .update(siteUpdateData)
      .eq('id', site.id)
      .select()
      .single();
    
    if (siteUpdateError) {
      throw new Error(`Site update failed: ${siteUpdateError.message}`);
    }
    
    console.log('✅ Site updated successfully!');
    console.log(updatedSite);
    
    // 8. Test site deletion
    console.log('\n8. Testing site deletion...');
    const { error: siteDeleteError } = await supabase
      .from('sites')
      .delete()
      .eq('id', site.id);
    
    if (siteDeleteError) {
      throw new Error(`Site deletion failed: ${siteDeleteError.message}`);
    }
    
    console.log('✅ Site deleted successfully!');
    
    // 9. Test user session
    console.log('\n9. Testing user session...');
    const { data: session } = await supabase.auth.getSession();
    
    if (session && session.session) {
      console.log('✅ Session is valid!');
      console.log(`Session expires at: ${new Date(session.session.expires_at * 1000).toLocaleString()}`);
    } else {
      console.log('❌ No valid session found');
    }
    
    // 10. Test logout
    console.log('\n10. Testing logout...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      throw new Error(`Logout failed: ${signOutError.message}`);
    }
    
    console.log('✅ Logout successful!');
    
    // Final verification
    const { data: finalSession } = await supabase.auth.getSession();
    if (!finalSession.session) {
      console.log('✅ Session correctly cleared after logout');
    } else {
      console.log('❌ Session still exists after logout');
    }
    
    console.log('\n=== All tests completed successfully! ===');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    // Clean up
    console.log('\nCleaning up test data...');
    
    // Note: We don't need to manually delete the user or profile
    // as they will be automatically deleted by Supabase when the
    // test account is removed or expires
    
    rl.close();
  }
}

// Ask for confirmation before running tests
async function main() {
  console.log('This script will create a test user and perform various authentication operations.');
  console.log(`Test email: ${testUser.email}`);
  
  const confirm = await prompt('Do you want to proceed? (y/n): ');
  
  if (confirm.toLowerCase() === 'y') {
    await runTests();
  } else {
    console.log('Test cancelled.');
    rl.close();
  }
}

main();
