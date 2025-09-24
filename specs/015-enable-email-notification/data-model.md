# Data Model: Enable Email Notification System

**Feature**: 015-enable-email-notification | **Date**: 2025-09-20

## Core Entities

### 1. EmailNotification Entity

**Purpose**: Represents an email notification to be sent or that has been sent

```typescript
interface EmailNotification {
  // Core identification
  id: string;                      // Unique notification ID (UUID)
  userId?: string;                 // Recipient user ID (null for non-user emails)
  recipientEmail: string;          // Recipient email address
  recipientName?: string;          // Recipient display name

  // Email content
  subject: string;                 // Email subject line
  templateId: string;              // Reference to notification template
  templateData: Record<string, any>; // Variables for template rendering
  htmlBody?: string;               // Rendered HTML content (cached)
  textBody?: string;               // Rendered plain text content

  // Email metadata
  type: NotificationType;          // Type of notification
  priority: EmailPriority;         // Delivery priority (1-3)
  category: EmailCategory;         // Transactional, marketing, alert

  // Delivery information
  status: DeliveryStatus;          // Current delivery status
  sentAt?: Date;                   // When email was sent
  deliveredAt?: Date;              // When email was delivered
  openedAt?: Date;                 // When email was first opened
  clickedAt?: Date;                // When links were clicked

  // Error handling
  failureReason?: string;          // Error message if failed
  retryCount: number;              // Number of retry attempts
  nextRetryAt?: Date;              // Scheduled retry time

  // Tracking
  messageId?: string;              // Resend message ID
  correlationId?: string;          // For linking related events
  webhookEvents: WebhookEvent[];  // Resend webhook events

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;              // System or user that triggered
}
```

**Validation Rules**:
- `recipientEmail` must be valid email format
- `priority` must be between 1 and 3
- `retryCount` must not exceed 3
- `templateId` must reference existing template
- `status` transitions must follow valid flow

### 2. NotificationTemplate Entity

**Purpose**: Reusable email templates with React Email components

```typescript
interface NotificationTemplate {
  // Core identification
  id: string;                      // Template identifier (e.g., 'welcome-email')
  name: string;                    // Human-readable name
  description?: string;            // Template purpose and usage

  // Template content
  subjectTemplate: string;         // Subject line with variables
  componentPath: string;           // Path to React Email component
  defaultData: Record<string, any>; // Default template variables
  requiredFields: string[];        // Required template variables

  // Configuration
  type: NotificationType;          // Associated notification type
  category: EmailCategory;         // Email category
  priority: EmailPriority;         // Default priority

  // Features
  supportsHtml: boolean;           // HTML version available
  supportsText: boolean;           // Plain text version available
  hasUnsubscribe: boolean;         // Include unsubscribe link
  hasPreheader: boolean;           // Email preheader text

  // Versioning
  version: number;                 // Template version
  isActive: boolean;               // Currently in use
  deprecatedAt?: Date;             // When template was deprecated

  // Metadata
  tags: string[];                  // Searchable tags
  locale: string;                  // Language/locale (en-US)

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}
```

**Validation Rules**:
- `id` must be unique and kebab-case
- `componentPath` must reference existing React component
- `requiredFields` must be documented in component
- `version` must increment on updates
- Active templates cannot be deleted, only deprecated

### 3. NotificationPreference Entity

**Purpose**: User preferences for email notifications

```typescript
interface NotificationPreference {
  // Core identification
  id: string;                      // Preference record ID
  userId: string;                  // User who owns preferences

  // Global settings
  emailEnabled: boolean;           // Master email on/off switch
  emailAddress: string;            // Preferred email address
  timezone: string;                // User timezone for scheduling
  locale: string;                  // Preferred language

  // Category preferences
  transactionalEnabled: boolean;   // Critical emails (always true)
  marketingEnabled: boolean;       // Marketing communications
  alertsEnabled: boolean;          // System alerts
  activityEnabled: boolean;        // Activity notifications

  // Detailed preferences by type
  typePreferences: Map<NotificationType, TypePreference>;

  // Frequency settings
  digestFrequency: DigestFrequency; // Immediate, daily, weekly
  quietHoursStart?: string;        // HH:MM format
  quietHoursEnd?: string;          // HH:MM format
  weekendDigest: boolean;          // Batch weekend emails

  // Unsubscribe
  unsubscribeToken: string;        // Unique token for links
  unsubscribedAt?: Date;           // Global unsubscribe date
  unsubscribeReason?: string;      // User feedback

  // Bounce handling
  bounceCount: number;             // Email bounce counter
  suppressedAt?: Date;             // When email was suppressed
  suppressReason?: string;         // Bounce, complaint, manual

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  lastEmailAt?: Date;              // Last email sent
}

interface TypePreference {
  enabled: boolean;                // Type-specific on/off
  frequency?: DigestFrequency;     // Override global frequency
  channels: string[];              // email, sms (future), push
}
```

**Validation Rules**:
- `userId` must reference existing user
- `emailAddress` must be verified
- `transactionalEnabled` cannot be false (legal requirement)
- `timezone` must be valid IANA timezone
- `unsubscribeToken` must be unique and secure

### 4. EmailDeliveryLog Entity

**Purpose**: Audit trail and analytics for email deliveries

```typescript
interface EmailDeliveryLog {
  // Core identification
  id: string;                      // Log entry ID
  notificationId: string;          // Reference to EmailNotification
  userId?: string;                 // Recipient user

  // Delivery details
  event: DeliveryEvent;            // Type of event
  status: string;                  // Event-specific status
  timestamp: Date;                 // When event occurred

  // Email details
  recipientEmail: string;          // Email address
  subject: string;                 // Email subject (for search)
  templateId: string;              // Template used
  messageId: string;               // Provider message ID

  // Provider information
  provider: string;                // 'resend' or fallback
  providerResponse?: any;          // Raw provider response
  providerMessageId?: string;      // Provider's ID

  // Metrics
  emailSize: number;               // Size in bytes
  processingTime: number;          // Time to send (ms)
  deliveryTime?: number;           // Time to deliver (ms)

  // User engagement
  opened: boolean;                 // Email was opened
  clicked: boolean;                // Links were clicked
  unsubscribed: boolean;           // User unsubscribed
  complained: boolean;             // Marked as spam

  // Error information
  error?: string;                  // Error message
  errorCode?: string;              // Error code
  errorDetails?: any;              // Additional error data

  // Network information
  ipAddress?: string;              // Sender IP
  userAgent?: string;              // Email client info
  location?: string;               // Geographic location

  // Audit trail
  createdAt: Date;
}
```

**Validation Rules**:
- `notificationId` must reference existing notification
- `event` must be valid delivery event type
- `timestamp` must be within reasonable range
- `emailSize` must be under 25MB
- Log entries are immutable after creation

### 5. EmailQueue Entity

**Purpose**: Queue for reliable email processing

```typescript
interface EmailQueue {
  // Core identification
  id: string;                      // Queue item ID
  notificationId: string;          // Email to be sent

  // Queue management
  priority: number;                // 1 (immediate) to 3 (batch)
  status: QueueStatus;             // pending, processing, completed, failed
  scheduledFor: Date;              // When to process

  // Processing information
  attempts: number;                // Processing attempts
  lastAttemptAt?: Date;            // Last processing attempt
  nextRetryAt?: Date;              // Scheduled retry
  processingStartedAt?: Date;      // When processing began
  processingCompletedAt?: Date;    // When completed

  // Worker information
  workerId?: string;               // Processing worker ID
  lockedAt?: Date;                 // When locked by worker
  lockExpiry?: Date;               // Lock expiration

  // Error handling
  lastError?: string;              // Last error message
  errorCount: number;              // Total errors
  deadLettered: boolean;           // Moved to dead letter queue

  // Metadata
  metadata?: Record<string, any>;  // Additional queue data
  batchId?: string;                // For batch processing

  // Audit trail
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation Rules**:
- `priority` must be 1, 2, or 3
- `attempts` must not exceed max retry limit
- `scheduledFor` must be future date for delayed sends
- Locked items must have `lockExpiry`
- Dead lettered items cannot be reprocessed

## Enumerations

### NotificationType
```typescript
enum NotificationType {
  // Account
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_DELETED = 'account_deleted',

  // Activity
  FILE_UPLOADED = 'file_uploaded',
  EDIT_COMPLETED = 'edit_completed',
  COLLABORATION_INVITE = 'collaboration_invite',

  // Alerts
  SECURITY_ALERT = 'security_alert',
  SYSTEM_ALERT = 'system_alert',
  ERROR_ALERT = 'error_alert',

  // Digest
  WEEKLY_SUMMARY = 'weekly_summary',
  MONTHLY_REPORT = 'monthly_report'
}
```

### DeliveryStatus
```typescript
enum DeliveryStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed'
}
```

### EmailPriority
```typescript
enum EmailPriority {
  HIGH = 1,      // Immediate send
  NORMAL = 2,    // Within 5 minutes
  LOW = 3        // Batch processing
}
```

### EmailCategory
```typescript
enum EmailCategory {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  ALERT = 'alert',
  ACTIVITY = 'activity'
}
```

### DeliveryEvent
```typescript
enum DeliveryEvent {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  DELIVERY_DELAYED = 'delivery_delayed',
  BOUNCED = 'bounced',
  OPENED = 'opened',
  CLICKED = 'clicked',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed',
  FAILED = 'failed'
}
```

### QueueStatus
```typescript
enum QueueStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  DEAD_LETTER = 'dead_letter'
}
```

### DigestFrequency
```typescript
enum DigestFrequency {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  NEVER = 'never'
}
```

## Entity Relationships

### Primary Relationships
1. **EmailNotification** → **NotificationTemplate** (Many-to-One)
   - Each notification uses one template
   - Templates can be used by many notifications

2. **EmailNotification** → **NotificationPreference** (Many-to-One)
   - Each notification respects user preferences
   - Preferences apply to many notifications

3. **EmailNotification** → **EmailDeliveryLog** (One-to-Many)
   - Each notification has multiple log entries
   - Each log entry belongs to one notification

4. **EmailNotification** → **EmailQueue** (One-to-One)
   - Each notification has one queue entry
   - Queue entry processes one notification

5. **User** → **NotificationPreference** (One-to-One)
   - Each user has one preference set
   - Preferences belong to one user

### Data Flow
```
User Action → EmailNotification (created) → EmailQueue (queued)
    ↓                                            ↓
NotificationTemplate (render)              Process Queue
    ↓                                            ↓
Check NotificationPreference              Send via Resend API
    ↓                                            ↓
EmailDeliveryLog (track)                  Update Status
    ↓                                            ↓
Webhook Events → Update Logs              Complete/Retry
```

## Indexing Strategy

### Performance Indexes
- `EmailNotification.userId` - User notification queries
- `EmailNotification.status` - Status filtering
- `EmailNotification.createdAt` - Time-based queries
- `EmailQueue.status + scheduledFor` - Queue processing
- `EmailQueue.priority + createdAt` - Priority processing
- `NotificationPreference.userId` - User preference lookup
- `NotificationPreference.unsubscribeToken` - Unsubscribe links
- `EmailDeliveryLog.notificationId` - Log aggregation
- `EmailDeliveryLog.timestamp` - Time-series queries

### Unique Constraints
- `NotificationTemplate.id` - Unique template identifier
- `NotificationPreference.userId` - One preference per user
- `NotificationPreference.unsubscribeToken` - Unique tokens
- `EmailNotification.messageId` - Unique provider ID

## Data Retention Policies

### Retention Periods
- **EmailNotification**: 90 days for completed, 30 days for failed
- **EmailQueue**: 7 days after completion, immediate for dead letter
- **EmailDeliveryLog**: 180 days for compliance
- **NotificationTemplate**: Indefinite (versioned)
- **NotificationPreference**: Indefinite (user data)

### Cleanup Procedures
- Daily cleanup of old queue items
- Weekly aggregation of delivery logs
- Monthly archival of old notifications
- Quarterly review of unused templates

## Security Considerations

### PII Protection
- Encrypt email addresses at rest
- Redact sensitive data in logs
- Tokenize unsubscribe links
- Mask email content in non-production

### Access Control
- Read access limited to user's own data
- Write access through API only
- Admin access for support cases
- Audit all data access

### Compliance
- GDPR right to deletion
- CAN-SPAM unsubscribe requirements
- Data portability for preferences
- Audit trail for all operations