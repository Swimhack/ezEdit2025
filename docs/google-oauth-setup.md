# Setting Up Google OAuth for ezEdit

This guide walks through the process of setting up Google OAuth authentication for ezEdit using Supabase.

## Prerequisites

- A Supabase project
- A Google Cloud Platform account
- Access to the ezEdit codebase

## Step 1: Create OAuth Credentials in Google Cloud Platform

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" and select "OAuth client ID"
5. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: ezEdit
   - User support email: your-email@example.com
   - Developer contact information: your-email@example.com
   - Authorized domains: add your domain (e.g., ezedit.co)
6. Return to the Credentials page and create an OAuth client ID:
   - Application type: Web application
   - Name: ezEdit Web Client
   - Authorized JavaScript origins: 
     - `https://your-supabase-project.supabase.co`
     - `http://localhost:3000` (for local development)
   - Authorized redirect URIs:
     - `https://your-supabase-project.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth-callback.html` (for local development)
7. Click "Create"
8. Note your Client ID and Client Secret

## Step 2: Configure Supabase Auth

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" in the list of providers and click "Enable"
4. Enter your Google OAuth credentials:
   - Client ID: (from step 1)
   - Client Secret: (from step 1)
   - Authorized redirect URL: This should be pre-filled with your Supabase project URL
5. Click "Save"

## Step 3: Update ezEdit Configuration

1. Update your `config.js` file with the Supabase project URL and anon key:

```javascript
window.EzEditConfig = {
  // ... existing config
  supabase: {
    url: 'https://your-supabase-project.supabase.co',
    anonKey: 'your-supabase-anon-key'
  }
};
```

2. Ensure the auth-callback.html page is properly configured to handle OAuth redirects (already implemented)

## Step 4: Test the Integration

1. Open the ezEdit login page
2. Click the "Continue with Google" button
3. Complete the Google authentication flow
4. You should be redirected back to ezEdit and logged in

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**
   - Error: "The redirect URI in the request did not match a registered redirect URI"
   - Solution: Double-check that the redirect URI in Google Cloud Console matches exactly with your Supabase callback URL

2. **CORS Issues**
   - Error: Cross-Origin Request Blocked
   - Solution: Ensure your domain is properly added to the authorized JavaScript origins in Google Cloud Console

3. **Invalid Client ID**
   - Error: "Invalid OAuth client ID"
   - Solution: Verify the client ID is correctly copied to Supabase

4. **Supabase Configuration**
   - Error: "Invalid provider settings"
   - Solution: Check that Google provider is enabled in Supabase and credentials are correct

### Testing Locally

When testing locally:

1. Add `http://localhost:3000` to the authorized JavaScript origins in Google Cloud Console
2. Add `http://localhost:3000/auth-callback.html` to the authorized redirect URIs
3. Update your local environment variables to use the correct Supabase URL and anon key

## Security Considerations

- Never expose your Google Client Secret in client-side code
- Use environment variables for sensitive information in production
- Regularly rotate your OAuth credentials
- Monitor authentication logs for suspicious activity

## Additional Resources

- [Supabase Auth Documentation](https://supabase.io/docs/guides/auth)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [ezEdit Supabase Auth Guide](./supabase-auth-guide.md)
