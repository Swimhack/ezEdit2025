# Research: Enhanced Logging for FTP and Editor Troubleshooting

**Feature**: 011-make-sure-logs | **Date**: 2025-09-18

## Technology Decisions

### 1. Logging Framework Selection

**Decision**: Continue with Pino + Enhanced Application Logger
**Rationale**:
- Pino provides 5-10x better performance than alternatives in production benchmarks
- Existing investment in dual-logger architecture (traditional Pino + sophisticated application logger)
- Async nature prevents event loop blocking in Next.js applications
- Rich ecosystem for serializers and redaction

**Alternatives Considered**:
- **Winston**: Rejected - slower performance, synchronous bottlenecks in high-volume scenarios
- **Bunyan**: Rejected - unmaintained, fewer features than Pino
- **Custom logging**: Rejected - reinventing wheel, testing overhead

**Implementation Notes**:
- Leverage existing `lib/logger.ts` (Pino) and `lib/logging/logger.ts` (Application Logger)
- Enhance with FTP and editor-specific serializers
- Add production redaction configuration for sensitive FTP credentials

### 2. Log Storage Strategy

**Decision**: Hybrid Hot/Warm/Cold Tiered Storage
**Rationale**:
- Balances performance (hot tier), cost efficiency (cold tier), and retention requirements
- Existing tiered storage implementation provides solid foundation
- Enables fast queries for recent troubleshooting while maintaining historical data

**Alternatives Considered**:
- **Single-tier database storage**: Rejected - performance degradation as volume grows
- **File-only storage**: Rejected - poor query performance, no real-time filtering
- **External logging service**: Rejected - cost prohibitive, vendor lock-in

**Configuration Enhancements**:
- **Hot Tier**: 7 days, 2GB, uncompressed, <100ms query response
- **Warm Tier**: 90 days, 10GB, compressed, <5s query response
- **Cold Tier**: 365 days, 100GB, compressed archives, <30s query response

### 3. Real-time Streaming Approach

**Decision**: Server-Sent Events (SSE) with Connection Pooling
**Rationale**:
- Better browser compatibility than WebSockets
- Simpler infrastructure - no upgrade handshake complexity
- Natural fit for one-way log streaming use case
- Existing SSE implementation in codebase provides foundation

**Alternatives Considered**:
- **WebSockets**: Rejected - overkill for one-way streaming, connection management complexity
- **Long polling**: Rejected - inefficient resource usage, delayed updates
- **Short polling**: Rejected - poor user experience, high server load

**Performance Optimizations**:
- Connection pooling with cleanup on disconnect
- Message batching (50 messages per batch) to reduce network overhead
- Heartbeat mechanism (30-second intervals) for connection health
- Circuit breaker pattern for failed connections

### 4. Search and Filtering Implementation

**Decision**: PostgreSQL Full-Text Search with ts_vector
**Rationale**:
- Leverages existing Supabase PostgreSQL infrastructure
- Excellent performance for structured log data
- Native support for complex queries and aggregations
- No additional infrastructure required

**Alternatives Considered**:
- **Elasticsearch**: Rejected - infrastructure complexity, cost, operational overhead
- **Simple SQL LIKE queries**: Rejected - poor performance on large datasets
- **In-memory search**: Rejected - limited by available RAM, poor persistence

**Search Features**:
- Full-text search across log messages and metadata
- Structured field filtering (time range, severity, operation type)
- FTP-specific filters (host, user, operation)
- Editor-specific filters (file type, action, user)
- Performance-based filtering (duration, error rates)

### 5. Correlation ID Strategy

**Decision**: UUID with Hierarchical Context and Session Tracking
**Rationale**:
- Enables tracing related operations across FTP sessions and editor workflows
- Hierarchical structure supports parent-child operation relationships
- UUID provides uniqueness in distributed scenarios
- Session tracking enables user journey analysis

**Alternatives Considered**:
- **Sequential IDs**: Rejected - distributed system concerns, collision risk
- **Timestamp-based IDs**: Rejected - poor uniqueness guarantees
- **Simple random strings**: Rejected - no hierarchical relationship support

**ID Structure**:
- Base format: `{timestamp}-{uuid}`
- FTP operations: `ftp-{sessionId}-{operation}-{uuid}`
- Editor operations: `editor-{sessionId}-{fileId}-{action}-{uuid}`
- Request correlation: Extracted from headers or generated

### 6. Sensitive Data Sanitization

**Decision**: Multi-Layer Pattern-Based Redaction
**Rationale**:
- Critical for security compliance (passwords, tokens, private keys)
- FTP credentials require special handling
- Regex patterns provide comprehensive coverage
- Configurable redaction supports different deployment environments

**Patterns Implemented**:
- **Credentials**: Passwords, tokens, API keys, SSH private keys
- **FTP-specific**: Connection strings, usernames in URLs, private keys
- **Personal data**: Email addresses, potential SSN/credit card patterns
- **Auth headers**: Bearer tokens, Basic auth strings

**Redaction Approach**:
- Server-side redaction before storage (irreversible)
- Client-side masking for display purposes
- Whitelist approach for known safe fields
- Regular expression compilation optimization for performance

### 7. Performance Impact Mitigation

**Decision**: Async Batching with Priority Queuing
**Rationale**:
- High-volume logging (1000+ operations/hour) requires careful performance management
- Batched writes reduce database connection overhead
- Priority queuing ensures critical errors bypass normal batching delays
- Async processing prevents blocking main application threads

**Performance Strategies**:
- **Write Batching**: 500-message batches with 1-second flush intervals
- **Priority Queues**: Critical logs bypass batching, normal logs batched
- **Memory Management**: 1000-log in-memory buffer with overflow protection
- **Connection Pooling**: Dedicated logging database connections

**Monitoring Metrics**:
- Log write latency (target: <100ms p95)
- Query response time (target: <500ms for recent logs)
- Memory usage (buffer size monitoring)
- Stream connection count (target: support 100+ concurrent)

## Implementation Architecture

### Core Components

1. **Enhanced Logger Library** (`lib/logging/`)
   - Extends existing application logger with FTP/editor specifics
   - Implements tiered storage management
   - Provides correlation ID management

2. **Log Stream Manager** (`lib/logging/stream.ts`)
   - Manages SSE connections and message distribution
   - Implements connection pooling and cleanup
   - Handles message batching and filtering

3. **Log Search Service** (`lib/logging/search.ts`)
   - Provides advanced query capabilities
   - Implements tier-aware searching
   - Handles performance optimization for large datasets

4. **Sanitization Engine** (`lib/logging/sanitizer.ts`)
   - Implements pattern-based data redaction
   - Provides configurable sensitivity levels
   - Handles FTP-specific credential patterns

### Integration Points

1. **FTP Client Enhancement** (`lib/ftp-client.ts`)
   - Add comprehensive operation logging
   - Include connection lifecycle events
   - Capture performance metrics and error details

2. **Editor State Logging** (`lib/editor-state.ts`)
   - Log file operations and state changes
   - Track user interactions and preview generation
   - Include browser context for client-side issues

3. **API Route Enhancement** (`app/api/logs/`, `app/api/ftp/`)
   - Add structured logging to all endpoints
   - Implement request/response correlation
   - Include performance timing and error context

### Database Schema Enhancements

1. **Log Storage Tables**
   - Hot tier: Optimized for fast writes and recent queries
   - Warm tier: Balanced performance with compression
   - Cold tier: Archive format with minimal indexing

2. **Indexing Strategy**
   - Time-based partitioning for query performance
   - Full-text search indexes for content queries
   - Composite indexes for common filter combinations

3. **Retention Policies**
   - Automated tier migration based on age and access patterns
   - Configurable retention periods per tier
   - Cleanup jobs to maintain storage limits

## Risk Mitigation

### Performance Risks
- **Risk**: High-volume logging impacts application performance
- **Mitigation**: Async batching, dedicated connections, performance monitoring

### Storage Risks
- **Risk**: Log storage grows unbounded
- **Mitigation**: Tiered retention, automated cleanup, storage monitoring

### Security Risks
- **Risk**: Sensitive data exposure in logs
- **Mitigation**: Multi-layer sanitization, server-side redaction, audit trails

### Availability Risks
- **Risk**: Logging system failure impacts troubleshooting
- **Mitigation**: Fallback to file logging, health checks, monitoring alerts

## Testing Strategy

### Contract Testing
- API endpoint schema validation
- Log format and structure verification
- Error response consistency

### Integration Testing
- Cross-component correlation ID tracking
- FTP operation logging workflows
- Editor state change logging workflows
- Real-time streaming functionality

### Performance Testing
- High-volume logging load testing
- Query performance under different data volumes
- Stream connection scalability testing
- Memory usage and leak detection

### Security Testing
- Sensitive data sanitization verification
- Access control validation
- Correlation ID privacy protection
- Export functionality security review