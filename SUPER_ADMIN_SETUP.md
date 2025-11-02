# Super Admin Setup Instructions

## Super Admin User: james@ekaty.com

This user has been configured as a super admin with full access and no paywall restrictions.

## Setup Steps

### Option 1: Create User in ScaleKit Dashboard (Recommended)

1. **Sign in to ScaleKit Dashboard**:
   - Go to https://scalekit.com
   - Log in to your account

2. **Create the User**:
   - Navigate to **Users** or **User Management**
   - Click **Add User** or **Create User**
   - Enter:
     - **Email**: `james@ekaty.com`
     - **Password**: `pa$$word`
   - Set the user as **Verified** or **Confirmed**

3. **Login**:
   - Go to http://localhost:3002/auth/signin
   - Enter email: `james@ekaty.com`
   - Enter password: `pa$$word`
   - The system will automatically recognize this email and grant super admin privileges

### Option 2: Sign Up Through Application

1. **Sign Up**:
   - Go to http://localhost:3002/auth/signup
   - Enter email: `james@ekaty.com`
   - Complete the signup process in ScaleKit

2. **Set Password**:
   - After initial signup, you may need to set the password in ScaleKit dashboard
   - Or use ScaleKit's password reset flow

3. **Login**:
   - The system will automatically recognize `james@ekaty.com` as super admin

## Super Admin Privileges

When logged in as `james@ekaty.com`, the user automatically receives:

- ✅ **Role**: `superadmin`
- ✅ **Full Access**: All features and endpoints
- ✅ **No Paywall**: All restrictions bypassed
- ✅ **Subscription Tier**: `enterprise` (unlimited access)
- ✅ **Admin Functions**: Access to all admin features

## How It Works

The system checks the user's email during authentication:

1. **On Login**: When `james@ekaty.com` authenticates through ScaleKit
2. **Callback Handler**: Automatically detects the email and grants super admin role
3. **Session Cookie**: Stores `isSuperAdmin: true` and `paywallBypass: true`
4. **API Endpoints**: All endpoints check for super admin status and bypass restrictions

## Verification

After logging in, you can verify super admin status by:

1. **Check `/api/auth/me` endpoint**:
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

2. **Check Dashboard**: Should show admin features and no paywall restrictions

## Troubleshooting

### User not recognized as super admin:
- Verify the email matches exactly: `james@ekaty.com` (case-sensitive)
- Check that the session cookie contains the correct email
- Restart the development server after changes

### Cannot create user in ScaleKit:
- Ensure you have admin access to your ScaleKit account
- Check ScaleKit documentation for user management
- Contact ScaleKit support if needed

## Security Note

The super admin email is hardcoded in:
- `lib/utils/user-permissions.ts` - `SUPER_ADMIN_EMAIL` constant
- `app/auth/callback/route.ts` - Checks email during authentication
- `app/api/auth/me/route.ts` - Verifies admin status on each request

Do not change this email without updating all references.

