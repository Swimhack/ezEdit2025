# Contract Comparison Tool - Project Instructions

## Project Overview
This is a Contract Comparison Tool built with Next.js 14, TypeScript, Tailwind CSS, and Supabase authentication. The application allows users to upload two contracts, verify if they are identical, detect changes, and provide AI-powered analysis with implications.

## Authentication & Website Connection System (NEW)
**Status**: In Development (Feature 001)
**Branch**: `001-authentication-login-password`

### Core Authentication Features
- **Email/Password Authentication**: Secure registration, login, email verification
- **Multi-Factor Authentication**: TOTP support with backup codes
- **Password Reset**: Secure email-based password reset flow
- **Session Management**: JWT tokens with 24-hour expiration
- **Security**: Failed login tracking, account lockouts, audit logging

### Website Connection System
- **Multi-Platform Support**: WordPress, Wix, Shopify, FTP/SFTP servers
- **Connection Methods**: REST API, OAuth 2.0, SFTP, FTP protocols
- **Platform Discovery**: Automated website platform detection using web search APIs
- **File Management**: Browse, upload, download files across connected platforms
- **Secure Credentials**: Vault-based credential storage (never in database)

### Technical Stack for Authentication System
- **Authentication Libraries**:
  - `auth-lib`: Core authentication, session management, MFA
  - `connection-lib`: FTP/SFTP client operations, credential management
  - `platform-lib`: WordPress/Wix/Shopify API integrations
  - `discovery-lib`: Web search integration for platform detection
- **Database Extensions**: Extends existing Supabase schema with connection tables
- **Security**: Row Level Security, encrypted credential storage, audit trails

## Important Instructions
- Do what has been asked; nothing more, nothing less.
- NEVER create files unless they're absolutely necessary for achieving your goal.
- ALWAYS prefer editing an existing file to creating a new one.
- NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Project Structure
- **Frontend:** Next.js 14 with App Router
- **Styling:** Tailwind CSS with custom components
- **Authentication:** Supabase Auth with email/password and Google OAuth
- **Database:** Supabase PostgreSQL with Row Level Security
- **File Storage:** Supabase Storage for contract files
- **AI Analysis:** Multi-agent orchestration system for contract analysis

## Supabase Configuration

### Database Connection Details
- **URL:** https://sctzykgcfkhadowyqcrj.supabase.co
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHN5a2djZmtoYWRvd3lnY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1OTE5MDUsImV4cCI6MjA2NzE2NzkwNX0.8cpoEx0MXO0kkTqDrpkbYRhXQHVQ0bmjHA0xI2rUWqY`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHN5a2djZmtoYWRvd3lnY3JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU5MTkwNSwiZXhwIjoyMDY3MTY3OTA1fQ.LZO9ckLrpeSFGf1Av0v9bFqpSP8dcQllrFJ-yHGAZdo`

### Database Schema Extensions (Feature 001)
New tables for authentication and website connections:
- `website_connections`: User website connections with encrypted credential references
- `platform_integrations`: Supported platform configurations and rate limits
- `auth_sessions`: Enhanced session management with device tracking
- `connection_logs`: Comprehensive audit trail for all connection activities

Extensions to existing tables:
- `profiles`: Added subscription tiers, MFA settings, connection limits

## API Contracts (Feature 001)
- **Authentication API**: `/api/auth/*` - Registration, login, MFA, password reset
- **Connections API**: `/api/connections/*` - CRUD operations for website connections
- **Platforms API**: `/api/platforms/*` - Platform discovery and OAuth flows
- **File Management**: `/api/connections/{id}/files/*` - File operations across platforms

## Platform Integration Patterns
- **WordPress**: Hybrid REST API + SFTP fallback approach
- **Wix**: Direct API with third-party automation backup (200 req/min rate limit)
- **Shopify**: GraphQL Admin API mandatory for 2025 (50-500 points/second)
- **FTP/SFTP**: Direct protocol connections with secure credential storage
- **Discovery**: Multi-service approach (WhatCMS.org primary, Wappalyzer secondary)

## Security Best Practices
- **Credential Storage**: HashiCorp Vault or AWS Secrets Manager integration
- **Authentication**: RSA 4096-bit keys minimum, TOTP MFA support
- **Rate Limiting**: Dynamic rate limiting with platform-specific limits
- **Audit Logging**: All authentication and connection events logged
- **Compliance**: GDPR compliance with 90-day log retention

## Environment Variables Setup
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://sctzykgcfkhadowyqcrj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHN5a2djZmtoYWRvd3lnY3JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1OTE5MDUsImV4cCI6MjA2NzE2NzkwNX0.8cpoEx0MXO0kkTqDrpkbYRhXQHVQ0bmjHA0xI2rUWqY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjdHN5a2djZmtoYWRvd3lnY3JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU5MTkwNSwiZXhwIjoyMDY3MTY3OTA1fQ.LZO9ckLrpeSFGf1Av0v9bFqpSP8dcQllrFJ-yHGAZdo
```

## Database Schema
The database includes the following tables:
- **profiles:** User profile information (automatically created via trigger)
- **organizations:** Company/team management with subscription tiers
- **comparisons:** Contract comparison records with analysis results
- **shared_comparisons:** Shareable comparison links with expiration
- **notifications:** In-app notification system
- **activity_logs:** Audit trail for all user actions
- **api_keys:** API access management for future integrations
- **usage_tracking:** Usage analytics and billing data

## Authentication Features
- Email/password authentication with email confirmation
- Google OAuth integration
- Automatic user profile creation via database triggers
- Row Level Security (RLS) policies for data isolation
- Password reset functionality
- OAuth callback handling

## Key Components
- **AuthProvider:** React context for authentication state management
- **DatabaseService:** TypeScript service layer for database operations
- **ContractAnalysisOrchestrator:** Multi-agent AI analysis system
- **Dashboard:** User dashboard with statistics and recent activity
- **File Upload:** Contract file upload with PDF/DOCX support

## AI Analysis System
The application uses a multi-agent orchestration system with specialized agents:
- **LegalAnalysisAgent:** Legal clause analysis and compliance checking
- **FinancialAnalysisAgent:** Financial terms and obligations analysis
- **ComplianceAnalysisAgent:** Regulatory compliance verification
- **RiskAssessmentAgent:** Risk scoring and identification
- **SummaryAgent:** Executive summary generation

## Security Features
- Row Level Security (RLS) on all database tables
- Secure file storage with access control
- Activity logging and audit trails
- User data isolation by organization
- API key management with proper hashing
- Environment variable protection

## Deployment Configuration
- **Platform:** Fly.io deployment ready
- **Token:** `FlyV1 fm2_lJPECAAAAAAACZoQxBDfvwhuoK8cPtk+pBFvyxGHwrVodHRwczovL2FwaS5mbHkuaW8vdjGWAJLOABJ5mB8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDyBYk3Rfy9RmSrvKfQI5+oLYYQl/XgMUii7Q9R9vCpVjQ24w4ltx+1+DyyBscj0RL4nt653Ea7I8KS+i5jETv4G6jh7d79PIixNMuvVQYq29WS3muXHoHi3RPMO6Zrxp6k7xtlbIj4eczD1K2/bZw25SVjAiEyqK5h0dF2DrjWcAIf4/Uj4IOYVrtUoNw2SlAORgc4AkxmBHwWRgqdidWlsZGVyH6J3Zx8BxCBBYZ00ti1FHbIdAy7b2Ncia+bcVaV9ukOhtDNN7b802g==`

## Development Workflow
1. **Setup:** Run the Supabase migration script from `supabase/migrations/001_complete_schema.sql`
2. **Environment:** Configure `.env.local` with Supabase credentials
3. **Authentication:** Test signup/signin flows and profile creation
4. **Development:** Use TypeScript strict mode and proper type safety
5. **Testing:** Verify RLS policies and database operations
6. **Deployment:** Deploy to Fly.io using provided token

## Important Notes
- The service role key provides full database access - use with extreme caution
- All credentials should be stored in environment variables in production
- Database migration must be run before the application will function
- Google OAuth requires proper redirect URLs configured in Supabase
- File uploads are stored in Supabase Storage with security policies

## File Structure
```
/app
  /auth
    /signin - Sign in page
    /signup - Sign up page with company field
    /callback - OAuth callback handler
    /reset-password - Password reset page
/lib
  /auth-context.tsx - Authentication React context
  /auth-utils.ts - Authentication utility functions
  /database.ts - Database service layer
  /supabase.ts - Client-side Supabase client
  /supabase-server.ts - Server-side Supabase client
/supabase
  /migrations
    /001_complete_schema.sql - Complete database schema
```

## Best Practices
- Always use the database service layer for database operations
- Implement proper error handling for all authentication flows
- Use TypeScript types from the Database interface
- Follow Next.js App Router patterns for server/client components
- Implement proper loading states and user feedback
- Use RLS policies to ensure data security

## Email Validation & Dashboard State System (NEW)
**Status**: In Development (Feature 002)
**Branch**: `002-i-want-to`

### Email Validation Features
- **Non-Blocking Validation**: Users can access dashboard immediately after registration
- **Token Management**: 24-hour expiration with secure token generation and hashing
- **Resend Functionality**: Rate-limited resend with 5-minute cooldown, max 3 attempts/24hr
- **Graceful Degradation**: Full functionality without validation, visual indicators for unverified

### Dashboard State Persistence
- **Comprehensive State**: Layout, preferences, navigation, customizations all persisted
- **Cross-Device Sync**: Server-side state with optimistic UI updates
- **State Management**: Debounced saves (500ms), 100KB size limit, compression
- **Historical States**: 30-day retention for recovery and debugging

### Technical Implementation
- **Email Service**: Nodemailer with SMTP (Gmail, SendGrid, AWS SES support)
- **State Storage**: JSON in user record with separate historical states table
- **Performance**: <500ms dashboard load, <100ms state restore
- **Security**: Token hashing, rate limiting, timing-safe comparisons

### API Endpoints (Feature 002)
- `POST /api/auth/validate` - Validate email with token
- `POST /api/auth/resend` - Resend validation email (rate limited)
- `GET /api/dashboard/state` - Retrieve saved dashboard state
- `POST /api/dashboard/state` - Save dashboard state
- `DELETE /api/dashboard/state/reset` - Reset to default state

## Application Logging, Notifications & Email System (NEW)
**Status**: In Development (Feature 003)
**Branch**: `003-please-save-application`

### Application Logging Features
- **Secure URL Access**: Time-limited JWT tokens for external log access by agents
- **Real-time Streaming**: Server-sent events for live log monitoring
- **Structured Logging**: Comprehensive event tracking with context and metadata
- **Tiered Retention**: 30 days standard, extended for premium users
- **Performance**: <100ms log queries, hot/warm/cold storage tiers

### Enterprise Notification System
- **Multi-Channel Delivery**: Email, SMS (Twilio), Browser Push, Haptic, Sound
- **User Preferences**: Granular control per notification type and channel
- **Priority Levels**: Low, Medium (default), High, Critical with override capability
- **Smart Features**: 5-minute deduplication, quiet hours, batching options
- **Delivery Tracking**: Real-time status across all channels with retry logic

### Reliable Email System
- **Primary Service**: Resend API (re_37YYP2iE_KbLqkdskcjngf9XqFMJZv1xG - stored securely)
- **Fallback Service**: Mailgun (configured but not active unless needed)
- **Features**: HTML/text templates, 25MB attachments, delivery tracking
- **Contact Forms**: Automated routing and confirmation emails
- **Compliance**: SPF/DKIM/DMARC, anti-spam, bounce handling

### Technical Implementation
- **Logging Architecture**: Hybrid storage with buffered writes and compression
- **Queue System**: Redis-backed processing with rate limiting and retries
- **Security**: Token-based access, PII redaction, encrypted storage
- **Performance**: <500ms notification dispatch, 99.9% email delivery rate

### API Endpoints (Feature 003)
- `GET /api/logs/stream` - Real-time log streaming with SSE
- `GET /api/logs/{token}` - Secure log access via JWT token
- `POST /api/logs/tokens` - Generate secure access tokens
- `POST /api/notifications/send` - Multi-channel notification dispatch
- `GET/PUT /api/notifications/preferences` - User preference management
- `GET /api/notifications/{id}/status` - Delivery status tracking
- `POST /api/email/send` - Direct email sending with templates
- `POST /api/email/contact` - Contact form processing
- `POST /api/webhooks/resend` - Resend delivery webhooks
- `POST /api/webhooks/twilio` - Twilio SMS status webhooks

## Recent Changes (Last 3 Updates)
1. **2025-09-16**: Added comprehensive logging, notifications, and email system (Feature 003)
2. **2025-09-16**: Added fluid sign-in with email validation and dashboard state persistence (Feature 002)
3. **2025-01-15**: Added authentication and website connection system specification (Feature 001)



