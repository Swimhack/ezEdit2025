# Quickstart: Enhanced Logging for FTP and Editor Troubleshooting

**Feature**: 011-make-sure-logs | **Date**: 2025-09-18

## Overview

This quickstart guide provides step-by-step instructions to test the enhanced logging system for FTP and editor operations. Follow these scenarios to validate that comprehensive troubleshooting information is captured and accessible through the `/logs` endpoint.

## Prerequisites

1. **Authentication**: Valid user account with logging access permissions
2. **Test Environment**: Development environment with FTP server and editor functionality
3. **Test Data**: Sample FTP connection and test files for editor operations
4. **Tools**: Browser developer tools for network inspection

## Test Scenarios

### Scenario 1: FTP Connection Troubleshooting

**Objective**: Verify that FTP connection attempts and failures are comprehensively logged

#### Steps:
1. **Navigate to Dashboard**
   ```
   Open browser → https://localhost:3000/dashboard
   Login with test credentials
   ```

2. **Add Test FTP Connection**
   ```
   Click "Add Website" → Select "FTP/SFTP"
   Enter invalid FTP details:
   - Host: invalid-ftp-server.example.com
   - Port: 21
   - Username: testuser
   - Password: wrongpassword
   Click "Test Connection"
   ```

3. **Verify Connection Failure Logging**
   ```
   Navigate to /logs?pass=1234
   Filter by: category="FTP", level="ERROR"
   Expected Results:
   - Connection attempt logged with host, port, username (not password)
   - Error details including FTP error code and message
   - Correlation ID for tracking related operations
   - Performance metrics (connection timeout duration)
   ```

4. **Test Successful FTP Connection**
   ```
   Edit FTP connection with valid credentials:
   - Host: ftp.example.com
   - Username: validuser
   - Password: correctpassword
   Click "Test Connection"
   ```

5. **Verify Success Logging**
   ```
   Check /logs for successful connection:
   - Connection established log entry
   - Performance metrics (connection time)
   - Connection pool assignment
   - Protocol details (FTP/SFTP/FTPS)
   ```

#### Expected Log Entries:
- **Failed Connection**: FTP connection attempt with error details and retry information
- **Successful Connection**: FTP connection established with performance metrics
- **Connection Cleanup**: Connection pool cleanup and resource release

### Scenario 2: FTP File Operations Troubleshooting

**Objective**: Verify that FTP file operations (list, upload, download) are logged with detailed context

#### Steps:
1. **Test Directory Listing**
   ```
   From dashboard → Click "Browse Files" on valid FTP connection
   Navigate through directories
   ```

2. **Verify Listing Logs**
   ```
   Check /logs with filters:
   - category="FTP"
   - ftpOperation="LIST"
   Expected:
   - Directory path accessed
   - Number of files/directories returned
   - Operation duration
   - Any permission errors
   ```

3. **Test File Upload**
   ```
   Upload test file through FTP interface
   Monitor operation progress
   ```

4. **Verify Upload Logs**
   ```
   Check /logs for upload operation:
   - File size and transfer speed
   - Progress tracking
   - Success/failure status
   - Transfer metrics (bandwidth, duration)
   ```

5. **Test File Download**
   ```
   Download file from FTP server
   Monitor transfer progress
   ```

6. **Verify Download Logs**
   ```
   Check logs for download operation:
   - Source and destination paths
   - Transfer metrics
   - Error handling (if any)
   ```

#### Expected Log Entries:
- **Directory Listing**: Path, file count, permissions, operation time
- **File Upload**: Size, transfer speed, checksum verification, errors
- **File Download**: Transfer metrics, integrity checks, completion status

### Scenario 3: Editor Operation Troubleshooting

**Objective**: Verify that editor file operations and state changes are logged for debugging

#### Steps:
1. **Test File Loading in Editor**
   ```
   Navigate to three-pane editor
   Load large file (>1MB) or file with syntax errors
   Monitor loading performance
   ```

2. **Verify Loading Logs**
   ```
   Check /logs with filters:
   - category="EDITOR"
   - editorOperation="LOAD"
   Expected:
   - File metadata (size, type, path)
   - Loading time metrics
   - Syntax validation results
   - Memory usage during load
   ```

3. **Test File Editing Operations**
   ```
   Make multiple edits to file:
   - Add/remove text
   - Search and replace
   - Format code
   - Save changes
   ```

4. **Verify Editing Logs**
   ```
   Check logs for editing operations:
   - Content modification tracking
   - Cursor position changes
   - Auto-save triggers
   - Validation results
   ```

5. **Test Three-Pane Layout Changes**
   ```
   Toggle pane visibility:
   - Hide/show file tree
   - Hide/show preview pane
   - Switch active pane focus
   ```

6. **Verify Layout Logs**
   ```
   Check logs for layout changes:
   - Pane visibility states
   - Active pane tracking
   - Layout performance impact
   ```

#### Expected Log Entries:
- **File Load**: File metadata, load time, syntax errors, memory usage
- **Content Changes**: Modification count, cursor position, validation results
- **Layout Changes**: Pane states, performance impact, user interactions

### Scenario 4: Real-time Log Streaming

**Objective**: Verify that logs stream in real-time for live troubleshooting

#### Steps:
1. **Open Log Streaming**
   ```
   Navigate to /logs?pass=1234
   Enable "Auto Refresh" or streaming mode
   Open browser developer tools → Network tab
   ```

2. **Generate Test Activity**
   ```
   In separate tab:
   - Perform FTP operations
   - Edit files in editor
   - Trigger some errors (invalid operations)
   ```

3. **Verify Real-time Updates**
   ```
   Monitor logs page for:
   - New entries appearing without page refresh
   - Stream connection in Network tab (SSE)
   - Message batching (50 messages per batch)
   - Connection heartbeat every 30 seconds
   ```

4. **Test Stream Filtering**
   ```
   Apply filters while streaming:
   - Filter by ERROR level only
   - Filter by FTP category only
   - Filter by specific user ID
   ```

5. **Verify Filtered Streaming**
   ```
   Confirm only matching entries appear:
   - Filters applied to stream
   - Performance maintained
   - No missed messages
   ```

#### Expected Behavior:
- **Real-time Updates**: New logs appear within 1-2 seconds
- **Stream Stability**: Connection maintained for extended periods
- **Filter Efficiency**: Only matching entries streamed
- **Performance**: No noticeable UI lag during high-volume logging

### Scenario 5: Advanced Log Filtering and Search

**Objective**: Verify that complex filtering and search capabilities work correctly

#### Steps:
1. **Test Time Range Filtering**
   ```
   Access /logs with time range:
   - Last 1 hour
   - Last 24 hours
   - Custom date range
   ```

2. **Test Multi-Category Filtering**
   ```
   Filter by multiple categories:
   - FTP + EDITOR operations
   - ERROR + WARN levels
   - Specific user operations
   ```

3. **Test Full-Text Search**
   ```
   Search for specific terms:
   - "connection failed"
   - "file not found"
   - File names or paths
   - Error messages
   ```

4. **Test Performance Filtering**
   ```
   Filter by operation duration:
   - Operations > 5 seconds
   - Failed operations only
   - High-bandwidth transfers
   ```

5. **Test Correlation ID Tracking**
   ```
   Find related operations:
   - Click correlation ID link
   - View all related log entries
   - Follow operation chains
   ```

#### Expected Results:
- **Accurate Filtering**: Results match specified criteria
- **Fast Queries**: Response time < 500ms for recent logs
- **Comprehensive Search**: Full-text search finds relevant entries
- **Correlation Tracking**: Related operations properly linked

### Scenario 6: Log Export and Data Recovery

**Objective**: Verify that logs can be exported for offline analysis

#### Steps:
1. **Test JSON Export**
   ```
   Select filtered log set
   Choose "Export" → "JSON format"
   Download and verify file structure
   ```

2. **Test CSV Export**
   ```
   Export same data as CSV
   Verify readable format in spreadsheet
   Check data completeness
   ```

3. **Test Large Export**
   ```
   Export 24 hours of logs
   Verify file size limits
   Check export performance
   ```

4. **Verify Export Content**
   ```
   Open exported files and verify:
   - All requested fields present
   - Sensitive data properly redacted
   - Timestamps in correct format
   - Structured data preserved
   ```

#### Expected Results:
- **Format Accuracy**: Exports match requested format
- **Data Completeness**: All non-sensitive data included
- **Performance**: Exports complete within reasonable time
- **Security**: Sensitive information properly sanitized

## Validation Checklist

### Functional Requirements Validation

- [ ] **FR-001**: FTP connection attempts logged with sanitized credentials
- [ ] **FR-002**: FTP operations logged with performance metrics
- [ ] **FR-003**: Editor operations logged with file metadata
- [ ] **FR-004**: FTP errors captured with detailed context
- [ ] **FR-005**: Editor state changes tracked comprehensively
- [ ] **FR-006**: Logs accessible through /logs endpoint with authentication
- [ ] **FR-007**: Filtering works for all supported criteria
- [ ] **FR-008**: Sensitive information properly sanitized
- [ ] **FR-009**: Correlation IDs enable operation tracing
- [ ] **FR-010**: Performance metrics captured for all operations
- [ ] **FR-011**: Log retention policies enforced
- [ ] **FR-012**: High-volume logging doesn't impact performance
- [ ] **FR-013**: Browser information captured for editor issues
- [ ] **FR-014**: Configuration changes logged for FTP troubleshooting
- [ ] **FR-015**: Export functionality works for multiple formats

### Performance Validation

- [ ] **Log Write Latency**: < 100ms for standard operations
- [ ] **Query Response Time**: < 500ms for recent log queries
- [ ] **Stream Performance**: Real-time updates within 1-2 seconds
- [ ] **Export Performance**: Large exports complete within 60 seconds
- [ ] **Memory Usage**: Logging system uses < 100MB additional memory
- [ ] **Storage Efficiency**: Compressed logs achieve > 50% size reduction

### Security Validation

- [ ] **Credential Sanitization**: No passwords or keys visible in logs
- [ ] **Access Control**: Unauthorized users cannot access logs
- [ ] **Data Privacy**: User information properly anonymized where required
- [ ] **Audit Trail**: All log access properly recorded
- [ ] **Secure Transmission**: Log streaming uses encrypted connections

## Troubleshooting Common Issues

### Issue: Logs Not Appearing
**Symptoms**: No log entries visible in /logs interface
**Diagnosis Steps**:
1. Check authentication status
2. Verify log level filters
3. Check time range settings
4. Confirm logging service is running

### Issue: Poor Query Performance
**Symptoms**: Slow response times for log queries
**Diagnosis Steps**:
1. Check query complexity and filters
2. Verify database index usage
3. Check log volume and tier distribution
4. Monitor system resource usage

### Issue: Stream Connection Drops
**Symptoms**: Real-time streaming stops working
**Diagnosis Steps**:
1. Check network connectivity
2. Verify SSE connection in browser
3. Check server connection limits
4. Monitor for connection cleanup

### Issue: Missing FTP Operation Details
**Symptoms**: FTP logs lack expected context
**Diagnosis Steps**:
1. Verify FTP client logging integration
2. Check correlation ID assignment
3. Confirm operation type detection
4. Validate context data capture

## Success Criteria

The enhanced logging system is considered successful when:

1. **Complete Traceability**: All FTP and editor operations can be traced from start to finish
2. **Effective Troubleshooting**: Support team can diagnose issues using logs alone
3. **Performance Maintained**: Application performance is not impacted by logging
4. **Real-time Monitoring**: Issues are visible within seconds of occurrence
5. **Comprehensive Coverage**: All edge cases and error scenarios are captured
6. **User Privacy**: Sensitive information is properly protected throughout the system

## Next Steps

After successful validation:

1. **Production Deployment**: Deploy to production environment with monitoring
2. **Training**: Train support team on log analysis techniques
3. **Alerting**: Set up automated alerts for critical error patterns
4. **Optimization**: Monitor and optimize based on production usage patterns
5. **Documentation**: Create comprehensive troubleshooting guides for common issues