# Supabase Authentication Guide for ezEdit

This guide provides comprehensive documentation for the Supabase authentication integration in ezEdit, including setup instructions, authentication flows, troubleshooting, and security best practices.

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Authentication Flows](#authentication-flows)
4. [User Profiles](#user-profiles)
5. [Security Considerations](#security-considerations)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

## Overview

ezEdit uses Supabase for authentication, user management, and data storage. The authentication system supports:

- Email/password signup and login
- Social login (GitHub, Google)
- Magic link authentication
- Password reset
- User profile management
- Session management
- Row Level Security (RLS) for data protection

## Setup Instructions

### Prerequisites

- Supabase account and project
- Supabase project URL and anon key
- Node.js and pnpm installed

### Configuration Steps

1. **Set up environment variables**

   Create or update your `.env` file with Supabase credentials:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

2. **Run database migrations**

   ```bash
   cd supabase
   npx supabase db push
   ```

   This will create the necessary tables and functions in your Supabase project.

3. **Configure authentication providers**

   In the Supabase dashboard:
   - Go to Authentication > Providers
   - Enable Email provider and configure settings
   - Enable desired OAuth providers (GitHub, Google, etc.)
   - Configure redirect URLs for your application

4. **Set up email templates**

   In the Supabase dashboard:
   - Go to Authentication > Email Templates
   - Customize the templates for:
     - Confirmation emails
     - Magic link emails
     - Password reset emails

## Authentication Flows

### Email Signup

```javascript
// Client-side code
const { data, error } = await supabaseService.supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
});
```

Upon successful signup:
1. A confirmation email is sent to the user
2. A profile record is automatically created via database trigger
3. The user is redirected to the dashboard with a trial account

### Email Login

```javascript
// Client-side code
const { data, error } = await supabaseService.supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
});
```

### Social Login

Social login is handled through the Supabase OAuth providers. When a user clicks a social login button:

1. They are redirected to the provider's authentication page
2. After successful authentication, they are redirected back to the `auth-callback.html` page
3. The callback page handles session creation and profile setup

### Password Reset

The password reset flow consists of two steps:

1. **Request reset email**:
   ```javascript
   const { data, error } = await supabaseService.resetPassword(email, {
     redirectTo: 'https://yourdomain.com/reset-password-confirm.html'
   });
   ```

2. **Confirm new password**:
   ```javascript
   // This is handled in reset-password-confirm.html
   const { data, error } = await supabase.auth.updateUser({
     password: newPassword
   });
   ```

## User Profiles

### Profile Structure

The `profiles` table contains:

- `id`: User ID (matches Supabase auth.users id)
- `email`: User email
- `first_name`: User's first name
- `last_name`: User's last name
- `plan`: Subscription plan ('free-trial', 'pro')
- `trial_start_date`: When the trial started
- `trial_days_left`: Number of days left in trial
- `subscription_status`: Status of subscription
- `auth_provider`: How the user signed up ('email', 'github', etc.)
- `created_at`: Timestamp of profile creation
- `updated_at`: Timestamp of last update

### Profile Management

Update a user profile:

```javascript
const { data, error } = await supabaseService.supabase
  .from('profiles')
  .update({
    first_name: 'New Name',
    last_name: 'New Last Name',
    updated_at: new Date().toISOString()
  })
  .eq('id', userId)
  .select();
```

## Security Considerations

### Row Level Security (RLS)

All tables in ezEdit use Row Level Security to ensure users can only access their own data:

- Profiles: Users can only read/write their own profile
- Sites: Users can only access sites they created
- Subscriptions: Users can only view their own subscription data

### Password Security

- Passwords are never stored in plain text
- Password strength requirements:
  - Minimum 8 characters
  - Must include uppercase, lowercase, number, and special character
- Failed login attempts are rate-limited

### Token Management

- Authentication tokens are stored securely in localStorage
- Tokens are automatically refreshed before expiration
- Tokens are cleared on logout

## Troubleshooting

### Common Issues

1. **"User not found" error**
   - Check if the email is correct
   - Verify the user exists in Supabase auth.users table

2. **"Invalid login credentials" error**
   - Password may be incorrect
   - User may be trying to use an OAuth account with password login

3. **Profile not created after signup**
   - Check if the database trigger is working correctly
   - Manually create a profile if needed

4. **Session expires too quickly**
   - Default session duration is 1 hour
   - Adjust in Supabase dashboard under Authentication > Settings

### Testing Authentication

Use the provided test script to verify authentication flows:

```bash
cd supabase
node test-auth-flows.js
```

This script tests:
- Signup
- Login
- Profile management
- Password update
- Session management
- Password reset
- Logout

## API Reference

### SupabaseService Methods

| Method | Description | Parameters |
|--------|-------------|------------|
| `constructor(memoryService)` | Initialize the service | `memoryService`: MemoryService instance |
| `getSession()` | Get current session | None |
| `signUp(email, password, options)` | Sign up a new user | `email`, `password`, `options` |
| `signIn(email, password)` | Sign in with email/password | `email`, `password` |
| `signInWithProvider(provider)` | Sign in with OAuth | `provider`: 'github', 'google', etc. |
| `resetPassword(email, options)` | Request password reset | `email`, `options` |
| `updatePassword(newPassword)` | Update user password | `newPassword` |
| `getUserProfile()` | Get current user profile | None |
| `updateUserProfile(updates)` | Update user profile | `updates`: Object with profile fields |
| `signOut()` | Sign out current user | None |

### Events

The Supabase client emits events that you can listen to:

```javascript
supabaseService.supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Handle sign in
  } else if (event === 'SIGNED_OUT') {
    // Handle sign out
  } else if (event === 'USER_UPDATED') {
    // Handle user update
  }
});
```

---

For more information, refer to the [Supabase documentation](https://supabase.io/docs) or contact the ezEdit support team.
