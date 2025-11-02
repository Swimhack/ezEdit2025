# Debug: Authorization Code Expiration Error

## Problem
Still getting "Invalid or expired authorization code" error even after redirect URI fixes.

## Enhanced Debugging Added

### 1. **Detailed Logging in Callback Route**
- Logs full callback URL including protocol and path
- Compares stored redirect URI with actual callback URL
- Logs all URL parameters (code, state, error, etc.)
- Verifies redirect URI matching

### 2. **Enhanced Authorization Logging**
- Logs full redirect URI used in authorization request
- Logs generated authorization URL
- Logs connection ID usage
- Timestamps for timing analysis

### 3. **Better Error Details**
- Captures full error response from ScaleKit
- Logs redirect URI used in code exchange
- Shows code length and other debugging info

## Next Steps to Debug

### 1. Check Server Logs
Look for these log entries when you try to sign in:

**Authorization Request:**
```
ScaleKit authorization request: {
  redirectUri: 'http://localhost:3002/auth/callback',
  ...
}
```

**Callback Attempt:**
```
ScaleKit callback - attempting code exchange: {
  redirectUri: 'http://localhost:3002/auth/callback',
  redirectUriMatch: true/false,
  ...
}
```

### 2. Verify Redirect URI Match
The logs will show:
- `redirectUriMatch: true` = URIs match exactly ✅
- `redirectUriMatch: false` = URIs don't match ❌

### 3. Check ScaleKit Dashboard
1. Go to ScaleKit dashboard
2. Check **Settings → API Config**
3. Verify callback URL: `http://localhost:3002/auth/callback`
   - Must match EXACTLY (no trailing slash)
   - Must use `http://` not `https://` for localhost

### 4. Common Causes

**A. Redirect URI Mismatch**
- Authorization uses: `http://localhost:3002/auth/callback`
- Callback uses: `http://localhost:3002/auth/callback/` (trailing slash)
- **Fix**: Both must match exactly

**B. Authorization Code Expired**
- Codes expire quickly (usually 1-2 minutes)
- If you take too long to confirm, code expires
- **Fix**: Complete authentication quickly

**C. Code Already Used**
- Authorization codes are single-use
- If you refresh or go back, code is invalid
- **Fix**: Start fresh login attempt

**D. ScaleKit Configuration**
- Client ID/Secret mismatch
- Callback URL not registered in ScaleKit
- **Fix**: Verify ScaleKit dashboard settings

## Debugging Checklist

- [ ] Check server logs for redirect URI values
- [ ] Verify `redirectUriMatch: true` in logs
- [ ] Check ScaleKit dashboard callback URL
- [ ] Verify environment variables are correct
- [ ] Try signing in again immediately (don't wait)
- [ ] Clear browser cookies and try again
- [ ] Check ScaleKit dashboard for any errors

## What to Share

If error persists, share:
1. **Server console logs** showing:
   - Authorization request log
   - Callback attempt log
   - Error details

2. **ScaleKit dashboard settings**:
   - Callback URL configured
   - Connection ID used

3. **Timing**:
   - How long between clicking "Sign in" and confirming?
   - Any delays or interruptions?

