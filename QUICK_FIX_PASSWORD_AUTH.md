# Quick Fix: ScaleKit Password Authentication

## The Problem
You're seeing **"magic link cannot be used"** because ScaleKit is trying to use magic links (passwordless) instead of password authentication.

## Quick Solution

### Option 1: Enable Password Connection in ScaleKit (Recommended)

1. **Go to ScaleKit Dashboard**:
   - URL: https://stricklandtechnology.scalekit.dev
   - Sign in with your ScaleKit admin account

2. **Find Connections/Authentication Methods**:
   - Look for "Email/Password" or "Password" connection
   - Enable it if it's disabled

3. **Copy Connection ID**:
   - It will look like: `conn_xxxxxxxxxxxxx`
   - Copy this ID

4. **Add to `.env.local`**:
   ```bash
   SCALEKIT_PASSWORD_CONNECTION_ID=conn_your_actual_connection_id
   ```

5. **Restart Server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

6. **Test Login**:
   - Go to: http://localhost:3002/auth/signin
   - Enter: `james@ekaty.com`
   - You should now see password field instead of magic link

### Option 2: Configure ScaleKit User Account

If you can't find a password connection option:

1. **Check ScaleKit User Settings**:
   - Ensure `james@ekaty.com` has a password set
   - If not, set/reset password in ScaleKit dashboard

2. **Verify Connection Type**:
   - Check if ScaleKit supports password authentication for your plan
   - Some ScaleKit configurations may only support magic links

### Option 3: Use Google Sign-In (Temporary Workaround)

If password authentication isn't available:

1. Click **"Sign in with Google"** button
2. Use your Google account instead
3. The super admin privileges will still apply based on email

## Troubleshooting

**Still seeing magic link?**
- ✅ Check `.env.local` has `SCALEKIT_PASSWORD_CONNECTION_ID`
- ✅ Restart server after adding connection ID
- ✅ Clear browser cache/cookies
- ✅ Try incognito mode

**Can't find password connection in ScaleKit?**
- Check ScaleKit documentation for your plan/version
- Contact ScaleKit support: support@scalekit.com
- Or use Google sign-in as workaround

## What Changed in Code

The code now:
- ✅ Checks for `SCALEKIT_PASSWORD_CONNECTION_ID` environment variable
- ✅ Uses password connection when generating auth URL
- ✅ Falls back to default if connection ID not set

## Next Steps

1. Add connection ID to `.env.local`
2. Restart server
3. Try logging in again
4. If still having issues, check ScaleKit dashboard settings

