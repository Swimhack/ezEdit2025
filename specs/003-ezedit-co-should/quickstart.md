# Google OAuth Integration Quickstart

**Time to Complete**: 60 minutes
**Prerequisites**: Google Cloud Console account, EzEdit development environment

## Overview

This guide will help you implement live Google OAuth integration in EzEdit, enabling users to sign in with their Google accounts seamlessly.

## 1. Google Cloud Console Setup (15 minutes)

### Create OAuth 2.0 Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**

### Configure OAuth Client
```
Application type: Web application
Name: EzEdit Production

Authorized JavaScript origins:
- https://ezedit.co
- https://www.ezedit.co
- https://ezedit.fly.dev (for staging)
- http://localhost:3000 (for development)

Authorized redirect URIs:
- https://ezedit.co/auth/callback/google
- https://www.ezedit.co/auth/callback/google
- https://ezedit.fly.dev/auth/callback/google
- http://localhost:3000/auth/callback/google
```

### Enable Required APIs
```bash
# Enable Google OAuth 2.0 API
gcloud services enable oauth2.googleapis.com

# Enable People API (for profile information)
gcloud services enable people.googleapis.com
```

### Save Credentials
```bash
# Download OAuth credentials JSON file
# Add to your environment variables:
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
```

## 2. Supabase OAuth Configuration (10 minutes)

### Configure Google Provider
1. Open [Supabase Dashboard](https://app.supabase.com/)
2. Go to **Authentication** → **Providers**
3. Enable **Google** provider

### Supabase Google OAuth Settings
```
Google OAuth Client ID: your_client_id
Google OAuth Client Secret: your_client_secret

Redirect URL (Supabase):
https://your-project.supabase.co/auth/v1/callback

Site URL: https://ezedit.co
```

### Update Environment Variables
```bash
# Add to .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth credentials
GOOGLE_OAUTH_CLIENT_ID=your_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret
```

## 3. Database Schema Setup (10 minutes)

### Run Database Migration
```sql
-- Extend existing user table
ALTER TABLE profiles ADD COLUMN google_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN preferred_auth_method TEXT DEFAULT 'email';
ALTER TABLE profiles ADD COLUMN oauth_enabled BOOLEAN DEFAULT false;

-- Create OAuth profile table
CREATE TABLE oauth_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'google',
    provider_user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    picture_url TEXT,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

-- Create authentication events table
CREATE TABLE authentication_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    event_type TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_oauth_profiles_user ON oauth_profiles(user_id);
CREATE INDEX idx_oauth_profiles_provider ON oauth_profiles(provider, provider_user_id);
CREATE INDEX idx_auth_events_user ON authentication_events(user_id, created_at);

-- Enable RLS
ALTER TABLE oauth_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE authentication_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own OAuth profile" ON oauth_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own OAuth profile" ON oauth_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own auth events" ON authentication_events
    FOR SELECT USING (auth.uid() = user_id);
```

## 4. OAuth Service Implementation (15 minutes)

### Create OAuth Service
Create `lib/oauth/google.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function initiateGoogleOAuth(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'openid email profile',
      redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  })

  if (error) throw error
  return data
}

export async function handleOAuthCallback() {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw error
  if (!data.session) throw new Error('No session found')

  // Create or update OAuth profile
  const { user } = data.session
  await createOAuthProfile(user)

  return data.session
}

async function createOAuthProfile(user: any) {
  const { error } = await supabase
    .from('oauth_profiles')
    .upsert({
      user_id: user.id,
      provider: 'google',
      provider_user_id: user.user_metadata.sub,
      email: user.email,
      name: user.user_metadata.full_name,
      picture_url: user.user_metadata.picture,
      profile_data: user.user_metadata
    })

  if (error) throw error
}
```

### Create OAuth Components
Create `components/auth/GoogleSignInButton.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { initiateGoogleOAuth } from '@/lib/oauth/google'

export default function GoogleSignInButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await initiateGoogleOAuth()
    } catch (error) {
      console.error('OAuth error:', error)
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={loading}
      className={`flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {loading ? 'Signing in...' : 'Continue with Google'}
    </button>
  )
}
```

## 5. OAuth Callback Handler (10 minutes)

### Create Callback Page
Create `app/auth/callback/page.tsx`:
```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { handleOAuthCallback } from '@/lib/oauth/google'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function processCallback() {
      try {
        await handleOAuthCallback()
        setStatus('success')

        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    processCallback()
  }, [router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Completing sign-in...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-2">Sign-in Successful!</h1>
          <p>Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-red-600 text-4xl mb-4">✗</div>
        <h1 className="text-2xl font-bold mb-2">Sign-in Failed</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => router.push('/auth/signin')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
```

## 6. Integration with Sign-In Page (5 minutes)

### Update Sign-In Page
Update `app/auth/signin/page.tsx`:
```typescript
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold">
            Sign in to EzEdit
          </h2>
        </div>

        <div className="space-y-4">
          {/* Google OAuth Button */}
          <GoogleSignInButton className="w-full" />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Existing email/password form */}
          {/* ... existing form code ... */}
        </div>
      </div>
    </div>
  )
}
```

## 7. Testing OAuth Flow (10 minutes)

### Local Testing
```bash
# Start development server
npm run dev

# Test OAuth flow:
# 1. Visit http://localhost:3000/auth/signin
# 2. Click "Continue with Google"
# 3. Complete OAuth consent
# 4. Verify callback and redirect to dashboard
```

### Test Checklist
- [ ] Google sign-in button appears and is clickable
- [ ] Clicking button redirects to Google OAuth consent screen
- [ ] OAuth consent shows correct app name and permissions
- [ ] After consent, user is redirected back to callback page
- [ ] Callback processing completes successfully
- [ ] User is redirected to dashboard with active session
- [ ] User profile includes Google profile information

### Debug OAuth Issues
```bash
# Check Supabase logs
npx supabase logs

# Check browser network tab for OAuth redirect chain
# Verify callback URL matches configured redirect URI
# Check browser console for JavaScript errors

# Test database records
psql -h db.supabase.co -U postgres -d postgres
SELECT * FROM profiles WHERE google_id IS NOT NULL;
SELECT * FROM oauth_profiles;
SELECT * FROM authentication_events WHERE provider = 'google';
```

## 8. Production Deployment (5 minutes)

### Update Environment Variables
```bash
# Add to Fly.io secrets
flyctl secrets set GOOGLE_OAUTH_CLIENT_ID="your_production_client_id"
flyctl secrets set GOOGLE_OAUTH_CLIENT_SECRET="your_production_client_secret"

# Verify secrets are set
flyctl secrets list
```

### Update OAuth Configuration
1. Update Google Cloud Console OAuth client:
   - Remove localhost URLs from authorized origins and redirect URIs
   - Ensure production URLs are configured
2. Update Supabase OAuth settings:
   - Set production site URL: `https://ezedit.co`
   - Verify redirect URL configuration

### Deploy and Test
```bash
# Deploy to production
./scripts/deployment/deploy.sh

# Test production OAuth flow
# 1. Visit https://ezedit.co/auth/signin
# 2. Test complete OAuth flow
# 3. Verify user sessions and profile creation
```

## Success Checklist

After completing this quickstart, verify:

- [ ] ✅ Google Cloud Console OAuth client configured
- [ ] ✅ Supabase OAuth provider enabled and configured
- [ ] ✅ Database schema updated with OAuth tables
- [ ] ✅ OAuth service and components implemented
- [ ] ✅ Callback handler processing OAuth responses
- [ ] ✅ Sign-in page includes Google OAuth button
- [ ] ✅ Local testing shows complete OAuth flow working
- [ ] ✅ Production deployment includes OAuth configuration
- [ ] ✅ Users can sign in with Google accounts successfully
- [ ] ✅ User profiles created with Google profile data
- [ ] ✅ Existing email/password authentication still works

## Troubleshooting

### Common Issues

**OAuth redirect_uri_mismatch:**
```
Error: redirect_uri_mismatch
Solution: Verify redirect URI in Google Cloud Console matches exactly
```

**Supabase OAuth error:**
```
Error: Invalid OAuth provider configuration
Solution: Check Supabase Google provider settings and credentials
```

**Callback page not loading:**
```
Error: 404 on callback route
Solution: Verify callback page exists at /auth/callback/page.tsx
```

**Profile not created:**
```
Error: OAuth profile missing in database
Solution: Check RLS policies and upsert query in OAuth service
```

**Session not persisting:**
```
Error: User not staying logged in
Solution: Verify Supabase session configuration and cookies
```

## Next Steps

1. **Account Linking**: Implement linking existing email accounts with Google OAuth
2. **Profile Sync**: Add automatic profile picture and name synchronization
3. **Security Hardening**: Implement PKCE and additional OAuth security measures
4. **Analytics**: Track OAuth conversion rates and user preferences
5. **Error Handling**: Add comprehensive error handling and user feedback

## Support Resources

- **Google OAuth Documentation**: https://developers.google.com/identity/protocols/oauth2
- **Supabase OAuth Guide**: https://supabase.com/docs/guides/auth/social-login/auth-google
- **EzEdit Support**: support@ezedit.co

---

**OAuth Integration Complete!** 🎉

Users can now sign in to EzEdit using their Google accounts with a seamless, secure OAuth flow.