# Phase 0: Research & Clarifications

**Feature**: Fluid Sign-In with Email Validation and Dashboard State Persistence
**Date**: 2025-09-16

## Research Findings

### 1. Email Validation Token Best Practices

**Decision**: 24-hour expiration for email validation tokens
**Rationale**:
- Industry standard balances security with user convenience
- Most users check email within hours of registration
- Allows for timezone differences and delayed email delivery

**Alternatives Considered**:
- 1 hour: Too short, may expire before user checks email
- 7 days: Security risk, tokens remain valid too long
- No expiration: Major security vulnerability

**Implementation Details**:
- Tokens expire after 24 hours
- Users can request resend after 5 minutes
- Maximum 3 resend attempts per 24 hours to prevent abuse

### 2. Dashboard State Persistence Elements

**Decision**: Persist comprehensive UI state server-side
**Rationale**:
- Cross-device consistency for users
- State survives browser data clearing
- Better user experience when switching devices

**State Elements to Persist**:
- Active tab/section selections
- Expanded/collapsed panels
- Sort preferences and filters
- Recently accessed websites
- Sidebar open/closed state
- Custom dashboard layouts
- Scroll positions (major sections only)

**Alternatives Considered**:
- localStorage only: Lost on browser clear, no cross-device sync
- Session storage: Lost on browser close
- Cookies: Size limitations, not suitable for complex state

### 3. State Retention Duration

**Decision**: Indefinite retention with last 30 days of activity
**Rationale**:
- Users expect their preferences to persist
- 30-day window provides good history without excessive storage
- Aligns with typical user session patterns

**Implementation**:
- Current state always saved
- Historical states for debugging/support (30 days)
- Automatic cleanup of states older than 30 days

### 4. Cross-Device Synchronization

**Decision**: Server-side state with optimistic UI updates
**Rationale**:
- Ensures consistency across all devices
- Fast UI response with background sync
- Handles conflicts gracefully

**Sync Strategy**:
- Save state changes immediately to localStorage
- Debounced sync to server (500ms after last change)
- On page load: merge server state with any unsaved local changes
- Conflict resolution: server state takes precedence, local changes preserved in history

### 5. Email Service Configuration

**Decision**: Use nodemailer with SMTP configuration
**Rationale**:
- Already suggested in existing codebase patterns
- Supports multiple email providers
- Good debugging and testing capabilities

**Configuration**:
- Support for Gmail, SendGrid, AWS SES
- HTML and text email templates
- Retry logic for failed sends
- Queue system for bulk sends

### 6. Unvalidated User Access

**Decision**: Full feature access with visual indicator
**Rationale**:
- Reduces friction for new users
- Email validation as progressive enhancement
- Industry trend toward reducing barriers

**Implementation**:
- Small banner reminder to validate email
- No feature restrictions
- Optional benefits for validated users (future enhancement)

## Technical Recommendations

### Security Considerations
1. **Token Generation**: Use crypto.randomBytes(32) for secure tokens
2. **Token Storage**: Hash tokens before storing (like passwords)
3. **Rate Limiting**: Implement on validation endpoints
4. **HTTPS Only**: Email validation links must use HTTPS

### Performance Optimizations
1. **State Updates**: Batch and debounce state saves
2. **Compression**: Compress state JSON for storage
3. **Caching**: Cache dashboard state in memory for active sessions
4. **Lazy Loading**: Load historical states only when needed

### Error Handling
1. **Email Failures**: Queue for retry, notify user of delays
2. **State Conflicts**: Preserve both states, let user choose
3. **Token Expiration**: Clear error message with resend option
4. **Network Issues**: Offline-capable with sync on reconnect

## Resolved Clarifications

### From Spec NEEDS CLARIFICATION Items:

1. **"What specific dashboard state elements need persistence?"**
   - **Resolved**: Complete UI state including layout, preferences, selections, and navigation state
   - Store as JSON object with versioning for future migrations

2. **"How long should validation emails remain valid?"**
   - **Resolved**: 24 hours from generation
   - Automatic cleanup of expired tokens
   - Clear messaging to users about expiration

3. **"Dashboard state retention duration?"**
   - **Resolved**: Current state retained indefinitely
   - Historical states for 30 days
   - User can manually clear their saved preferences

4. **"Cross-device synchronization behavior?"**
   - **Resolved**: Server-authoritative with optimistic updates
   - Automatic sync on login from any device
   - Manual sync button for immediate updates

## Integration Points

### Existing System Integration
1. **Authentication**: Extend existing JWT auth with email_verified claim
2. **User Model**: Add fields for validation status and state preferences
3. **Dashboard**: Enhance with state management hooks
4. **API Routes**: New endpoints following existing patterns

### External Services
1. **Email Provider**: SMTP configuration in environment variables
2. **Monitoring**: Log validation attempts and state sync events
3. **Analytics**: Track validation rates and state usage patterns

## Next Steps
With research complete and clarifications resolved, proceed to Phase 1:
- Design data models
- Create API contracts
- Write contract tests
- Generate quickstart guide

---
*Research completed: 2025-09-16*