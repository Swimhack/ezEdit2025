# ⚠️ ScaleKit Configuration Error Fix

## Error: "invalid domain in request"

This error occurs because your `.env.local` file still contains **placeholder values** instead of actual ScaleKit credentials.

## Quick Fix

### Step 1: Get Your Actual ScaleKit Credentials

1. **Sign up/Login to ScaleKit**:
   - Go to https://scalekit.com
   - Create an account or sign in

2. **Get Your Credentials**:
   - In your ScaleKit dashboard, go to **Settings** → **API Config**
   - Copy these **REAL** values (not the placeholders):
     - **Environment URL** (e.g., `https://stricklandtechnology.scalekit.dev`)
     - **Client ID** (e.g., `skc_96063830303509251`)
     - **Client Secret** (e.g., `test_6XGQSHjTrpNi70ydeU2ZE8IB80ZzrZCtm2OjSMqbQaaBGd8B0LtLBXzT4iDDcL4k`)

### Step 2: Update .env.local

Open `ezedit/.env.local` and **replace** the placeholder values:

**Find these lines:**
```bash
SCALEKIT_ENVIRONMENT_URL=https://your-environment.scalekit.com
SCALEKIT_CLIENT_ID=your_client_id_here
SCALEKIT_CLIENT_SECRET=your_client_secret_here
```

**Replace with your ACTUAL values:**
```bash
SCALEKIT_ENVIRONMENT_URL=https://your-actual-org.scalekit.com
SCALEKIT_CLIENT_ID=clt_your_actual_client_id
SCALEKIT_CLIENT_SECRET=secret_your_actual_secret
```

**Important**: 
- Remove ALL placeholder text
- Use your REAL credentials from ScaleKit dashboard
- Don't add quotes around the values
- Don't add extra spaces

### Step 3: Configure Callback URL in ScaleKit

In your ScaleKit dashboard:

1. Go to **Settings** → **Redirects** or **Allowed Callback URIs**
2. Add this callback URL:
   ```
   http://localhost:3002/auth/callback
   ```
3. Save the changes

### Step 4: Restart Development Server

**CRITICAL**: After updating `.env.local`:

1. **Stop** your current dev server (Ctrl+C)
2. **Start** it again:
   ```bash
   npm run dev
   ```
3. Environment variables are only loaded when the server starts!

### Step 5: Test Again

1. Go to http://localhost:3002/auth/signin
2. Try to sign in
3. The error should be gone!

## What Was Wrong?

The URL in your browser shows:
```
your-environment.scalekit.com/oauth/authorize?client_id=your_client_id_here...
```

This means the code is using **placeholder values** instead of real credentials. ScaleKit sees `your-environment.scalekit.com` and `your_client_id_here` as invalid and rejects the request.

## Still Having Issues?

1. **Verify your .env.local file**:
   - Make sure there are NO placeholder values
   - Check for typos in variable names
   - Ensure no extra spaces or quotes

2. **Check ScaleKit Dashboard**:
   - Verify your credentials are correct
   - Ensure callback URL is added: `http://localhost:3002/auth/callback`
   - Check that your ScaleKit account is active

3. **Restart Server**:
   - Environment variables only load on server start
   - Fully stop and restart: `npm run dev`

4. **Check Console Logs**:
   - Look for any error messages
   - Verify ScaleKit client is initialized correctly

