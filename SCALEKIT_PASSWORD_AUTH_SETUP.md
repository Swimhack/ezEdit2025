# ScaleKit Password Authentication Setup

## Problem: "Magic link cannot be used" Error

ScaleKit's hosted login page defaults to **magic link (passwordless)** authentication. To use **password authentication**, you need to configure a password-based connection in ScaleKit and reference it in your code.

## Solution: Configure Password Authentication in ScaleKit

### Step 1: Enable Password Authentication in ScaleKit Dashboard

1. Go to your ScaleKit dashboard: https://stricklandtechnology.scalekit.dev
2. Navigate to **Connections** or **Authentication Methods**
3. Look for **Email/Password** connection type
4. **Enable** the Email/Password connection if it's not already enabled
5. Copy the **Connection ID** (it will look like `conn_xxxxxxxxxxxxx`)

### Step 2: Update Environment Variables

Add the connection ID to your `.env.local`:

```bash
SCALEKIT_PASSWORD_CONNECTION_ID=conn_your_connection_id_here
```

### Step 3: Restart Server

After adding the connection ID, restart your dev server:

```bash
npm run dev
```

## Alternative: If Password Connection Doesn't Exist

If ScaleKit doesn't have a password connection option, you may need to:

1. **Check ScaleKit Documentation**: See if password authentication is supported
2. **Contact ScaleKit Support**: Ask about enabling password authentication
3. **Use Different Authentication Method**: Consider using OAuth (Google, etc.) instead

## Testing

After configuration:

1. Go to: http://localhost:3002/auth/signin
2. Enter email: `james@ekaty.com`
3. You should see a password field (not magic link)
4. Enter password: `pa$$word`
5. Sign in should work

## Troubleshooting

If you still see magic link:

1. ✅ Verify connection ID is correct in `.env.local`
2. ✅ Restart dev server after adding connection ID
3. ✅ Check ScaleKit dashboard that password connection is enabled
4. ✅ Clear browser cache and cookies
5. ✅ Try incognito/private browsing mode

