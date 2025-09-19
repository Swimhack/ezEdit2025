# Quickstart Guide: Application Logging, Notifications, and Email System

**Feature**: Comprehensive logging, multi-channel notifications, and reliable email
**Time to Test**: ~20 minutes

## Prerequisites
- Next.js development environment running
- Resend API key configured in environment
- Twilio account for SMS testing (optional)
- Test email account accessible

## Environment Setup

Create `.env.local` with required services:
```env
# Resend API
RESEND_API_KEY=re_37YYP2iE_KbLqkdskcjngf9XqFMJZv1xG

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_RETENTION_DAYS=30
NOTIFICATION_RATE_LIMIT=100
```

## Quick Test Flow

### 1. Application Logging System

```bash
# Start the development server
cd ezedit
npm run dev
```

#### Test Log Generation
1. Navigate to any page to generate logs
2. **Verify**: Check server console for structured log entries
3. **Verify**: Logs include timestamp, level, source, and context

#### Test Secure Log Access
1. Create log access token via API:
```bash
curl -X POST http://localhost:3000/api/logs/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "name": "External Agent Test",
    "permissions": {
      "levels": ["INFO", "WARN", "ERROR"],
      "sources": ["api", "auth"]
    },
    "expiresIn": "1h"
  }'
```

2. **Verify**: Receive token and secure URL
3. Access logs via secure URL:
```bash
curl "http://localhost:3000/api/logs/[TOKEN]?limit=10"
```
4. **Verify**: JSON response with log entries
5. **Verify**: Only permitted levels/sources returned

#### Test Real-time Log Streaming
1. Open log stream in browser:
```javascript
const eventSource = new EventSource('/api/logs/stream?level=WARN');
eventSource.onmessage = (event) => {
  console.log('New log:', JSON.parse(event.data));
};
```
2. Generate some warnings in the app
3. **Verify**: Real-time log events appear in browser console

### 2. Notification System Testing

#### Test Notification Preferences
1. Set user notification preferences:
```bash
curl -X PUT http://localhost:3000/api/notifications/preferences \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '[
    {
      "notificationType": "system_alert",
      "enabled": true,
      "channels": {
        "email": true,
        "sms": false,
        "push": true,
        "inApp": true
      },
      "frequency": "INSTANT"
    }
  ]'
```

2. **Verify**: Preferences saved successfully
3. Retrieve preferences:
```bash
curl http://localhost:3000/api/notifications/preferences \
  -H "Cookie: auth-token=YOUR_TOKEN"
```
4. **Verify**: Saved preferences returned

#### Test Multi-Channel Notification
1. Send test notification:
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "userId": "test-user-id",
    "type": "system_alert",
    "priority": "HIGH",
    "title": "Test Alert",
    "message": "This is a test notification to verify multi-channel delivery",
    "channels": ["email", "push", "in-app"]
  }'
```

2. **Verify**: Notification queued successfully
3. Check notification status:
```bash
curl http://localhost:3000/api/notifications/[NOTIFICATION_ID]/status \
  -H "Cookie: auth-token=YOUR_TOKEN"
```
4. **Verify**: Status shows delivery attempts per channel

#### Test Browser Push Notifications
1. Enable notifications in browser when prompted
2. Send push notification via API
3. **Verify**: Browser notification appears with title and message
4. **Verify**: Sound plays if enabled
5. **Verify**: Click opens relevant page

#### Test Deduplication
1. Send identical notification twice within 5 minutes
2. **Verify**: Second notification is deduplicated
3. Wait 5+ minutes and send again
4. **Verify**: Notification is sent after dedup window

### 3. Email System Testing

#### Test Direct Email Sending
1. Send test email:
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "to": ["test@example.com"],
    "subject": "Test Email",
    "textBody": "This is a test email to verify the email system.",
    "htmlBody": "<h1>Test Email</h1><p>This is a test email to verify the email system.</p>"
  }'
```

2. **Verify**: Email queued with message ID
3. **Verify**: Email received in test inbox within 2 minutes
4. **Verify**: Both HTML and text versions render correctly

#### Test Email Templates
1. Send email with template:
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "to": ["test@example.com"],
    "subject": "Welcome {{name}}!",
    "templateId": "welcome",
    "templateData": {
      "name": "John Doe",
      "action_url": "https://example.com/activate"
    }
  }'
```

2. **Verify**: Template variables substituted correctly
3. **Verify**: Email received with personalized content

#### Test Contact Form
1. Submit contact form:
```bash
curl -X POST http://localhost:3000/api/email/contact \
  -H "Content-Type: multipart/form-data" \
  -F "name=Test User" \
  -F "email=test@example.com" \
  -F "subject=Test Inquiry" \
  -F "message=This is a test contact form submission."
```

2. **Verify**: Form submitted successfully
3. **Verify**: Admin receives notification email
4. **Verify**: User receives confirmation email
5. **Verify**: Form data stored for follow-up

#### Test Email Fallback
1. Temporarily disable Resend API (invalid key)
2. Send test email
3. **Verify**: System automatically switches to Mailgun fallback
4. **Verify**: Email delivered via fallback service
5. Restore Resend API
6. **Verify**: System switches back to primary service

#### Test Email Attachments
1. Send email with large attachment:
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: multipart/form-data" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -F "to=test@example.com" \
  -F "subject=Test with Attachment" \
  -F "textBody=Please find attached file." \
  -F "attachments=@/path/to/testfile.pdf"
```

2. **Verify**: Attachment included and under 25MB limit
3. **Verify**: Email received with attachment intact
4. Test with 26MB file
5. **Verify**: Request rejected with size limit error

### 4. Integration Testing

#### Test Log-Triggered Notifications
1. Generate ERROR level log entry
2. **Verify**: Automatic notification sent to administrators
3. **Verify**: Notification includes log context and timestamp

#### Test Email-Notification Integration
1. Send notification that should trigger email
2. **Verify**: Email sent automatically
3. **Verify**: Email tracking linked to notification
4. **Verify**: Delivery status updated in notification

#### Test Webhook Processing
1. Simulate Resend webhook:
```bash
curl -X POST http://localhost:3000/api/webhooks/resend \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.delivered",
    "data": {
      "message_id": "test-message-id",
      "email": "test@example.com",
      "timestamp": "2025-09-16T10:30:00Z"
    }
  }'
```

2. **Verify**: Email status updated to DELIVERED
3. **Verify**: Notification delivery status updated

#### Test Rate Limiting
1. Send 100+ notifications rapidly
2. **Verify**: Rate limiting kicks in after threshold
3. **Verify**: Queue processes notifications smoothly
4. **Verify**: No notifications lost during high load

## Performance Validation

### Response Time Targets
- Log API response: <100ms
- Notification dispatch: <500ms
- Email send: <1000ms
- Real-time log stream: <50ms latency

### Test Commands
```bash
# Test log API performance
time curl "http://localhost:3000/api/logs/stream" -m 1

# Test notification speed
time curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","type":"test","title":"Speed Test","message":"Test"}'

# Test email API speed
time curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"to":["test@example.com"],"subject":"Speed Test","textBody":"Test"}'
```

## Edge Cases and Error Testing

### 1. Service Failures
1. **Invalid API Keys**: Test with invalid Resend/Twilio keys
2. **Network Failures**: Simulate network timeouts
3. **Rate Limiting**: Exceed provider rate limits
4. **Malformed Data**: Send invalid JSON/data

### 2. Security Testing
1. **Token Expiry**: Use expired log access token
2. **Permission Bypass**: Try accessing logs outside permissions
3. **Injection Attacks**: Test XSS/SQL injection in log data
4. **Rate Limiting**: Test notification spam prevention

### 3. Scale Testing
1. **High Volume Logs**: Generate 1000+ logs per minute
2. **Notification Burst**: Send 50+ notifications simultaneously
3. **Email Queue**: Queue 100+ emails at once
4. **Storage Limits**: Test log rotation and cleanup

## Troubleshooting

### Common Issues

#### Logs Not Appearing
1. Check log level configuration
2. Verify authentication credentials
3. Check server console for errors
4. Ensure storage permissions

#### Notifications Not Sending
1. Verify user preferences allow channel
2. Check API credentials (Twilio/Resend)
3. Verify user email/phone verified
4. Check rate limiting status

#### Emails Not Delivering
1. Check SPAM folder
2. Verify DNS records (SPF/DKIM)
3. Check bounce/complaint rates
4. Verify API key permissions

#### Browser Notifications Not Working
1. Check browser permissions
2. Verify HTTPS in production
3. Check service worker registration
4. Test notification API support

### Debug Commands

```bash
# Check log storage
ls -la data/logs/

# Check notification queue status
curl http://localhost:3000/api/notifications/queue/status

# Check email delivery rates
curl http://localhost:3000/api/email/stats

# View error logs
tail -f logs/error.log
```

## Success Criteria

### Application Logging
- [ ] Logs written with proper structure and context
- [ ] Secure URL access works with authentication
- [ ] Real-time streaming functions correctly
- [ ] Log rotation and retention working
- [ ] Performance targets met (<100ms queries)

### Notification System
- [ ] Multi-channel delivery working (email, SMS, push, in-app)
- [ ] User preferences respected except for critical alerts
- [ ] Deduplication prevents duplicates within 5 minutes
- [ ] Browser notifications work with sound/haptic
- [ ] Delivery tracking accurate across channels

### Email System
- [ ] Primary (Resend) and fallback (Mailgun) both functional
- [ ] Contact form submits and routes correctly
- [ ] Templates render with variable substitution
- [ ] Attachments up to 25MB supported
- [ ] Delivery tracking and webhook processing working

### Integration
- [ ] Error logs trigger notifications automatically
- [ ] Notifications integrate with email sending
- [ ] Webhooks update delivery status correctly
- [ ] Rate limiting prevents abuse
- [ ] Performance targets met under load

---
*Comprehensive testing guide for logging, notification, and email systems*