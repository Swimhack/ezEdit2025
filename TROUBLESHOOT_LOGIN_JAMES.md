# Troubleshooting Login for james@ekaty.com

## Current Authentication Flow

Since we're using ScaleKit, the login process works like this:

1. **User enters email** (`james@ekaty.com`) on signin page
2. **Frontend calls** `/api/auth/signin` with email
3. **Server generates** ScaleKit authorization URL
4. **User is redirected** to ScaleKit's hosted login page
5. **User authenticates** on ScaleKit (password, social login, etc.)
6. **ScaleKit redirects back** to `/auth/callback` with authorization code
7. **Server exchanges code** for user data
8. **System recognizes** `james@ekaty.com` and grants super admin privileges
9. **User is redirected** to dashboard

## Step-by-Step Troubleshooting

### Step 1: Verify ScaleKit Configuration

**Check your `.env.local` file**:
```bash
SCALEKIT_ENVIRONMENT_URL=https://your-actual-url.scalekit.com
SCALEKIT_CLIENT_ID=your_actual_client_id
SCALEKIT_CLIENT_SECRET=your_actual_secret
```

**Verify**:
- ✅ No placeholder values (`your-environment`, `your_client_id_here`, etc.)
- ✅ No quotes around values
- ✅ No extra spaces
- ✅ Server was restarted after updating

### Step 2: Verify User Exists in ScaleKit

**In ScaleKit Dashboard**:
1. Go to **Users** or **User Management**
2. Search for `james@ekaty.com`
3. If user doesn't exist:
   - Click **Add User** or **Create User**
   - Email: `james@ekaty.com`
   - Password: `pa$$word`
   - Mark as **Verified** or **Confirmed**

### Step 3: Verify Callback URL Configuration

**In ScaleKit Dashboard**:
1. Go to **Settings** → **Redirects** or **Allowed Callback URIs**
2. Ensure this URL is added:
   ```
   http://localhost:3002/auth/callback
   ```
3. **Important**: Must match exactly (including `http` vs `https`)

### Step 4: Test the Login Flow

1. **Open browser console** (F12 → Console tab)
2. **Go to** http://localhost:3002/auth/signin
3. **Enter email**: `james@ekaty.com`
4. **Click Sign In**
5. **Watch for**:
   - Any errors in browser console
   - Redirect to ScaleKit login page
   - Any error messages on the page

### Step 5: Check Server Logs

**In your terminal where `npm run dev` is running**, look for:

- `ScaleKit authorization error:` - Shows what went wrong
- `Error stack:` - Shows where it failed
- `Error details:` - Shows more context

## Common Issues and Solutions

### Issue 1: "Server temporarily unavailable" Error

**Cause**: ScaleKit SDK is throwing an error when generating authorization URL

**Solution**:
1. Check server console for actual error
2. Verify ScaleKit credentials are correct
3. Ensure callback URL is configured in ScaleKit
4. Verify server was restarted after updating `.env.local`

### Issue 2: Redirects to ScaleKit but Shows Error

**Cause**: Callback URL not configured or mismatch

**Solution**:
1. Check ScaleKit Dashboard → Settings → Redirects
2. Ensure `http://localhost:3002/auth/callback` is added
3. Verify no trailing slashes or differences

### Issue 3: User Not Found in ScaleKit

**Cause**: User doesn't exist in ScaleKit

**Solution**:
1. Create user in ScaleKit Dashboard
2. Or sign up through the app first
3. Then try logging in

### Issue 4: User Exists but Can't Authenticate

**Cause**: Password mismatch or account not verified

**Solution**:
1. Reset password in ScaleKit Dashboard
2. Verify account is marked as "Verified" or "Confirmed"
3. Try password reset flow

### Issue 5: User Logs In but Not Recognized as Super Admin

**Cause**: Email check might be failing

**Solution**:
1. Verify email matches exactly: `james@ekaty.com` (case-sensitive)
2. Check browser console for session data
3. Check `/api/auth/me` endpoint response
4. Verify callback handler is setting correct role

## Debugging Commands

### Check Environment Variables:
```bash
# In your terminal
cd ezedit
node -e "require('dotenv').config({path:'.env.local'}); console.log('URL:', process.env.SCALEKIT_ENVIRONMENT_URL); console.log('Client ID:', process.env.SCALEKIT_CLIENT_ID ? 'Set' : 'Not set'); console.log('Secret:', process.env.SCALEKIT_CLIENT_SECRET ? 'Set' : 'Not set')"
```

### Test API Endpoint Directly:
```bash
# Using curl or Postman
curl -X POST http://localhost:3002/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"james@ekaty.com","redirectTo":"http://localhost:3002/auth/callback"}'
```

## Expected Behavior

### Successful Login Flow:

1. ✅ User enters `james@ekaty.com` and clicks Sign In
2. ✅ Page redirects to ScaleKit login page
3. ✅ User enters password (`pa$$word`) on ScaleKit page
4. ✅ ScaleKit redirects back to your app
5. ✅ User is redirected to dashboard
6. ✅ `/api/auth/me` shows:
   ```json
   {
     "user": {
       "email": "james@ekaty.com",
       "role": "superadmin",
       "isSuperAdmin": true,
       "paywallBypass": true,
       "subscriptionTier": "enterprise"
     }
   }
   ```

## Next Steps

1. **Check browser console** (F12) for any errors
2. **Check server console** for ScaleKit errors
3. **Verify user exists** in ScaleKit dashboard
4. **Verify callback URL** is configured
5. **Try the login flow** and note any errors
6. **Share the specific error messages** you see

This will help identify the exact issue!

