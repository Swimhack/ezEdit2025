# Data Model: Application Logging, Enterprise Notifications, and Email System

**Generated**: 2025-09-16
**Feature**: Comprehensive logging, multi-channel notifications, and reliable email

## Entities

### 1. ApplicationLog
Core logging entity for all application events.

**Fields**:
- `id`: string (UUID, primary key)
- `timestamp`: datetime (indexed, millisecond precision)
- `level`: enum (DEBUG, INFO, WARN, ERROR, CRITICAL)
- `source`: string (service/component name, indexed)
- `message`: string (log message)
- `context`: JSON (additional contextual data)
- `user_id`: string | null (associated user if applicable)
- `session_id`: string | null (session identifier)
- `request_id`: string | null (request correlation ID)
- `ip_address`: string | null (client IP if applicable)
- `user_agent`: string | null (browser/client info)
- `duration_ms`: number | null (operation duration)
- `error_stack`: string | null (stack trace for errors)
- `tags`: string[] (searchable tags)

**Validation Rules**:
- timestamp must be valid datetime
- level must be valid enum value
- message max 10KB
- context max 50KB
- sensitive data must be redacted

**Retention**:
- Standard: 30 days
- Premium: 90 days
- Enterprise: 365 days

### 2. LogAccessToken
Secure tokens for external log access.

**Fields**:
- `token`: string (JWT token, primary key)
- `token_hash`: string (SHA256 hash for lookup)
- `created_by`: string (user ID who created)
- `created_at`: datetime
- `expires_at`: datetime (default: 24 hours)
- `permissions`: JSON (access scope)
- `name`: string (descriptive name)
- `last_used`: datetime | null
- `use_count`: number (default: 0)
- `ip_whitelist`: string[] | null (allowed IPs)
- `revoked`: boolean (default: false)

**Validation Rules**:
- token must be valid JWT
- expires_at must be future date
- permissions must define allowed log sources/levels

### 3. Notification
Multi-channel notification entity.

**Fields**:
- `id`: string (UUID, primary key)
- `user_id`: string (recipient user)
- `type`: string (notification type/category)
- `priority`: enum (LOW, MEDIUM, HIGH, CRITICAL)
- `title`: string (notification title)
- `message`: string (notification body)
- `data`: JSON | null (additional payload)
- `channels`: string[] (email, sms, push, in-app)
- `created_at`: datetime
- `scheduled_for`: datetime | null (future delivery)
- `sent_at`: datetime | null
- `status`: enum (PENDING, QUEUED, SENT, FAILED, CANCELLED)
- `delivery_attempts`: number (default: 0)
- `error_message`: string | null
- `dedup_key`: string | null (for deduplication)

**Validation Rules**:
- channels must contain at least one valid channel
- priority affects delivery behavior
- dedup_key prevents duplicates within 5 minutes

**State Transitions**:
- PENDING → QUEUED → SENT
- PENDING → CANCELLED
- QUEUED → FAILED → QUEUED (retry)

### 4. NotificationPreference
User preferences per notification type.

**Fields**:
- `id`: string (UUID, primary key)
- `user_id`: string (foreign key to User)
- `notification_type`: string (matches Notification.type)
- `enabled`: boolean (default: true)
- `channels`: JSON (channel preferences)
  - `email`: boolean
  - `sms`: boolean
  - `push`: boolean
  - `in_app`: boolean
- `quiet_hours`: JSON | null
  - `start`: time (e.g., "22:00")
  - `end`: time (e.g., "08:00")
  - `timezone`: string
- `frequency`: enum (INSTANT, BATCHED_5MIN, BATCHED_HOURLY, DAILY_DIGEST)
- `created_at`: datetime
- `updated_at`: datetime

**Validation Rules**:
- user_id + notification_type must be unique
- at least one channel must be enabled
- quiet_hours only for non-critical

**Defaults**:
- Critical notifications override all preferences
- New types default to email only

### 5. EmailMessage
Email tracking and content entity.

**Fields**:
- `id`: string (UUID, primary key)
- `message_id`: string (provider message ID)
- `from`: string (sender email)
- `to`: string[] (recipient emails)
- `cc`: string[] | null
- `bcc`: string[] | null
- `subject`: string
- `html_body`: string | null
- `text_body`: string
- `attachments`: JSON[] | null
  - `filename`: string
  - `size`: number
  - `content_type`: string
- `template_id`: string | null
- `template_data`: JSON | null
- `provider`: enum (RESEND, MAILGUN)
- `status`: enum (QUEUED, SENT, DELIVERED, BOUNCED, FAILED)
- `created_at`: datetime
- `sent_at`: datetime | null
- `delivered_at`: datetime | null
- `opened_at`: datetime | null
- `clicked_at`: datetime | null
- `bounce_type`: string | null
- `error_message`: string | null
- `retry_count`: number (default: 0)

**Validation Rules**:
- to array must contain valid emails
- subject max 200 characters
- total size (with attachments) max 25MB
- html_body or text_body required

**Tracking**:
- Delivery via webhooks
- Opens via tracking pixel
- Clicks via link wrapping

### 6. NotificationDelivery
Tracks delivery per channel per notification.

**Fields**:
- `id`: string (UUID, primary key)
- `notification_id`: string (foreign key)
- `channel`: enum (EMAIL, SMS, PUSH, IN_APP)
- `status`: enum (PENDING, SENT, DELIVERED, FAILED)
- `sent_at`: datetime | null
- `delivered_at`: datetime | null
- `failed_at`: datetime | null
- `provider_message_id`: string | null
- `error_message`: string | null
- `metadata`: JSON | null (channel-specific data)

**Validation Rules**:
- notification_id + channel must be unique
- status transitions are one-way

### 7. ContactFormSubmission
Contact form submissions requiring email response.

**Fields**:
- `id`: string (UUID, primary key)
- `name`: string
- `email`: string
- `phone`: string | null
- `subject`: string
- `message`: string
- `attachments`: JSON[] | null
- `ip_address`: string
- `user_agent`: string
- `referrer`: string | null
- `submitted_at`: datetime
- `status`: enum (NEW, IN_PROGRESS, RESPONDED, CLOSED, SPAM)
- `assigned_to`: string | null (admin user ID)
- `responded_at`: datetime | null
- `response_email_id`: string | null

**Validation Rules**:
- email must be valid format
- message max 10KB
- spam detection via content analysis

## Relationships

```
User (1) ←→ (n) ApplicationLog
  - User actions generate logs

User (1) ←→ (n) Notification
  - Users receive notifications

User (1) ←→ (n) NotificationPreference
  - Each user has preferences per notification type

Notification (1) ←→ (n) NotificationDelivery
  - Each notification can have multiple channel deliveries

EmailMessage (1) ←→ (0..1) Notification
  - Emails may be triggered by notifications

ContactFormSubmission (1) → (0..1) EmailMessage
  - Form submissions trigger email responses

LogAccessToken (n) → (n) ApplicationLog
  - Tokens grant access to subset of logs
```

## Indexes

### Performance Indexes
- `application_logs.timestamp` - Primary time-based queries
- `application_logs.level, timestamp` - Severity filtering
- `application_logs.source, timestamp` - Component filtering
- `application_logs.user_id, timestamp` - User activity
- `notifications.user_id, created_at` - User notifications
- `notifications.status, scheduled_for` - Queue processing
- `notifications.dedup_key, created_at` - Deduplication
- `email_messages.status, created_at` - Email queue
- `email_messages.message_id` - Webhook lookups

### Search Indexes (Full-text)
- `application_logs.message, tags` - Log search
- `notifications.title, message` - Notification search
- `email_messages.subject, text_body` - Email search

## Data Access Patterns

### Common Queries

1. **Recent logs by level**:
```sql
SELECT * FROM application_logs
WHERE level >= 'WARN'
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC
```

2. **User notification queue**:
```sql
SELECT n.*, np.channels
FROM notifications n
JOIN notification_preferences np ON n.type = np.notification_type
WHERE n.user_id = ?
  AND n.status = 'PENDING'
  AND np.user_id = n.user_id
```

3. **Email delivery stats**:
```sql
SELECT
  DATE(sent_at) as date,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN status = 'BOUNCED' THEN 1 ELSE 0 END) as bounced
FROM email_messages
WHERE sent_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(sent_at)
```

### Write Patterns
- Logs: High-volume writes, buffered in 100ms batches
- Notifications: Medium-volume, immediate write with queue
- Emails: Medium-volume, queued writes
- Preferences: Low-volume, immediate write

### Read Patterns
- Logs: Range queries, streaming reads
- Notifications: Queue polling, user queries
- Emails: Status tracking, delivery reports
- Preferences: Cached reads, infrequent updates

## Storage Strategy

### Hot Storage (Memory/Redis)
- Last 24 hours of logs
- Active notification queue
- User preferences cache
- Active session data

### Warm Storage (Database)
- Last 30 days of logs
- Recent notifications (7 days)
- Email history (90 days)
- All preferences

### Cold Storage (File System/S3)
- Archived logs (30+ days)
- Old notifications (30+ days)
- Old emails (90+ days)
- Compressed, indexed by date

## Migration Strategy

### From Current System
1. Create new tables alongside existing
2. Dual-write period for data migration
3. Backfill historical data where needed
4. Switch reads to new system
5. Deprecate old tables

### Data Migration Plan
- Logs: Start fresh, no migration needed
- Users: Extend existing user table
- Preferences: Default all to email-only
- Emails: Import last 30 days if available

## Security Considerations

1. **PII Protection**:
   - Redact SSN, credit cards from logs
   - Encrypt email addresses at rest
   - Hash phone numbers for lookups

2. **Access Control**:
   - Role-based log access
   - User can only see own notifications
   - Admin-only contact form access

3. **Data Retention**:
   - Automated deletion after retention period
   - User right to deletion (GDPR)
   - Audit trail exempt from deletion

## Performance Targets

- Log write: <10ms per batch
- Log query: <100ms for 1-hour range
- Notification dispatch: <500ms
- Email send: <1s including template render
- Preference lookup: <10ms (cached)

---
*Data model optimized for scale and performance*