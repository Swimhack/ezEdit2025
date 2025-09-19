# Phase 0: Research & Technical Decisions

**Feature**: Application Logging, Enterprise Notifications, and Reliable Email System
**Date**: 2025-09-16

## Research Findings

### 1. Secure Log URL Generation

**Decision**: Time-limited JWT tokens with embedded permissions
**Rationale**:
- JWTs are stateless and can embed access scope
- Time limits prevent long-term exposure
- Can be revoked by changing signing key if compromised
- Standard approach used by major logging services

**Implementation Details**:
- 24-hour token expiry by default
- Tokens include: user ID, access level, allowed log sources
- Signed with RS256 for security
- URL format: `/api/logs/[jwt-token]`

**Alternatives Considered**:
- UUID tokens: Requires database lookup for every request
- API keys: Too long-lived for temporary access
- Basic auth: Poor UX for sharing with external agents

### 2. Log Storage and Rotation Strategy

**Decision**: Hybrid approach with hot/warm/cold tiers
**Rationale**:
- Recent logs in memory for fast access (hot - last 24 hours)
- Recent history in JSON files (warm - last 7 days)
- Archived logs compressed (cold - 30+ days)
- Matches performance requirements and cost optimization

**Storage Structure**:
```
/data/logs/
├── current/        # Hot tier - today's logs
├── recent/         # Warm tier - last 7 days
│   └── 2025-09-15.json
└── archive/        # Cold tier - compressed
    └── 2025-09.tar.gz
```

**Alternatives Considered**:
- Database only: Too expensive for high-volume logs
- Files only: Poor query performance
- Cloud logging service: Vendor lock-in concerns

### 3. Browser Notification API Compatibility

**Decision**: Progressive enhancement with fallbacks
**Rationale**:
- Notifications API supported in all modern browsers
- Service Worker for background notifications
- Fallback to in-app toast for unsupported browsers
- Audio/haptic via Web Audio API and Vibration API

**Browser Support Matrix**:
- Chrome/Edge: Full support (push, sound, badges)
- Firefox: Full support except badges
- Safari: Limited (requires user gesture)
- Mobile: Good support, haptic on Android/iOS 13+

**Alternatives Considered**:
- Native apps: Too complex for current scope
- Email-only fallback: Too slow for real-time alerts
- WebSockets only: Doesn't work when app closed

### 4. Twilio SMS Best Practices

**Decision**: Queue-based sending with rate limiting
**Rationale**:
- Twilio rate limits: 100 segments/second
- Queue prevents dropped messages during spikes
- Batch similar messages for efficiency
- Automatic retry with exponential backoff

**Implementation Strategy**:
- Redis-backed queue for reliability
- Rate limiter: 80 msgs/sec (80% of limit)
- Delivery receipts via webhooks
- Fallback to email if SMS fails 3 times

**Alternatives Considered**:
- Direct sending: Risk of rate limit errors
- Multiple SMS providers: Complexity not justified yet
- No SMS: Required for critical alerts

### 5. Resend API Integration

**Decision**: SDK with webhook-based tracking
**Rationale**:
- Official Node.js SDK well-maintained
- Webhooks provide real-time delivery status
- Built-in retry logic in SDK
- Good deliverability rates

**Configuration**:
- API key stored in environment variables
- Webhook endpoint for delivery/bounce tracking
- HTML + text versions for all emails
- SPF/DKIM/DMARC configured for domain

**Alternatives Considered**:
- SendGrid: More expensive at scale
- AWS SES: More complex setup
- Self-hosted: Poor deliverability

### 6. Email Deliverability Optimization

**Decision**: Multi-factor approach
**Rationale**:
- Email deliverability requires multiple strategies
- Content, infrastructure, and reputation all matter
- Monitoring essential for maintaining high rates

**Best Practices Implemented**:
- Dedicated IP warming (via Resend)
- List hygiene (remove bounces/complaints)
- Authentication (SPF, DKIM, DMARC)
- Content optimization (avoid spam triggers)
- Engagement tracking (opens, clicks)
- Feedback loops with major ISPs

**Alternatives Considered**:
- Basic SMTP: Poor deliverability
- Transactional-only: Need marketing capabilities
- Multiple providers simultaneously: Over-complex

## Security Considerations

### Log Security
1. **Data Sanitization**: PII and secrets redacted before storage
2. **Access Control**: Role-based permissions per log source
3. **Encryption**: Logs encrypted at rest
4. **Audit Trail**: All log access is logged

### Notification Security
1. **Channel Verification**: Confirm ownership of email/phone
2. **Rate Limiting**: Prevent notification spam
3. **Content Validation**: Sanitize user-provided content
4. **Opt-out Compliance**: Honor unsubscribe requests

### Email Security
1. **API Key Protection**: Environment variables, never in code
2. **Template Injection**: Parameterized templates only
3. **Attachment Scanning**: Virus scan before sending
4. **Domain Authentication**: Full SPF/DKIM/DMARC setup

## Performance Optimizations

### Logging Performance
1. **Buffered Writes**: Batch log writes every 100ms
2. **Async Processing**: Non-blocking log operations
3. **Index Strategy**: Index on timestamp, level, source
4. **Compression**: gzip for archived logs (70% reduction)

### Notification Performance
1. **Channel Parallelization**: Send to all channels concurrently
2. **Connection Pooling**: Reuse HTTP/SMTP connections
3. **Caching**: Cache user preferences in memory
4. **Batch Processing**: Group similar notifications

### Email Performance
1. **Template Caching**: Pre-compiled templates
2. **Async Sending**: Queue-based processing
3. **Batch API Calls**: Send up to 100 emails per API call
4. **CDN Assets**: Images/CSS hosted on CDN

## Integration Architecture

### Service Communication
```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Next.js   │────▶│   Queue      │────▶│   Workers    │
│   API       │     │   (Redis)    │     │              │
└─────────────┘     └──────────────┘     └──────────────┘
                             │                    │
                             ▼                    ▼
                    ┌──────────────┐     ┌──────────────┐
                    │   Resend     │     │   Twilio     │
                    │   API        │     │   API        │
                    └──────────────┘     └──────────────┘
```

### Data Flow
1. Event occurs → Log written → Notification triggered
2. Notification evaluated against preferences
3. Channels selected based on priority and preferences
4. Messages queued for delivery
5. Workers process queue with rate limiting
6. Delivery status tracked via webhooks
7. Failures trigger retry or fallback

## Scalability Considerations

### Current Scale (MVP)
- 1,000 concurrent users
- 100,000 logs/day
- 10,000 notifications/day
- 50,000 emails/day

### Future Scale (Growth)
- 10,000 concurrent users
- 10M logs/day → Consider log aggregation service
- 100,000 notifications/day → Add more workers
- 500,000 emails/day → Dedicated IP needed

## Cost Analysis

### Monthly Estimates (1,000 users)
- **Resend**: $20/month (50k emails)
- **Twilio**: $75/month (10k SMS)
- **Storage**: $5/month (50GB logs)
- **Total**: ~$100/month

### Cost Optimization Strategies
1. Batch notifications to reduce SMS
2. Compress old logs aggressively
3. Use email for non-urgent notifications
4. Implement smart notification deduplication

## Migration Path

### From Current System
1. **Phase 1**: Add new logging alongside existing
2. **Phase 2**: Migrate notification preferences
3. **Phase 3**: Switch email sending to Resend
4. **Phase 4**: Deprecate old systems

### Rollback Strategy
1. Feature flags for each component
2. Dual-write period for critical data
3. Keep old system running for 30 days
4. Automated rollback on error threshold

## Next Steps
With research complete, proceed to Phase 1:
- Design data models for logs, notifications, emails
- Create API contracts with OpenAPI
- Write contract tests
- Generate quickstart guide

---
*Research completed: 2025-09-16*