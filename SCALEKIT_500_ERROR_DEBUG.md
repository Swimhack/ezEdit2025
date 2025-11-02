# ScaleKit 500 Error Debugging Guide

## Common Causes of 500 Error After Updating Keys

### 1. Callback URL Not Configured in ScaleKit

**Error**: The callback URL `http://localhost:3002/auth/callback` must be added to ScaleKit dashboard.

**Fix**:
1. Go to ScaleKit Dashboard → Settings → Redirects
2. Add: `http://localhost:3002/auth/callback`
3. Save changes
4. Restart your dev server

### 2. Environment Variables Not Loaded

**Error**: Server hasn't restarted after updating `.env.local`

**Fix**:
1. **Stop** your dev server completely (Ctrl+C)
2. **Start** it again: `npm run dev`
3. Environment variables only load on server start!

### 3. Invalid Credentials Format

**Error**: Credentials might have extra spaces, quotes, or newlines

**Fix**: Check your `.env.local` file format:
```bash
# ✅ CORRECT:
SCALEKIT_ENVIRONMENT_URL=https://your-org.scalekit.com
SCALEKIT_CLIENT_ID=clt_xxxxxxxxxxxxx
SCALEKIT_CLIENT_SECRET=secret_xxxxxxxxxxxxx

# ❌ WRONG (don't add quotes):
SCALEKIT_ENVIRONMENT_URL="https://your-org.scalekit.com"

# ❌ WRONG (no extra spaces):
SCALEKIT_ENVIRONMENT_URL = https://your-org.scalekit.com
```

### 4. ScaleKit SDK Error

**Error**: The ScaleKit SDK might be throwing an error when creating the authorization URL

**Check Server Logs**:
Look at your terminal/console where `npm run dev` is running. You should see:
- `ScaleKit authorization error:` followed by the actual error
- `Error stack:` showing where it failed
- `Error details:` with more information

## Debugging Steps

1. **Check Server Console**:
   - Look at the terminal running `npm run dev`
   - Look for error messages starting with `ScaleKit authorization error:`
   - Copy the full error message

2. **Verify Environment Variables**:
   ```bash
   # Check if values are loaded (restart server first!)
   node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.SCALEKIT_ENVIRONMENT_URL)"
   ```

3. **Test ScaleKit Connection**:
   - Verify your ScaleKit account is active
   - Check that your credentials are correct in ScaleKit dashboard
   - Ensure callback URL is configured

4. **Check Network/Proxy Issues**:
   - Ensure you can reach ScaleKit API
   - Check firewall/proxy settings
   - Try accessing ScaleKit dashboard in browser

## Next Steps

After checking the above, please share:
1. The **exact error message** from your server console (not just "HTTP 500")
2. Any **ScaleKit authorization error** messages from the logs
3. Confirmation that you've:
   - Restarted the server after updating `.env.local`
   - Added callback URL to ScaleKit dashboard
   - Verified credentials are correct

This will help identify the exact issue!

