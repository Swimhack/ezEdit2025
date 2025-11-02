# How to Update ScaleKit Environment Variables

## ⚠️ IMPORTANT: Your .env.local Still Has Placeholder Values

Your `.env.local` file currently contains:
```
SCALEKIT_ENVIRONMENT_URL=https://your-environment.scalekit.com
SCALEKIT_CLIENT_ID=your_client_id_here
SCALEKIT_CLIENT_SECRET=your_client_secret_here
```

These are **placeholder values** and need to be replaced with your **actual ScaleKit credentials**.

## Option 1: Use the Helper Script (Easiest)

Run this command and follow the prompts:
```bash
node scripts/update-scalekit-env.js
```

This will guide you through updating the values safely.

## Option 2: Manual Update

### Step 1: Get Your Credentials

1. Go to https://scalekit.com
2. Sign in to your account
3. Navigate to **Settings** → **API Config**
4. Copy these values:
   - **Environment URL** (e.g., `https://your-org.scalekit.com`)
   - **Client ID** (e.g., `clt_xxxxxxxxxxxxx`)
   - **Client Secret** (e.g., `secret_xxxxxxxxxxxxx`)

### Step 2: Edit .env.local

Open `ezedit/.env.local` in a text editor and find these lines:

```bash
# ScaleKit Configuration
SCALEKIT_ENVIRONMENT_URL=https://your-environment.scalekit.com
SCALEKIT_CLIENT_ID=your_client_id_here
SCALEKIT_CLIENT_SECRET=your_client_secret_here
```

**Replace** with your actual values:

```bash
# ScaleKit Configuration
SCALEKIT_ENVIRONMENT_URL=https://your-actual-org.scalekit.com
SCALEKIT_CLIENT_ID=clt_your_actual_client_id
SCALEKIT_CLIENT_SECRET=secret_your_actual_secret
```

**Important Rules**:
- ✅ No quotes around values
- ✅ No extra spaces before or after `=`
- ✅ Use exact values from ScaleKit dashboard
- ✅ Save the file

### Step 3: Restart Server

**CRITICAL**: After updating `.env.local`:

1. **Stop** your dev server (Ctrl+C)
2. **Start** it again:
   ```bash
   npm run dev
   ```

Environment variables are only loaded when the server starts!

### Step 4: Verify

Run this test:
```bash
node scripts/test-scalekit-config.js
```

You should see:
```
✅ Environment variables look valid
✅ ScaleKit client created successfully
✅ Authorization URL generated successfully!
```

## Common Mistakes

### ❌ Wrong:
```bash
SCALEKIT_ENVIRONMENT_URL="https://your-org.scalekit.com"  # Don't add quotes
SCALEKIT_CLIENT_ID = clt_xxxxx                           # No spaces around =
SCALEKIT_ENVIRONMENT_URL=https://your-environment.scalekit.com  # Still has placeholder
```

### ✅ Correct:
```bash
SCALEKIT_ENVIRONMENT_URL=https://your-actual-org.scalekit.com
SCALEKIT_CLIENT_ID=clt_your_actual_id
SCALEKIT_CLIENT_SECRET=secret_your_actual_secret
```

## After Updating

1. ✅ Restart your dev server
2. ✅ Verify with `node scripts/test-scalekit-config.js`
3. ✅ Try logging in at http://localhost:3002/auth/signin
4. ✅ Check that callback URL is configured in ScaleKit dashboard

## Still Having Issues?

1. **Verify file was saved**: Check `.env.local` file again
2. **Check for typos**: Make sure values match exactly from ScaleKit dashboard
3. **Restart server**: Environment variables only load on startup
4. **Test configuration**: Run `node scripts/test-scalekit-config.js`

