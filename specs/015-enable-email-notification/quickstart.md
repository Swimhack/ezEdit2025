# Quickstart: Enable Email Notification System

**Feature**: 015-enable-email-notification | **Date**: 2025-09-20

## Quick Validation Scenarios

### Pre-Implementation Test Checklist
*Run these tests BEFORE implementation to ensure they fail (TDD approach)*

#### 1. Basic Email Send Test
```bash
# Test sending a basic email
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "templateId": "welcome",
    "templateData": {"name": "Test User"}
  }'
# Expected: SHOULD FAIL (endpoint doesn't exist yet)
```

#### 2. Notification Trigger Test
```bash
# Test triggering a notification event
curl -X POST http://localhost:3000/api/notifications/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "event": "welcome",
    "userId": "test-user-id",
    "data": {"email": "test@example.com"}
  }'
# Expected: SHOULD FAIL (feature not implemented)
```

#### 3. Preferences Management Test
```bash
# Test getting notification preferences
curl -X GET http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer test-token"
# Expected: SHOULD FAIL (endpoint doesn't exist)
```

## Post-Implementation Validation

### Test Scenario 1: Welcome Email Flow
**Objective**: Verify new user registration triggers welcome email

**Steps**:
1. Register a new user account
2. Check email queue for welcome notification
3. Verify email is sent within 30 seconds
4. Check Resend dashboard for delivery

**Expected Results**:
- Welcome email created with user data
- Email queued with priority 1 (immediate)
- Resend API called successfully
- Delivery status tracked in database

**Validation**:
```bash
# Check notification was created
curl http://localhost:3000/api/email/status/{notification-id}

# Verify in Resend dashboard
# https://resend.com/emails
```

### Test Scenario 2: Password Reset Email
**Objective**: Verify password reset email with secure token

**Steps**:
1. Request password reset for existing user
2. Verify email sent immediately (priority 1)
3. Check reset link contains valid token
4. Verify token expires after 24 hours

**Expected Results**:
- Reset email sent within 30 seconds
- Link contains unique, secure token
- Token stored with expiration
- Email logged in delivery log

**Validation**:
```bash
# Trigger password reset
curl -X POST http://localhost:3000/api/notifications/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "event": "password_reset",
    "userId": "user-id",
    "data": {"resetToken": "secure-token-here"}
  }'
```

### Test Scenario 3: User Preference Enforcement
**Objective**: Verify user preferences are respected

**Steps**:
1. Set user preferences to disable marketing emails
2. Trigger a marketing notification
3. Verify email is NOT sent
4. Trigger a transactional email
5. Verify transactional email IS sent

**Expected Results**:
- Marketing email skipped due to preferences
- Transactional email sent regardless
- Preferences checked before queuing
- Audit log shows skipped reason

**Validation**:
```bash
# Update preferences
curl -X PUT http://localhost:3000/api/notifications/preferences \
  -H "Authorization: Bearer user-token" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": {
      "marketing": false,
      "transactional": true
    }
  }'

# Check notification was skipped
# Response should show status: "skipped" with reason
```

### Test Scenario 4: Email Template Rendering
**Objective**: Verify templates render correctly

**Steps**:
1. Test welcome email template with sample data
2. Verify HTML and plain text versions
3. Check variable substitution works
4. Validate responsive design

**Expected Results**:
- Both HTML and text versions generated
- Variables replaced correctly
- No rendering errors
- Email displays correctly in clients

**Validation**:
```bash
# Preview template without sending
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "welcome",
    "templateData": {
      "name": "John Doe",
      "verifyUrl": "https://example.com/verify"
    }
  }'
```

### Test Scenario 5: Delivery Status Tracking
**Objective**: Verify delivery events are tracked

**Steps**:
1. Send an email to valid address
2. Wait for Resend webhook callbacks
3. Check delivery status updates
4. Verify events logged correctly

**Expected Results**:
- Initial status: "sent"
- Webhook updates status to "delivered"
- Open/click events tracked
- All events in delivery log

**Webhook Test**:
```bash
# Simulate Resend webhook
curl -X POST http://localhost:3000/api/email/webhooks/resend \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.delivered",
    "created_at": "2025-09-20T12:00:00Z",
    "data": {
      "email_id": "msg_123",
      "to": ["test@example.com"]
    }
  }'
```

### Test Scenario 6: Rate Limiting
**Objective**: Verify rate limits prevent abuse

**Steps**:
1. Send 10 emails from same user rapidly
2. Verify 11th email is rejected
3. Wait for rate limit window
4. Verify can send again

**Expected Results**:
- First 10 emails accepted
- 11th email returns 429 error
- Rate limit resets after 1 hour
- Admin alerts bypass limits

**Validation**:
```bash
# Send multiple emails quickly
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/email/send \
    -H "Content-Type: application/json" \
    -d '{"to": "test@example.com", "subject": "Test '$i'", "templateId": "test"}'
done
# 11th request should return 429 Too Many Requests
```

### Test Scenario 7: Failed Delivery Retry
**Objective**: Verify retry logic for failed emails

**Steps**:
1. Send email to invalid address
2. Wait for bounce notification
3. Verify retry attempts with backoff
4. Check max retries enforced

**Expected Results**:
- Initial send attempt fails
- Retry after 5 minutes
- Second retry after 15 minutes
- Third retry after 1 hour
- Marked failed after 3 retries

### Test Scenario 8: Unsubscribe Flow
**Objective**: Verify unsubscribe links work

**Steps**:
1. Send marketing email with unsubscribe link
2. Click unsubscribe link with token
3. Verify user preferences updated
4. Attempt to send marketing email
5. Verify email is skipped

**Expected Results**:
- Unsubscribe link contains unique token
- One-click unsubscribe works
- Preferences updated immediately
- Future marketing emails blocked

**Validation**:
```bash
# Unsubscribe using token
curl -X POST http://localhost:3000/api/notifications/unsubscribe/{token} \
  -H "Content-Type: application/json" \
  -d '{"reason": "Too many emails"}'
```

## Performance Testing

### Load Test: Bulk Email Sending
```bash
# Send 100 emails concurrently
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/email/send \
    -H "Content-Type: application/json" \
    -d '{"to": "test'$i'@example.com", "subject": "Load Test", "templateId": "test"}' &
done
wait

# Expected:
# - All emails queued successfully
# - Processing time <2s per email
# - Queue processes in priority order
```

### Stress Test: Template Rendering
```bash
# Render complex template 50 times
for i in {1..50}; do
  curl -X POST http://localhost:3000/api/email/test \
    -H "Content-Type: application/json" \
    -d '{"templateId": "complex-template", "templateData": {...}}' &
done
wait

# Expected:
# - All templates render <100ms
# - No memory leaks
# - Consistent output
```

## Security Testing

### Test: Email Injection Prevention
```bash
# Attempt email header injection
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "victim@example.com\nBcc: attacker@evil.com",
    "subject": "Test",
    "templateId": "test"
  }'
# Expected: 400 Bad Request - Invalid email format
```

### Test: Template Data Sanitization
```bash
# Attempt XSS in template data
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "welcome",
    "templateData": {
      "name": "<script>alert(\"XSS\")</script>"
    }
  }'
# Expected: Script tags sanitized in output
```

## Monitoring & Metrics

### Key Metrics to Verify
- **Delivery Rate**: >98% for valid addresses
- **Send Latency**: <2 seconds average
- **Queue Processing**: <30 seconds for priority 1
- **Template Rendering**: <100ms average
- **API Response Time**: <200ms p95

### Health Check Endpoint
```bash
# Check email service health
curl http://localhost:3000/api/email/health

# Expected response:
{
  "status": "healthy",
  "resend": "connected",
  "queue": "operational",
  "metrics": {
    "sent_today": 150,
    "delivery_rate": 0.98,
    "avg_send_time_ms": 1500
  }
}
```

## Rollback Plan

If critical issues discovered:

### Quick Disable (< 1 minute)
```javascript
// Set environment variable
DISABLE_EMAIL_NOTIFICATIONS=true
// All emails will be logged but not sent
```

### Partial Rollback (< 5 minutes)
- Disable specific notification types
- Keep transactional emails active
- Route to fallback email service

### Full Rollback (< 15 minutes)
- Revert deployment
- Clear email queue
- Restore previous email system

## Success Criteria

### Functional Success
- [ ] All test scenarios pass
- [ ] No critical bugs in 24 hours
- [ ] Delivery rate >98%
- [ ] User preferences enforced

### Performance Success
- [ ] Send latency <2s average
- [ ] Queue processing <30s
- [ ] Template rendering <100ms
- [ ] API response <200ms p95

### User Experience Success
- [ ] Emails display correctly in major clients
- [ ] Unsubscribe works with one click
- [ ] No spam folder delivery
- [ ] Positive user feedback

---

**Resend API Key**: `re_37YYP2iE_KbLqkdskcjngf9XqFMJZv1xG`
**Dashboard**: https://resend.com/emails
**Documentation**: https://resend.com/docs