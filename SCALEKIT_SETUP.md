# ScaleKit Authentication Setup

This application uses ScaleKit for authentication. ScaleKit provides a hosted authentication UI that handles user registration, login, and password management.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# ScaleKit Configuration
SCALEKIT_ENVIRONMENT_URL=https://your-environment.scalekit.com
SCALEKIT_CLIENT_ID=your_client_id_here
SCALEKIT_CLIENT_SECRET=your_client_secret_here
```

## Getting ScaleKit Credentials

1. Sign up for a ScaleKit account at [scalekit.com](https://scalekit.com)
2. Access your ScaleKit dashboard
3. Navigate to **Settings > API Config**
4. Copy your:
   - **Environment URL** → `SCALEKIT_ENVIRONMENT_URL`
   - **Client ID** → `SCALEKIT_CLIENT_ID`
   - **Client Secret** → `SCALEKIT_CLIENT_SECRET`

## Authentication Flow

1. **Sign In/Sign Up**: User enters email and clicks sign in/sign up
2. **Redirect**: User is redirected to ScaleKit's hosted authentication page
3. **Authentication**: User completes authentication (password, social login, etc.) on ScaleKit
4. **Callback**: ScaleKit redirects back to `/auth/callback` with an authorization code
5. **Session**: Application exchanges code for user data and creates a session cookie
6. **Dashboard**: User is redirected to the dashboard

## Features

- ✅ Email/password authentication
- ✅ Social login (Google, etc.) - configured in ScaleKit dashboard
- ✅ Passwordless login - configured in ScaleKit dashboard
- ✅ Session management via secure HTTP-only cookies
- ✅ Automatic session expiration handling

## Migration from Supabase

This application has been migrated from Supabase Auth to ScaleKit. The following changes were made:

- Removed password field from signup form (ScaleKit handles this)
- Updated authentication API routes to use ScaleKit SDK
- Changed session management to use cookies instead of Supabase sessions
- Updated callback handler to exchange authorization code for user data

## Testing

1. Ensure ScaleKit environment variables are set in `.env.local`
2. Start the development server: `npm run dev`
3. Navigate to `/auth/signin` or `/auth/signup`
4. Enter your email and follow the authentication flow

## Troubleshooting

### "Authentication service not configured"
- Ensure all three ScaleKit environment variables are set in `.env.local`
- Restart the development server after adding environment variables

### "No authorization code received"
- Check that the callback URL is correctly configured in ScaleKit dashboard
- Ensure the redirect URI matches exactly: `http://localhost:3002/auth/callback` (or your production URL)

### Session not persisting
- Check browser cookies are enabled
- Verify cookie settings (HttpOnly, Secure, SameSite) match your environment

