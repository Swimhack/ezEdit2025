# Quickstart: Resolve Authentication Regression Issue

**Feature**: 012-invalid-email-or | **Date**: 2025-09-20

## Overview

This quickstart guide provides step-by-step instructions to test the authentication regression fix and user migration functionality. Follow these scenarios to validate that previously working credentials are restored and new users can register successfully.

## Prerequisites

1. **Test Environment**: Development environment with both demo and Supabase authentication
2. **Test Accounts**: Known demo user credentials and real user credentials
3. **Database Access**: Ability to verify migration in Supabase database
4. **Monitoring Tools**: Access to logs and authentication metrics

## Test Scenarios

### Scenario 1: Demo User Authentication and Migration

**Objective**: Verify that demo users can login and are automatically migrated to Supabase

#### Steps:
1. **Attempt Demo User Login**
   ```
   POST /api/auth/signin
   Content-Type: application/json

   {
     "email": "demo@example.com",
     "password": "demo123"
   }
   ```

2. **Verify Successful Authentication**
   ```
   Expected Response (200):
   {
     "user": {
       "id": "uuid-here",
       "email": "demo@example.com",
       "role": "user",
       "authProvider": "SUPABASE",
       "migrationStatus": "COMPLETED"
     },
     "session": {
       "accessToken": "jwt-token-here",
       "refreshToken": "refresh-token-here",
       "expiresAt": 1640995200000,
       "sessionType": "SUPABASE"
     },
     "migration": {
       "wasMigrated": true,
       "fromProvider": "DEMO",
       "toProvider": "SUPABASE",
       "migrationTrigger": "LOGIN_ATTEMPT"
     },
     "correlationId": "correlation-uuid"
   }
   ```

3. **Verify Migration in Database**
   ```sql
   -- Check user account was created in Supabase
   SELECT id, email, auth_provider, migration_status
   FROM user_accounts
   WHERE email = 'demo@example.com';

   -- Check migration log was created
   SELECT from_provider, to_provider, status, completed_at
   FROM user_migration_logs
   WHERE user_id = 'user-uuid';
   ```

4. **Test Subsequent Login**
   ```
   POST /api/auth/signin
   Content-Type: application/json

   {
     "email": "demo@example.com",
     "password": "demo123"
   }

   Expected: Normal Supabase authentication (no migration this time)
   ```

#### Expected Results:
- Demo user successfully authenticates on first attempt
- User account is created in Supabase database
- Migration log entry is created
- Subsequent logins use Supabase authentication
- Session token is valid JWT format

### Scenario 2: Real User Authentication (Regression Fix)

**Objective**: Verify that real users with Supabase accounts can login normally

#### Steps:
1. **Create Real User Account**
   ```
   POST /api/auth/signup
   Content-Type: application/json

   {
     "email": "realuser@example.com",
     "password": "securepassword123",
     "name": "Real User"
   }
   ```

2. **Verify Account Creation**
   ```
   Expected Response (201):
   {
     "user": {
       "id": "uuid-here",
       "email": "realuser@example.com",
       "name": "Real User",
       "role": "user",
       "authProvider": "SUPABASE",
       "migrationStatus": "COMPLETED"
     },
     "message": "Account created successfully",
     "correlationId": "correlation-uuid"
   }
   ```

3. **Test Login with Real Credentials**
   ```
   POST /api/auth/signin
   Content-Type: application/json

   {
     "email": "realuser@example.com",
     "password": "securepassword123"
   }
   ```

4. **Verify Successful Authentication**
   ```
   Expected Response (200):
   {
     "user": {
       "id": "uuid-here",
       "email": "realuser@example.com",
       "role": "user",
       "authProvider": "SUPABASE"
     },
     "session": {
       "accessToken": "jwt-token-here",
       "refreshToken": "refresh-token-here",
       "sessionType": "SUPABASE"
     },
     "correlationId": "correlation-uuid"
   }
   ```

#### Expected Results:
- Real user can register successfully
- Real user can login without migration
- No migration log entries are created
- Session tokens are valid Supabase JWT format

### Scenario 3: Error Handling and Recovery

**Objective**: Verify that authentication errors provide clear guidance and recovery options

#### Steps:
1. **Test Invalid Demo Credentials**
   ```
   POST /api/auth/signin
   Content-Type: application/json

   {
     "email": "demo@example.com",
     "password": "wrongpassword"
   }
   ```

2. **Verify Error Response**
   ```
   Expected Response (401):
   {
     "error": "Invalid email or password",
     "errorCode": "INVALID_CREDENTIALS",
     "category": "USER_ERROR",
     "recoveryActions": [
       "Check your email and password",
       "Use password reset if needed"
     ],
     "retryable": true,
     "correlationId": "correlation-uuid"
   }
   ```

3. **Test Non-Existent User**
   ```
   POST /api/auth/signin
   Content-Type: application/json

   {
     "email": "nonexistent@example.com",
     "password": "anypassword"
   }
   ```

4. **Verify Error Response**
   ```
   Expected Response (401):
   {
     "error": "Invalid email or password",
     "errorCode": "INVALID_CREDENTIALS",
     "category": "USER_ERROR",
     "recoveryActions": [
       "Check your email and password",
       "Create an account if you don't have one"
     ],
     "retryable": true,
     "correlationId": "correlation-uuid"
   }
   ```

5. **Test Registration with Demo Email**
   ```
   POST /api/auth/signup
   Content-Type: application/json

   {
     "email": "demo@example.com",
     "password": "newpassword",
     "name": "Demo User"
   }
   ```

6. **Verify Conflict Response**
   ```
   Expected Response (409):
   {
     "error": "Account exists as demo user",
     "errorCode": "DEMO_ACCOUNT_EXISTS",
     "category": "USER_ERROR",
     "recoveryActions": [
       "Try signing in instead",
       "Your account will be automatically upgraded"
     ],
     "correlationId": "correlation-uuid"
   }
   ```

#### Expected Results:
- Clear, actionable error messages for different scenarios
- Appropriate HTTP status codes
- Recovery guidance specific to error type
- Correlation IDs for tracking issues

### Scenario 4: Session Validation and Upgrade

**Objective**: Verify that session validation works for both demo and Supabase sessions

#### Steps:
1. **Create Demo Session** (using migrated demo user)
   ```
   POST /api/auth/signin
   Content-Type: application/json

   {
     "email": "demo@example.com",
     "password": "demo123"
   }

   // Extract accessToken from response
   ```

2. **Validate Session**
   ```
   POST /api/auth/session/validate
   Content-Type: application/json

   {
     "token": "jwt-token-from-step-1"
   }
   ```

3. **Verify Session Information**
   ```
   Expected Response (200):
   {
     "user": {
       "id": "uuid-here",
       "email": "demo@example.com",
       "role": "user"
     },
     "session": {
       "id": "session-uuid",
       "sessionType": "SUPABASE",
       "expiresAt": "2025-09-21T00:00:00Z"
     },
     "isValid": true,
     "correlationId": "correlation-uuid"
   }
   ```

4. **Test Invalid Session**
   ```
   POST /api/auth/session/validate
   Content-Type: application/json

   {
     "token": "invalid-token"
   }
   ```

5. **Verify Error Response**
   ```
   Expected Response (401):
   {
     "error": "Invalid session token",
     "errorCode": "SESSION_EXPIRED",
     "category": "USER_ERROR",
     "recoveryActions": [
       "Please sign in again"
     ],
     "correlationId": "correlation-uuid"
   }
   ```

#### Expected Results:
- Valid sessions are properly validated
- Invalid sessions return appropriate errors
- Session information includes correct metadata
- Both demo-migrated and native Supabase sessions work

### Scenario 5: Manual Migration (Admin Feature)

**Objective**: Verify that admin users can manually trigger migration for demo accounts

#### Steps:
1. **Login as Admin**
   ```
   POST /api/auth/signin
   Content-Type: application/json

   {
     "email": "admin@example.com",
     "password": "admin123"
   }

   // Extract accessToken for admin user
   ```

2. **Trigger Manual Migration**
   ```
   POST /api/auth/migrate
   Authorization: Bearer admin-jwt-token
   Content-Type: application/json

   {
     "email": "test@test.com",
     "password": "test",
     "newPassword": "newstrongpassword123"
   }
   ```

3. **Verify Migration Success**
   ```
   Expected Response (200):
   {
     "user": {
       "id": "uuid-here",
       "email": "test@test.com",
       "authProvider": "SUPABASE",
       "migrationStatus": "COMPLETED"
     },
     "migration": {
       "wasMigrated": true,
       "fromProvider": "DEMO",
       "toProvider": "SUPABASE",
       "migrationTrigger": "MANUAL"
     },
     "correlationId": "correlation-uuid"
   }
   ```

4. **Test Login with New Password**
   ```
   POST /api/auth/signin
   Content-Type: application/json

   {
     "email": "test@test.com",
     "password": "newstrongpassword123"
   }
   ```

#### Expected Results:
- Admin can manually trigger migration
- Demo account is converted to Supabase account
- Old password no longer works
- New password works for authentication

## Validation Checklist

### Authentication Requirements Validation

- [ ] **FR-001**: Previously working demo credentials now authenticate successfully
- [ ] **FR-002**: Error messages clearly distinguish between credential and system errors
- [ ] **FR-003**: Existing demo users are automatically migrated to Supabase
- [ ] **FR-004**: All authentication attempts are logged with sufficient detail
- [ ] **FR-005**: Demo users can login with same credentials as before (with migration)
- [ ] **FR-006**: Authentication behavior is consistent after system changes
- [ ] **FR-007**: Authentication fixes don't break existing working accounts
- [ ] **FR-008**: Clear error messages for all authentication failure scenarios
- [ ] **FR-009**: Switching authentication modes doesn't invalidate existing accounts
- [ ] **FR-010**: User credentials are validated against correct authentication backend

### Performance Validation

- [ ] **Authentication Speed**: Login response time < 500ms
- [ ] **Migration Speed**: Demo user migration < 2 seconds
- [ ] **Session Validation**: Token validation < 100ms
- [ ] **Error Response**: Error responses < 200ms

### Security Validation

- [ ] **Password Security**: Passwords are properly hashed in Supabase
- [ ] **Session Security**: JWT tokens are properly signed and validated
- [ ] **Migration Security**: Only valid demo users can be migrated
- [ ] **Error Information**: Errors don't leak sensitive information

### User Experience Validation

- [ ] **Seamless Migration**: Demo users don't notice migration happening
- [ ] **Clear Errors**: Users understand what went wrong and how to fix it
- [ ] **Consistent Behavior**: Same user experience regardless of authentication backend
- [ ] **Recovery Guidance**: Users can resolve authentication issues independently

## Troubleshooting Common Issues

### Issue: Migration Fails
**Symptoms**: Demo user gets "Migration failed" error
**Diagnosis Steps**:
1. Check Supabase service status and connectivity
2. Verify demo user exists in hardcoded list
3. Check for existing Supabase account with same email
4. Review migration logs for specific error details

### Issue: Session Validation Fails
**Symptoms**: Valid sessions are rejected
**Diagnosis Steps**:
1. Verify JWT token format and signature
2. Check token expiration time
3. Validate Supabase configuration
4. Review session validation logic

### Issue: Real Users Can't Login
**Symptoms**: "Invalid email or password" for Supabase users
**Diagnosis Steps**:
1. Check Supabase authentication service status
2. Verify user exists in Supabase auth table
3. Check password hashing and validation
4. Review authentication flow logic

### Issue: Demo Users Not Found
**Symptoms**: Demo credentials not recognized
**Diagnosis Steps**:
1. Verify demo user list in code
2. Check email format and casing
3. Review demo authentication logic
4. Confirm authentication order (demo first, then Supabase)

## Success Criteria

The authentication regression fix is considered successful when:

1. **Zero User Impact**: All previously working accounts can login successfully
2. **Seamless Migration**: Demo users are transparently upgraded to Supabase
3. **Clear Error Messages**: Users understand authentication issues and how to resolve them
4. **Performance Maintained**: Authentication response times remain fast
5. **Backward Compatibility**: System handles both demo and Supabase authentication during transition
6. **Complete Migration**: All demo users eventually migrated to Supabase with zero data loss

## Next Steps

After successful validation:

1. **Monitor Migration Progress**: Track how many demo users have been migrated
2. **Performance Monitoring**: Monitor authentication response times and error rates
3. **User Feedback**: Collect feedback on authentication experience
4. **Demo Cleanup**: Plan removal of demo authentication after full migration
5. **Documentation Update**: Update user guides with any authentication changes