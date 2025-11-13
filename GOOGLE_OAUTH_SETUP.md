# Google OAuth Setup Guide

## Overview
This guide will help you enable Google OAuth authentication for EzEdit on https://ezeditapp.fly.dev

## Prerequisites
- Access to Supabase dashboard
- Google Cloud Console access
- Production URL: https://ezeditapp.fly.dev

## Step 1: Configure Google Cloud Console

### 1.1 Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application** as the application type

### 1.2 Configure OAuth Consent Screen

Before creating credentials, you may need to configure the OAuth consent screen:

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (or Internal if using Google Workspace)
3. Fill in the required information:
   - **App name**: EzEdit
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Add scopes (optional for basic auth):
   - `userinfo.email`
   - `userinfo.profile`
5. Save and continue

### 1.3 Set Authorized Redirect URIs

In your OAuth client configuration, add these redirect URIs:

```
https://natjhcqynqziccssnwim.supabase.co/auth/v1/callback
https://ezeditapp.fly.dev/auth/callback
```

**Important**: The Supabase callback URL must be added first!

### 1.4 Get Your Credentials

After creating the OAuth client, you'll receive:
- **Client ID**: Something like `123456789-abc123.apps.googleusercontent.com`
- **Client Secret**: A secret string

**Save these credentials** - you'll need them for Supabase configuration.

## Step 2: Configure Supabase

### 2.1 Enable Google Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `natjhcqynqziccssnwim`
3. Navigate to **Authentication** > **Providers**
4. Find **Google** in the list and click to expand

### 2.2 Configure Google Provider

1. Toggle **Enable Sign in with Google** to ON
2. Enter your Google OAuth credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
3. Configure additional settings:
   - **Redirect URL**: Should auto-populate as `https://natjhcqynqziccssnwim.supabase.co/auth/v1/callback`
   - **Skip nonce check**: Leave unchecked (recommended)
4. Click **Save**

### 2.3 Configure Site URL

1. In Supabase Dashboard, go to **Authentication** > **URL Configuration**
2. Set **Site URL** to: `https://ezeditapp.fly.dev`
3. Add **Redirect URLs**:
   ```
   https://ezeditapp.fly.dev/auth/callback
   https://ezeditapp.fly.dev/dashboard
   https://ezeditapp.fly.dev/**
   ```
4. Save changes

## Step 3: Update Application Code (Already Done!)

The signin page already has Google OAuth button implemented. The flow is:

1. User clicks "Continue with Google"
2. App calls `/api/auth/signin` with `socialLogin: true`
3. Backend redirects to Supabase OAuth URL
4. User authenticates with Google
5. Google redirects back to Supabase
6. Supabase redirects to `/auth/callback`
7. Callback handler processes the auth and redirects to dashboard

## Step 4: Test the Integration

### 4.1 Test on Production

1. Go to https://ezeditapp.fly.dev/auth/signin
2. Click the **"Continue with Google"** button
3. You should be redirected to Google's OAuth consent screen
4. Sign in with your Google account
5. Grant permissions
6. You should be redirected back to the dashboard

### 4.2 Troubleshooting

If you encounter issues:

**Error: "redirect_uri_mismatch"**
- Check that the redirect URI in Google Cloud Console exactly matches Supabase's callback URL
- Make sure there are no trailing slashes or typos

**Error: "Invalid client"**
- Verify Client ID and Client Secret are correct in Supabase
- Check that the OAuth client is enabled in Google Cloud Console

**Error: "Access blocked"**
- Your OAuth consent screen may need verification
- For testing, add your email as a test user in Google Cloud Console

**User redirected but not logged in**
- Check browser console for errors
- Verify Site URL and Redirect URLs in Supabase are correct
- Check that cookies are enabled

## Step 5: Environment Variables (Optional)

If you want to use Google OAuth in development:

Add to `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

For local development, add this redirect URI to Google Cloud Console:
```
http://localhost:3000/auth/callback
https://natjhcqynqziccssnwim.supabase.co/auth/v1/callback
```

## Security Considerations

1. **Never commit** Google Client Secret to git
2. **Use environment variables** for sensitive credentials
3. **Restrict OAuth scopes** to only what you need (email, profile)
4. **Enable HTTPS only** in production
5. **Verify email domains** if you want to restrict access to specific domains

## Current Configuration

Your Supabase project:
- **Project URL**: https://natjhcqynqziccssnwim.supabase.co
- **Anon Key**: Already configured in `.env.local`
- **Production URL**: https://ezeditapp.fly.dev

## Quick Checklist

- [ ] Create OAuth client in Google Cloud Console
- [ ] Configure OAuth consent screen
- [ ] Add Supabase callback URL to authorized redirect URIs
- [ ] Copy Client ID and Client Secret
- [ ] Enable Google provider in Supabase
- [ ] Paste credentials into Supabase
- [ ] Set Site URL in Supabase to https://ezeditapp.fly.dev
- [ ] Add redirect URLs in Supabase
- [ ] Test signin flow on production
- [ ] Verify user is created in Supabase Auth

## Support

If you need help:
1. Check Supabase logs: Dashboard > Logs > Auth Logs
2. Check browser console for errors
3. Verify all URLs match exactly (no trailing slashes)
4. Test with a different Google account

## Next Steps

After Google OAuth is working:
1. Consider adding other providers (GitHub, Microsoft, etc.)
2. Implement user profile management
3. Add role-based access control
4. Set up email verification for password signups
