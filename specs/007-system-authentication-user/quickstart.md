# Quickstart: System Authentication User Login Setup

**Date**: 2025-09-17
**Feature**: System Authentication User Login Setup
**Purpose**: Validate authentication system implementation and verify user flows

## Prerequisites

- Next.js 14 development environment
- Supabase project configured and running
- Test email accounts for verification flows
- Browser developer tools for session inspection

## Quick Validation (10 minutes)

### 1. Database Setup Verification
```bash
# Verify Supabase tables exist
psql $DATABASE_URL -c "
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_profiles', 'user_preferences', 'oauth_connections', 'auth_sessions', 'auth_events');
"
# Should show all 5 tables
```

### 2. Basic Authentication Flow
```bash
# Start the development server
npm run dev

# Open browser to localhost:3000/auth/signup
# Should show registration form with:
# - Email field
# - Password field with strength indicator
# - Display name field
# - Terms acceptance checkbox
# - OAuth buttons for Google/GitHub
```

### 3. User Registration Test
```typescript
// POST /api/auth/register
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "displayName": "Test User",
  "acceptedTerms": true
}

// Expected response:
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "test@example.com" },
    "session": { "id": "...", "expiresAt": "..." },
    "preferences": { "theme": "light", "language": "en" }
  }
}
```

### 4. Login and Session Validation
```bash
# Verify session cookie is set
# Check browser developer tools → Application → Cookies
# Should see httpOnly session cookie with secure flag

# Test login endpoint
curl -X POST localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

## Integration Test Scenarios

### Scenario 1: Complete User Registration and Login Flow
```gherkin
Given a new user visits the registration page
When they fill out the form with valid information
And they accept the terms of service
And they submit the registration form
Then they should receive an email verification link
And their account should be created in pending status
When they click the verification link
Then their account should be activated
And they should be automatically logged in
And their default preferences should be created
```

**Test Steps**:
1. Navigate to `/auth/signup`
2. Fill form: email, password, display name
3. Submit and verify database entry:
   ```sql
   SELECT * FROM auth.users WHERE email = 'test@example.com';
   SELECT * FROM user_profiles WHERE user_id = '...';
   SELECT * FROM user_preferences WHERE user_id = '...';
   ```
4. Check audit log entry:
   ```sql
   SELECT * FROM auth_events WHERE event_type = 'registration' ORDER BY created_at DESC LIMIT 1;
   ```

**Success Criteria**:
- User created with pending verification status
- Email verification sent
- Default preferences created
- Registration event logged
- Password properly hashed

### Scenario 2: OAuth Authentication Flow
```gherkin
Given a user wants to sign in with Google
When they click the "Sign in with Google" button
Then they should be redirected to Google's OAuth consent screen
When they grant permission
And Google redirects back to the application
Then their account should be created or linked
And they should be logged in
And their profile information should be synced
```

**Test Steps**:
1. Configure Google OAuth in Supabase dashboard
2. Click "Sign in with Google" button
3. Complete OAuth flow in test browser
4. Verify OAuth connection created:
   ```sql
   SELECT * FROM oauth_connections WHERE provider = 'google';
   ```
5. Check session creation and preferences

**Success Criteria**:
- OAuth redirect properly formatted
- State parameter validated
- User account created/linked
- Profile data synced from Google
- OAuth connection stored
- Session established

### Scenario 3: User Preference Persistence
```gherkin
Given a logged-in user
When they change their theme preference to "dark"
And they set their editor font size to 16
And they log out and log back in
Then their preferences should be restored
And the UI should reflect their chosen theme
And the editor should use their font size
```

**Test Steps**:
1. Login as test user
2. Navigate to settings page
3. Change preferences:
   ```typescript
   PUT /api/auth/preferences
   {
     "preferences": {
       "theme": "dark",
       "editorSettings": { "fontSize": 16 }
     }
   }
   ```
4. Verify database update:
   ```sql
   SELECT preferences FROM user_preferences WHERE user_id = '...';
   ```
5. Logout and login again
6. Check preferences are applied

**Success Criteria**:
- Preferences saved to database
- UI reflects changes immediately
- Preferences persist across sessions
- Changes logged in audit trail

### Scenario 4: Rate Limiting and Security
```gherkin
Given a user attempts to login with wrong credentials
When they make 5 failed login attempts within 15 minutes
Then their account should be temporarily locked
And subsequent attempts should be blocked
And they should receive appropriate error messages
And security events should be logged
```

**Test Steps**:
1. Attempt login with incorrect password 5 times:
   ```bash
   for i in {1..5}; do
     curl -X POST localhost:3000/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}'
   done
   ```
2. Verify rate limiting kicks in
3. Check audit logs:
   ```sql
   SELECT * FROM auth_events
   WHERE event_type = 'login_failure'
   AND user_id = '...'
   ORDER BY created_at DESC;
   ```
4. Test legitimate login is blocked
5. Wait for cooldown period

**Success Criteria**:
- Progressive delays implemented
- Account temporarily locked after threshold
- All attempts logged with details
- Legitimate users can still access after cooldown
- Error messages don't reveal account existence

### Scenario 5: Password Reset Flow
```gherkin
Given a user has forgotten their password
When they request a password reset
Then they should receive a reset email with a secure token
When they click the reset link
And they enter a new password
Then their password should be updated
And all existing sessions should be invalidated
And they should be able to login with the new password
```

**Test Steps**:
1. Request password reset:
   ```typescript
   POST /api/auth/reset-password
   { "email": "test@example.com" }
   ```
2. Check email delivery and token generation:
   ```sql
   SELECT * FROM account_recovery WHERE email = 'test@example.com' AND type = 'password_reset';
   ```
3. Use reset token to change password:
   ```typescript
   POST /api/auth/reset-password/confirm
   {
     "token": "...",
     "newPassword": "NewSecurePass123!"
   }
   ```
4. Verify old sessions invalidated
5. Test login with new password

**Success Criteria**:
- Reset email sent within 30 seconds
- Token expires after 1 hour
- Password updated securely
- All sessions invalidated
- Reset event logged

## Manual Testing Procedures

### 1. UI/UX Validation
```bash
# Test 1: Registration Form Validation
# Navigate to /auth/signup
# Try invalid inputs:
# - Invalid email format
# - Weak password
# - Missing required fields
# Verify appropriate error messages

# Test 2: Login Form Features
# Navigate to /auth/signin
# Test features:
# - "Remember me" checkbox
# - "Forgot password" link
# - OAuth provider buttons
# - Form validation

# Test 3: Settings Page
# Navigate to /settings after login
# Test preference categories:
# - Theme selection (light/dark/system)
# - Language selection
# - Editor settings
# - Notification preferences
# - Security settings
```

### 2. Session Management Testing
```bash
# Test 4: Multiple Device Sessions
# Login from different browsers/devices
# Verify sessions listed in /settings/sessions
# Test session revocation:
curl -X DELETE localhost:3000/api/auth/sessions/[sessionId]

# Test 5: Session Timeout
# Set short timeout in settings
# Leave browser idle
# Verify automatic logout
# Check session cleanup
```

### 3. Security Testing
```bash
# Test 6: OAuth Security
# Verify state parameter in OAuth flow
# Test invalid/expired OAuth responses
# Check for CSRF protection

# Test 7: Session Security
# Verify HTTP-only cookies
# Test CSRF token validation
# Check for session fixation protection

# Test 8: Data Validation
# Test SQL injection attempts
# Verify XSS protection
# Test input sanitization
```

## Performance Validation

### Response Time Benchmarks
```bash
# Measure authentication endpoint performance
ab -n 100 -c 10 localhost:3000/api/auth/login

# Expected results:
# - Login: <500ms average
# - Registration: <1000ms average
# - Preference loading: <100ms average
# - Session validation: <50ms average
```

### Database Performance
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM auth_events WHERE user_id = '...' ORDER BY created_at DESC LIMIT 10;

-- Verify indexes are used
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public';
```

### Memory Usage Testing
```bash
# Monitor memory usage during load
ps aux | grep node
top -p [node_process_id]

# Expected memory usage:
# - Base application: <200MB
# - Under load (100 concurrent): <500MB
# - No memory leaks after testing
```

## Automated Testing Integration

### Jest Unit Tests Setup
```typescript
// tests/auth/login.test.ts
describe('Authentication API', () => {
  test('successful login returns user and session', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.session).toBeDefined();
  });
});
```

### Playwright E2E Tests
```typescript
// tests/e2e/auth-flow.spec.ts
test('complete authentication flow', async ({ page }) => {
  // Registration
  await page.goto('/auth/signup');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'SecurePass123!');
  await page.click('[data-testid="register-button"]');

  // Verify redirect to dashboard
  await expect(page).toHaveURL('/dashboard');

  // Test logout
  await page.click('[data-testid="logout-button"]');
  await expect(page).toHaveURL('/');
});
```

### CI/CD Integration
```yaml
# .github/workflows/auth-tests.yml
name: Authentication Tests
on: [push, pull_request]
jobs:
  auth-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run auth unit tests
        run: npm run test:auth
      - name: Run auth e2e tests
        run: npm run test:e2e:auth
```

## Error Scenarios and Recovery

### Common Error Cases
1. **Database Connection Lost**
   - Expected: Graceful error message
   - Recovery: Automatic retry with exponential backoff

2. **Email Service Down**
   - Expected: Registration succeeds, verification queued
   - Recovery: Background retry for email delivery

3. **OAuth Provider Unavailable**
   - Expected: Clear error message with alternative options
   - Recovery: Fallback to email/password login

4. **Rate Limit Exceeded**
   - Expected: User-friendly error with retry time
   - Recovery: Progressive unlock based on behavior

### Recovery Procedures
```bash
# Clear rate limit for user (admin only)
redis-cli DEL "rate_limit:login:user@example.com"

# Unlock account manually
UPDATE user_profiles SET locked_until = NULL WHERE email = 'user@example.com';

# Cleanup expired sessions
DELETE FROM auth_sessions WHERE expires_at < NOW();

# Force logout all sessions for user
UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = '...';
```

## Success Metrics

### Functional Success
- ✅ All authentication methods working (email, OAuth)
- ✅ User preferences persist across sessions
- ✅ Session management operates correctly
- ✅ Password reset flow completes successfully
- ✅ Rate limiting prevents abuse
- ✅ Audit logging captures all events
- ✅ GDPR compliance for data retention

### Performance Success
- ✅ <500ms authentication response time
- ✅ <100ms preference loading
- ✅ Support for 1000+ concurrent users
- ✅ Database queries use appropriate indexes
- ✅ Memory usage remains stable under load

### Security Success
- ✅ No authentication bypasses possible
- ✅ Session security properly implemented
- ✅ OAuth flows secure and validated
- ✅ Rate limiting effective against attacks
- ✅ Audit trail complete and tamper-resistant
- ✅ User data properly encrypted at rest

---

**Quickstart Complete**: Ready for systematic implementation and validation