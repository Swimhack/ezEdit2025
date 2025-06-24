# Supabase Authentication Setup for ezEdit

This guide explains how to set up Supabase authentication for the ezEdit project. Supabase provides a secure, scalable backend for user authentication, profile management, and site data storage.

## Prerequisites

1. A Supabase account (free tier is sufficient)
2. Access to the ezEdit codebase
3. Node.js and npm/pnpm installed for running test scripts

## Setup Steps

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign in or create an account
2. Create a new project with a name like "ezEdit"
3. Note your project URL and anon key (public API key) from the API settings

### 2. Update Configuration

1. Open `public/js/config.js` and update the Supabase configuration:
   ```js
   supabase: {
     url: 'https://your-project-id.supabase.co',
     anonKey: 'your-anon-key'
   }
   ```

### 3. Run Database Migrations

1. Install the Supabase CLI if you haven't already:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run the migration:
   ```bash
   supabase db push
   ```

   Alternatively, you can manually run the SQL in `supabase/migrations/20230501000000_initial_schema.sql` in the Supabase SQL editor. This script creates:
   - `profiles` table for user information
   - `sites` table for FTP site credentials (with encryption)
   - `subscriptions` table for payment info
   - Row Level Security policies
   - Triggers for password encryption and timestamps

### 4. Configure Authentication Providers

1. In the Supabase dashboard, go to Authentication > Settings
2. Enable Email auth with "Confirm email" option
3. Set up redirect URLs:
   - Site URL: `https://your-ezedit-domain.com`
   - Redirect URLs:
     - `https://your-ezedit-domain.com/auth-callback.html`
     - `http://localhost:5173/auth-callback.html` (for development)

4. (Optional) Set up OAuth providers:
   - Google: Create OAuth credentials in Google Cloud Console
   - GitHub: Create OAuth App in GitHub Developer Settings
   - Add the client ID and secret to Supabase Auth settings

### 5. Configure Email Templates

1. In the Supabase dashboard, go to Authentication > Email Templates
2. Customize the templates for:
   - Confirmation email
   - Magic link email
   - Password reset email
   - Change email address

### 6. Test Authentication Flow

1. Open the test page at `/test-supabase.html` to verify your configuration
2. Run the test script to verify backend functionality:
   ```bash
   cd supabase
   npm install @supabase/supabase-js dotenv
   node test-auth.js
   ```
3. Test the complete user journey:
   - Sign up with a new account
   - Verify email confirmation works
   - Log in with the confirmed account
   - Test password reset functionality
   - If configured, test social logins (Google, GitHub)
   - Create and manage FTP sites
   - Update user profile

## Security Considerations

- The Supabase anon key is public and safe to include in client-side code
- Sensitive operations are protected by Row Level Security policies in the database
- User passwords are securely handled by Supabase and never exposed to your application
- FTP credentials are encrypted in the database using pgcrypto
- For production, consider these additional security measures:
  - Set up a server-side proxy for Supabase operations that require higher security
  - Implement rate limiting for authentication attempts
  - Configure CORS settings in Supabase to restrict to your domain only
  - Enable MFA for admin accounts
  - Regularly audit RLS policies and database access patterns

## Troubleshooting

- If authentication callbacks fail, check that your redirect URLs are correctly configured
- For CORS issues, ensure your domain is added to the allowed origins in Supabase
- Check browser console for any JavaScript errors
- Verify that the Supabase client is properly initialized before any auth operations
- Common issues and solutions:
  - **"User already registered"**: The email is already in use, try logging in instead
  - **"Invalid login credentials"**: Double-check email/password or try password reset
  - **"JWT expired"**: User needs to log in again as their session has expired
  - **"No permission to perform this action"**: Check RLS policies
  - **"Database error"**: Check Supabase logs for details on SQL errors

## Integration with ezEdit

The Supabase authentication is integrated with ezEdit through these key files:

- `public/js/supabase-service.js`: Core service handling all Supabase interactions
- `public/js/auth.js`: Handles login, signup, and password reset UI flows
- `public/auth-callback.html`: Processes OAuth and magic link redirects
- `public/js/config.js`: Stores Supabase project URL and anon key
- `public/test-supabase.html`: Test page for verifying integration

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) (for server-side operations)
- [Supabase Storage](https://supabase.com/docs/guides/storage) (for future file storage needs)
