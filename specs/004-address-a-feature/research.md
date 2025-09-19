# Research Findings: FTP Editor Loading Bug Fix

**Date**: 2025-09-17
**Feature**: Fix FTP Editor Loading Failure
**Research Phase**: Phase 0

## Executive Summary

Root cause identified: **Storage system mismatch** between website management APIs and FTP editor APIs. Website dashboard uses `websites-memory-store.ts` while FTP editor uses `websites-store.ts`, causing "Failed to fetch" errors when editor attempts to load website configurations that don't exist in the file-based store.

## Research Areas

### 1. Storage System Alignment Strategy

**Decision**: Standardize on memory-based storage for both website management and FTP editor APIs

**Rationale**:
- Memory store is already working in production environment (Fly.io)
- File-based storage has permission issues in containerized deployments
- Memory store provides better performance and simpler error handling
- Maintains existing data structures and interfaces

**Alternatives Considered**:
- **File-based unification**: Rejected due to production environment file permission constraints
- **Dual-storage synchronization**: Rejected due to complexity and potential race conditions
- **Database migration**: Rejected as outside scope of bug fix (would affect other features)

**Implementation Approach**:
- Update FTP editor APIs to use `websites-memory-store.ts`
- Maintain existing API contracts and interfaces
- Add fallback error handling for edge cases

### 2. FTP Connection Error Handling Patterns

**Decision**: Implement layered error handling with specific error types and user-friendly messages

**Rationale**:
- Current "Failed to fetch" error is too generic for users to understand
- FTP connections can fail for multiple reasons (credentials, network, server availability)
- Users need actionable error messages with retry options
- Debugging requires detailed server-side logging

**Best Practices Identified**:
- **Connection Validation**: Test FTP connection before editor initialization
- **Error Categorization**: Network, authentication, server, and configuration errors
- **Progressive Disclosure**: User-friendly message with option to view technical details
- **Retry Mechanisms**: Automatic retry for transient failures, manual retry for persistent issues

**Implementation Pattern**:
```typescript
interface EditorError {
  type: 'connection' | 'authentication' | 'network' | 'configuration'
  userMessage: string
  technicalDetails: string
  retryable: boolean
  suggestedAction: string
}
```

### 3. User Experience During Connection Failures

**Decision**: Implement progressive error states with clear recovery paths

**Rationale**:
- Users need immediate feedback about what's happening
- Error states should maintain context and allow recovery
- Loading states should indicate progress and provide escape options
- Error messages should be educational, not just informational

**UX Patterns**:
- **Loading State**: "Connecting to your website..." with progress indication
- **Error State**: Specific error message with "Try Again" and "Check Settings" options
- **Recovery State**: Preserve user context, don't force navigation away
- **Help Integration**: Link to troubleshooting guide for common issues

**Accessibility Considerations**:
- Screen reader compatible error announcements
- Keyboard navigation for retry actions
- High contrast error state indicators
- Timeout handling for assistive technologies

## Technical Implementation Decisions

### API Route Updates
- **Target Files**: `/app/api/ftp/editor/file/route.ts`, `/app/api/ftp/list/route.ts`
- **Change**: Import from `websites-memory-store.ts` instead of `websites-store.ts`
- **Impact**: Minimal - same interface, different backing store

### Error Handling Enhancement
- **Target Components**: `ThreePaneEditor.tsx`, `editor-state.tsx`
- **Change**: Add structured error handling with retry capabilities
- **Impact**: Enhanced user experience without breaking existing functionality

### Connection Validation
- **Target Library**: `ftp-connections.ts`
- **Change**: Add connection test method before editor initialization
- **Impact**: Prevent editor load failures due to invalid connections

## Risk Assessment

### Low Risk Changes
- ✅ Storage system alignment (same interface)
- ✅ Error message improvements (additive)
- ✅ Connection validation (defensive)

### Medium Risk Changes
- ⚠️ Error state management in React context (requires testing)
- ⚠️ Retry mechanism implementation (could cause loops)

### Mitigation Strategies
- Comprehensive contract testing for storage alignment
- Integration testing for error handling flows
- Performance testing for retry mechanisms
- Rollback plan: revert to original storage system if issues arise

## Dependencies and Constraints

### External Dependencies
- **Existing**: `basic-ftp`, `ssh2-sftp-client`, Monaco Editor
- **No New Dependencies**: Solution uses existing technology stack

### Performance Constraints
- **Memory Usage**: Memory store is bounded by website count (low impact)
- **Connection Pooling**: Existing FTP connection management unchanged
- **Editor Load Time**: Target <2s maintained with better error handling

### Compatibility Constraints
- **Existing Tests**: Must pass without modification
- **API Contracts**: Must maintain backward compatibility
- **User Data**: No data migration required

## Next Steps for Phase 1

1. **Data Model Definition**: Formalize error state and connection status entities
2. **API Contract Updates**: Define enhanced error response schemas
3. **Integration Test Planning**: Design test scenarios for storage alignment
4. **User Flow Documentation**: Document error recovery user journeys

---

**Research Complete**: All technical unknowns resolved, ready for Phase 1 design