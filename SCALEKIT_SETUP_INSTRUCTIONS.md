# ScaleKit Setup Instructions

## Quick Setup Guide

Your `.env.local` file has been updated with ScaleKit environment variable templates. You need to replace the placeholder values with your actual ScaleKit credentials.

## Step 1: Get ScaleKit Credentials

1. **Sign up for ScaleKit** (if you haven't already):
   - Visit https://scalekit.com
   - Create an account or sign in

2. **Access your Dashboard**:
   - After logging in, navigate to your dashboard
   - Go to **Settings** → **API Config**

3. **Copy Your Credentials**:
   - **Environment URL**: Copy the full URL (e.g., `https://your-org.scalekit.com`)
   - **Client ID**: Copy the Client ID
   - **Client Secret**: Copy the Client Secret

## Step 2: Update .env.local

Open your `.env.local` file in the `ezedit` directory and replace the placeholder values:

```bash
# ScaleKit Configuration
SCALEKIT_ENVIRONMENT_URL=https://your-environment.scalekit.com  # ← Replace with your actual URL
SCALEKIT_CLIENT_ID=your_client_id_here                           # ← Replace with your Client ID
SCALEKIT_CLIENT_SECRET=your_client_secret_here                   # ← Replace with your Client Secret
```

## Step 3: Restart Your Development Server

After updating the environment variables:

1. Stop your current development server (Ctrl+C)
2. Start it again: `npm run dev`
3. The application should now connect to ScaleKit

## Step 4: Configure Callback URL in ScaleKit

In your ScaleKit dashboard:

1. Go to **Settings** → **Redirects** or **Allowed Callback URIs**
2. Add your callback URL:
   - **Development**: `http://localhost:3002/auth/callback`
   - **Production**: `https://your-production-domain.com/auth/callback`

## Step 5: Enable Authentication Methods

In your ScaleKit dashboard:

1. Go to **Authentication Methods**
2. Enable the methods you want:
   - ✅ Email/Password
   - ✅ Google OAuth (if you want Google sign-in)
   - ✅ Other social providers

## Troubleshooting

### "Authentication service not configured"
- ✅ Check that all three variables are set in `.env.local`
- ✅ Verify there are no extra spaces or quotes around the values
- ✅ Restart your development server after making changes

### "Failed to initiate authentication"
- ✅ Check that your ScaleKit credentials are correct
- ✅ Verify the callback URL is configured in ScaleKit dashboard
- ✅ Ensure your ScaleKit account is active

### Still having issues?
- Check the console logs for detailed error messages
- Verify your ScaleKit dashboard shows the correct environment URL
- Make sure you're using the correct credentials for your environment (development vs production)

