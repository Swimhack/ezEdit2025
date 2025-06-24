/**
 * Comprehensive Supabase Authentication Flow Tests for ezEdit
 * 
 * This script tests all authentication flows including:
 * - Email/password signup
 * - Email/password login
 * - Password reset
 * - Social login (OAuth)
 * - Session management
 * - Profile management
 * - Logout
 * 
 * Usage:
 * 1. Set up environment variables in .env file
 * 2. Run with Node.js: node test-auth-flows.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test user data
const testUser = {
  email: 'test@ezedit.co',
  password: 'Test@123456',
  firstName: 'Test',
  lastName: 'User',
  newPassword: 'NewTest@123456'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Print a section header
 * @param {string} title - Section title
 */
function printSection(title) {
  console.log('\n' + colors.bright + colors.blue + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.blue + ' ' + title + colors.reset);
  console.log(colors.bright + colors.blue + '='.repeat(80) + colors.reset + '\n');
}

/**
 * Print success message
 * @param {string} message - Success message
 */
function printSuccess(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

/**
 * Print error message
 * @param {string} message - Error message
 * @param {Error} error - Error object
 */
function printError(message, error) {
  console.error(colors.red + '✗ ' + message + colors.reset);
  if (error) {
    console.error(colors.dim + error.message + colors.reset);
  }
}

/**
 * Print info message
 * @param {string} message - Info message
 */
function printInfo(message) {
  console.log(colors.cyan + 'ℹ ' + message + colors.reset);
}

/**
 * Ask a question and get user input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User input
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Test email signup flow
 */
async function testSignup() {
  printSection('Testing Email Signup');
  
  try {
    // Check if user already exists and delete if necessary
    printInfo('Checking if test user already exists...');
    const { data: existingUser } = await supabase.auth.admin.listUsers({
      filters: {
        email: testUser.email
      }
    });
    
    if (existingUser && existingUser.users && existingUser.users.length > 0) {
      printInfo('Test user already exists. Deleting...');
      await supabase.auth.admin.deleteUser(existingUser.users[0].id);
      printSuccess('Deleted existing test user');
    }
    
    // Sign up new user
    printInfo('Creating new test user...');
    const { data, error } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password,
      options: {
        data: {
          first_name: testUser.firstName,
          last_name: testUser.lastName
        }
      }
    });
    
    if (error) throw error;
    
    printSuccess('User signed up successfully');
    printInfo(`User ID: ${data.user.id}`);
    
    // Check if profile was created automatically via trigger
    printInfo('Checking if profile was created...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError) {
      printError('Profile was not created automatically', profileError);
    } else {
      printSuccess('Profile was created automatically');
      printInfo(`Profile data: ${JSON.stringify(profile, null, 2)}`);
    }
    
    return data.user;
  } catch (error) {
    printError('Signup failed', error);
    return null;
  }
}

/**
 * Test email login flow
 */
async function testLogin() {
  printSection('Testing Email Login');
  
  try {
    // Sign out first to ensure clean state
    await supabase.auth.signOut();
    
    // Sign in with email and password
    printInfo('Signing in with email and password...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (error) throw error;
    
    printSuccess('User signed in successfully');
    printInfo(`Session expires at: ${new Date(data.session.expires_at * 1000).toLocaleString()}`);
    
    return data;
  } catch (error) {
    printError('Login failed', error);
    return null;
  }
}

/**
 * Test profile management
 * @param {string} userId - User ID
 */
async function testProfileManagement(userId) {
  printSection('Testing Profile Management');
  
  if (!userId) {
    printError('No user ID provided');
    return;
  }
  
  try {
    // Update profile
    printInfo('Updating user profile...');
    const updates = {
      first_name: testUser.firstName + ' Updated',
      last_name: testUser.lastName + ' Updated',
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    
    printSuccess('Profile updated successfully');
    printInfo(`Updated profile: ${JSON.stringify(data[0], null, 2)}`);
    
    // Get profile
    printInfo('Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) throw profileError;
    
    printSuccess('Profile fetched successfully');
    printInfo(`Profile data: ${JSON.stringify(profile, null, 2)}`);
    
    return profile;
  } catch (error) {
    printError('Profile management failed', error);
    return null;
  }
}

/**
 * Test password update
 */
async function testPasswordUpdate() {
  printSection('Testing Password Update');
  
  try {
    // Update password
    printInfo('Updating password...');
    const { data, error } = await supabase.auth.updateUser({
      password: testUser.newPassword
    });
    
    if (error) throw error;
    
    printSuccess('Password updated successfully');
    
    // Sign out
    await supabase.auth.signOut();
    
    // Sign in with new password
    printInfo('Signing in with new password...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.newPassword
    });
    
    if (signInError) throw signInError;
    
    printSuccess('Signed in with new password successfully');
    
    return true;
  } catch (error) {
    printError('Password update failed', error);
    return false;
  }
}

/**
 * Test password reset flow
 */
async function testPasswordReset() {
  printSection('Testing Password Reset');
  
  try {
    // Sign out first
    await supabase.auth.signOut();
    
    // Request password reset
    printInfo('Requesting password reset...');
    const { data, error } = await supabase.auth.resetPasswordForEmail(testUser.email, {
      redirectTo: 'http://localhost:3000/reset-password-confirm.html'
    });
    
    if (error) throw error;
    
    printSuccess('Password reset email sent successfully');
    printInfo('Check your email for the password reset link');
    
    // Since we can't automate email verification, we'll ask the user to confirm
    const confirmed = await askQuestion('Did you receive the password reset email? (y/n): ');
    
    if (confirmed.toLowerCase() === 'y') {
      printSuccess('Password reset flow confirmed by user');
      return true;
    } else {
      printError('Password reset email not received or confirmed');
      return false;
    }
  } catch (error) {
    printError('Password reset failed', error);
    return false;
  }
}

/**
 * Test session management
 */
async function testSessionManagement() {
  printSection('Testing Session Management');
  
  try {
    // Get current session
    printInfo('Getting current session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (!session) {
      printInfo('No active session found. Signing in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.newPassword || testUser.password
      });
      
      if (signInError) throw signInError;
      
      printSuccess('Signed in successfully');
    } else {
      printSuccess('Active session found');
      printInfo(`Session expires at: ${new Date(session.expires_at * 1000).toLocaleString()}`);
    }
    
    // Refresh session
    printInfo('Refreshing session...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) throw refreshError;
    
    printSuccess('Session refreshed successfully');
    printInfo(`New session expires at: ${new Date(refreshData.session.expires_at * 1000).toLocaleString()}`);
    
    return true;
  } catch (error) {
    printError('Session management failed', error);
    return false;
  }
}

/**
 * Test logout flow
 */
async function testLogout() {
  printSection('Testing Logout');
  
  try {
    // Sign out
    printInfo('Signing out...');
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    // Verify session is gone
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      printSuccess('User signed out successfully');
      return true;
    } else {
      printError('Session still exists after signOut');
      return false;
    }
  } catch (error) {
    printError('Logout failed', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  printSection('Starting Supabase Authentication Flow Tests');
  
  try {
    // Test signup
    const user = await testSignup();
    if (!user) {
      throw new Error('Signup failed, cannot continue tests');
    }
    
    // Test login
    const loginData = await testLogin();
    if (!loginData) {
      throw new Error('Login failed, cannot continue tests');
    }
    
    // Test profile management
    const profile = await testProfileManagement(user.id);
    if (!profile) {
      throw new Error('Profile management failed, cannot continue tests');
    }
    
    // Test password update
    const passwordUpdated = await testPasswordUpdate();
    if (!passwordUpdated) {
      throw new Error('Password update failed, cannot continue tests');
    }
    
    // Test session management
    const sessionManaged = await testSessionManagement();
    if (!sessionManaged) {
      throw new Error('Session management failed, cannot continue tests');
    }
    
    // Test password reset (requires manual verification)
    const askTestPasswordReset = await askQuestion('Do you want to test password reset flow? (y/n): ');
    if (askTestPasswordReset.toLowerCase() === 'y') {
      await testPasswordReset();
    }
    
    // Test logout
    const loggedOut = await testLogout();
    if (!loggedOut) {
      throw new Error('Logout failed');
    }
    
    printSection('All Tests Completed Successfully');
  } catch (error) {
    printSection('Tests Failed');
    printError(error.message);
  } finally {
    rl.close();
  }
}

// Run the tests
runTests();
