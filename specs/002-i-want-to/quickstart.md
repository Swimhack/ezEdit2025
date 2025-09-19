# Quickstart Guide: Fluid Sign-In with Email Validation

**Feature**: Email validation and dashboard state persistence
**Time to Test**: ~10 minutes

## Prerequisites
- Next.js development environment running
- Email service configured (SMTP credentials in .env)
- Test email account accessible

## Quick Test Flow

### 1. New User Registration with Immediate Access
```bash
# Start the development server
cd ezedit
npm run dev
```

1. Navigate to http://localhost:3000/auth/signup
2. Register with a valid email address
3. **Verify**: You are immediately redirected to dashboard (no email block)
4. **Verify**: Dashboard shows unverified email indicator
5. Check email inbox for validation message

### 2. Email Validation Process
1. Open the validation email (should arrive within 5 minutes)
2. Click the validation link
3. **Verify**: Browser opens to validation success page
4. **Verify**: Dashboard no longer shows unverified indicator
5. **Verify**: User profile shows email_verified = true

### 3. Dashboard State Persistence
1. On the dashboard, make several customizations:
   - Expand/collapse sidebar
   - Change sort preferences
   - Navigate to different sections
   - Add some websites to favorites
   - Scroll to a specific position
2. Sign out from the dashboard
3. Sign back in
4. **Verify**: All customizations are restored:
   - Sidebar in same state
   - Sort preferences maintained
   - Same section active
   - Favorites preserved
   - Scroll position restored

### 4. Cross-Device Synchronization
1. Sign in on a different browser or incognito window
2. **Verify**: Dashboard state matches the first session
3. Make changes in second browser
4. Refresh first browser
5. **Verify**: Changes appear in first browser

### 5. Resend Validation Email
1. Create new test account
2. On dashboard, click "Resend validation email"
3. **Verify**: New email arrives within 5 minutes
4. **Verify**: Cannot resend again for 5 minutes (rate limiting)
5. After 5 minutes, resend again
6. **Verify**: Third email arrives

## API Testing

### Test Email Validation Endpoint
```bash
# Valid token (replace with actual from email)
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token":"YOUR_TOKEN_HERE"}'

# Expected: {"success":true,"message":"Email successfully validated"}
```

### Test Dashboard State Endpoints
```bash
# Save state (requires auth cookie)
curl -X POST http://localhost:3000/api/dashboard/state \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=YOUR_TOKEN" \
  -d '{
    "version": 1,
    "layout": {"sidebarOpen": true, "activeTab": "websites"},
    "preferences": {"sortBy": "name", "filterBy": [], "itemsPerPage": 20},
    "navigation": {"currentPath": "/dashboard", "scrollPositions": {}, "recentWebsites": []}
  }'

# Get state
curl http://localhost:3000/api/dashboard/state \
  -H "Cookie: auth-token=YOUR_TOKEN"

# Reset state
curl -X DELETE http://localhost:3000/api/dashboard/state/reset \
  -H "Cookie: auth-token=YOUR_TOKEN"
```

## Edge Case Testing

### 1. Expired Token
1. Wait 24+ hours after registration (or modify token expiry in DB)
2. Try to use validation link
3. **Verify**: Error message about expired token
4. **Verify**: Option to resend new token

### 2. Already Validated Email
1. Use a validation link twice
2. **Verify**: Second use shows "already validated" message
3. **Verify**: No errors, graceful handling

### 3. Rate Limiting
1. Try to resend validation email 4 times rapidly
2. **Verify**: 4th attempt blocked with rate limit message
3. **Verify**: Shows time until next attempt allowed

### 4. Large Dashboard State
1. Create dashboard state > 100KB
2. Try to save it
3. **Verify**: Error about size limit
4. **Verify**: Previous state remains intact

### 5. Network Interruption
1. Customize dashboard
2. Disconnect network
3. Make more changes
4. Reconnect network
5. **Verify**: Changes sync automatically
6. **Verify**: No data loss

## Performance Verification

### Load Time Targets
- Dashboard load with state: < 500ms
- State save operation: < 100ms
- Email validation: < 1000ms

### Test Commands
```bash
# Measure dashboard load time
time curl http://localhost:3000/dashboard -H "Cookie: auth-token=TOKEN"

# Measure state save time
time curl -X POST http://localhost:3000/api/dashboard/state \
  -H "Content-Type: application/json" \
  -H "Cookie: auth-token=TOKEN" \
  -d '@state.json'
```

## Troubleshooting

### Email Not Arriving
1. Check SMTP configuration in .env
2. Check email service logs
3. Verify email in spam folder
4. Check application logs for send errors

### State Not Persisting
1. Verify user is authenticated
2. Check browser console for errors
3. Verify state size < 100KB
4. Check network tab for failed requests

### Validation Link Not Working
1. Verify token hasn't expired (24 hours)
2. Check token wasn't already used
3. Verify HTTPS in production
4. Check for URL encoding issues

## Success Criteria
- [ ] New users can access dashboard immediately
- [ ] Email validation works but isn't blocking
- [ ] Dashboard state persists across sessions
- [ ] State syncs across devices
- [ ] Rate limiting prevents abuse
- [ ] Performance targets met
- [ ] All edge cases handled gracefully

---
*Testing guide for fluid sign-in feature implementation*