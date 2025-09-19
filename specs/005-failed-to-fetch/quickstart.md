# Quickstart Guide: Authentication Error Resolution and Application Logging

**Feature Branch**: `005-failed-to-fetch` | **Date**: 2025-09-18 | **Phase**: 1
**Prerequisites**: Implementation complete, all contract tests passing

## Overview

This quickstart guide validates the successful implementation of reliable authentication flows and comprehensive application logging system. Follow these steps to verify all functional requirements are met.

## Prerequisites

- ✅ All contract tests passing (`npm test tests/contract/`)
- ✅ Integration tests passing (`npm test tests/integration/`)
- ✅ Development server running (`npm run dev`)
- ✅ Database migrations applied
- ✅ Environment variables configured

## Test Scenarios from User Stories

### Scenario 1: Successful User Registration (FR-002)
**User Story**: As a user trying to access EzEdit, I need the signup process to work reliably without encountering "failed to fetch" errors.

**Steps**:
1. Navigate to signup page: `http://localhost:3000/auth/signup`
2. Fill in registration form:
   - Email: `quickstart-test@example.com`
   - Password: `TestPassword123!`
   - Company: `Quickstart Test Company`
   - Plan: `FREE`
3. Submit the form
4. Verify successful registration without fetch errors

**Expected Results**:
- ✅ Form submits without "failed to fetch" error
- ✅ User redirected to dashboard
- ✅ Welcome message displayed
- ✅ User session established
- ✅ Authentication event logged

**Validation Commands**:
```bash
# Check authentication logs
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?type=authentication&limit=5"

# Should show successful signup event
```

### Scenario 2: Successful User Login (FR-001)
**User Story**: As a user trying to access EzEdit, I need the login process to work reliably without encountering "failed to fetch" errors.

**Steps**:
1. Navigate to login page: `http://localhost:3000/auth/signin`
2. Enter credentials:
   - Email: `quickstart-test@example.com`
   - Password: `TestPassword123!`
3. Submit the form
4. Verify successful login without fetch errors

**Expected Results**:
- ✅ Form submits without "failed to fetch" error
- ✅ User redirected to dashboard
- ✅ User session established
- ✅ Login event logged with metadata

**Validation Commands**:
```bash
# Check recent authentication events
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?type=authentication&from=$(date -d '1 hour ago' -Iseconds)"
```

### Scenario 3: Network Error Recovery (FR-007)
**User Story**: When network issues occur during authentication, the system should handle them gracefully with retry mechanisms.

**Steps**:
1. Open browser developer tools (Network tab)
2. Navigate to login page: `http://localhost:3000/auth/signin`
3. Enter valid credentials
4. Enable network throttling (Slow 3G) in dev tools
5. Submit the form
6. Observe retry behavior

**Expected Results**:
- ✅ Automatic retry on network failure
- ✅ User-friendly loading indicator
- ✅ Clear error message if retries exhausted
- ✅ No "failed to fetch" error displayed
- ✅ Network errors logged for troubleshooting

### Scenario 4: Input Validation and Security (FR-008)
**User Story**: All user input during authentication should be validated and sanitized to prevent security vulnerabilities.

**Steps**:
1. Navigate to signup page
2. Attempt registration with malicious input:
   - Email: `test+<script>alert('xss')</script>@example.com`
   - Password: `TestPassword123!`
   - Company: `<img src=x onerror=alert('xss')>Test Company`
3. Submit the form
4. Verify input sanitization

**Expected Results**:
- ✅ Malicious scripts removed from input
- ✅ Form validation prevents submission of invalid data
- ✅ Sanitized data stored in database
- ✅ Security events logged

**Validation Commands**:
```bash
# Check for security-related logs
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?level=warn&limit=10"
```

### Scenario 5: Comprehensive Error Logging (FR-004, FR-005)
**User Story**: When issues occur, the development team needs comprehensive logging to quickly identify and resolve problems.

**Steps**:
1. Navigate to login page
2. Enter invalid credentials:
   - Email: `invalid@example.com`
   - Password: `wrongpassword`
3. Submit the form multiple times
4. Access logging endpoint as admin user
5. Verify error details captured

**Expected Results**:
- ✅ Failed authentication attempts logged
- ✅ Error context includes timestamp, IP, user agent
- ✅ No sensitive data (passwords) in logs
- ✅ Correlation IDs for request tracing
- ✅ Rate limiting triggered after multiple failures

**Validation Commands**:
```bash
# Get authentication error logs
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?type=authentication&level=error"

# Get error logs with correlation ID
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?correlationId=<CORRELATION_ID>"
```

### Scenario 6: Secure Log Access (FR-006, FR-010)
**User Story**: Authorized users should be able to access application logs securely for troubleshooting.

**Steps**:
1. Create admin user account
2. Authenticate as admin user
3. Access logs endpoint: `GET /api/logs`
4. Try accessing as regular user
5. Verify role-based access control

**Expected Results**:
- ✅ Admin users can access all logs
- ✅ Developer users can access project logs
- ✅ Regular users cannot access logs
- ✅ Log access events are audited
- ✅ Sensitive data filtered from responses

**Validation Commands**:
```bash
# Test admin access
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs"

# Test unauthorized access
curl -H "Authorization: Bearer $USER_TOKEN" \
  "http://localhost:3000/api/logs"

# Should return 403 Forbidden
```

## Performance Validation

### Authentication Response Time (< 2 seconds)
```bash
# Measure authentication performance
time curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"quickstart-test@example.com","password":"TestPassword123!"}' \
  "http://localhost:3000/api/auth/signin"
```

### Log Retrieval Performance (< 500ms)
```bash
# Measure log retrieval performance
time curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?limit=100"
```

## Data Retention Validation

### Log Retention Policy Check
```bash
# Check logs older than retention period are cleaned up
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?from=2023-01-01T00:00:00Z&to=2023-12-31T23:59:59Z"

# Should return empty or minimal results for old data
```

## Security Validation

### Rate Limiting Test
```bash
# Test authentication rate limiting
for i in {1..10}; do
  curl -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@example.com","password":"wrong"}' \
    "http://localhost:3000/api/auth/signin"
  echo "Request $i completed"
done

# Should show rate limiting after 5 attempts
```

### Input Sanitization Test
```bash
# Test SQL injection protection
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","company":"Company\"; DROP TABLE users; --"}' \
  "http://localhost:3000/api/auth/signup"

# Should sanitize malicious input
```

## Monitoring and Alerting

### Error Rate Monitoring
```bash
# Check error rate in last hour
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?level=error&from=$(date -d '1 hour ago' -Iseconds)"

# Should show manageable error rate
```

### System Health Check
```bash
# Verify all endpoints respond correctly
curl -f "http://localhost:3000/api/health" || echo "Health check failed"
curl -f "http://localhost:3000/auth/signin" || echo "Sign-in page failed"
curl -f "http://localhost:3000/auth/signup" || echo "Sign-up page failed"
```

## Troubleshooting Common Issues

### Issue: "Failed to fetch" errors still occurring
**Check**:
1. Network connectivity: `ping google.com`
2. Server status: `curl http://localhost:3000/api/health`
3. Browser console for specific error messages
4. Server logs: `docker logs <container-id>` or `pm2 logs`

### Issue: Logs not appearing in endpoint
**Check**:
1. Database connection: Verify Supabase connectivity
2. User permissions: Confirm user role in database
3. Log level configuration: Check minimum log level settings
4. Recent log entries: Look for logs within retention period

### Issue: Authentication taking too long
**Check**:
1. Database query performance
2. Network latency to Supabase
3. Server resource usage
4. Rate limiting configuration

## Cleanup

After completing quickstart validation:

```bash
# Remove test user
curl -X DELETE \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/users/quickstart-test@example.com"

# Clear test logs (optional)
curl -X DELETE \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:3000/api/logs?user=quickstart-test@example.com"
```

## Success Criteria

All scenarios must pass with the following criteria:

- ✅ **Zero "failed to fetch" errors** during normal operation
- ✅ **Authentication completes in < 2 seconds**
- ✅ **Log retrieval in < 500ms**
- ✅ **All security validations pass**
- ✅ **Role-based access control enforced**
- ✅ **Comprehensive error logging functional**
- ✅ **Data retention policies active**
- ✅ **Rate limiting functional**
- ✅ **Input sanitization effective**

---
*Quickstart validation complete - Feature ready for production deployment*