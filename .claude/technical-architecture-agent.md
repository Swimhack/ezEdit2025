# Technical Architecture Agent

## Role: System Architecture Steward

**Primary Responsibility:** Maintain technical architecture integrity and guide technical decision-making for EzEdit.co.

## Current Architecture Status

### Technology Stack (v1.0)
- **Frontend:** Vanilla JavaScript, Monaco Editor v0.36.1, Tailwind CSS
- **Backend:** PHP 8.2+ with native FTP functions
- **Database:** PostgreSQL via Supabase
- **Authentication:** Hybrid Supabase + PHP sessions
- **AI:** Claude 3.5 Sonnet (primary), OpenAI GPT-4 (fallback)
- **Deployment:** Netlify (static) + DigitalOcean (PHP backend)

### Critical Architecture Decisions

#### ✅ Resolved
1. **Editor Choice:** Monaco Editor for professional code editing experience
2. **PHP Backend:** Native PHP for FTP operations (simple, reliable)
3. **Hybrid Auth:** Supabase for user management, PHP sessions for FTP credentials
4. **Three-Pane Layout:** File Explorer + Editor + AI Assistant

#### 🔄 In Progress
1. **FTP Integration Method:** Native PHP vs Node.js serverless functions
2. **AI Context Management:** How to maintain conversation state
3. **File Caching Strategy:** Local storage vs server-side caching

#### 📋 Pending
1. **Scaling Strategy:** How to handle multiple concurrent users
2. **Security Architecture:** FTP credential encryption and storage
3. **Error Handling:** Comprehensive error management system

### System Constraints

#### Hard Constraints
- **Budget:** Bootstrap funding, minimize infrastructure costs
- **Timeline:** Q1 2025 launch deadline
- **Simplicity:** Must be maintainable by small team

#### Soft Constraints
- **Performance:** Sub-3 second page loads, sub-1 second file operations
- **Browser Support:** Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **Mobile:** Responsive design, but desktop-first approach

### Architecture Patterns

#### Current Patterns
1. **MVC-style PHP:** Clean separation of concerns
2. **Component-based Frontend:** Modular JavaScript components
3. **Event-driven UI:** DOM events trigger application logic
4. **Session-based State:** PHP sessions for user state management

#### Anti-Patterns to Avoid
1. **God Objects:** Keep components focused and single-purpose
2. **Tight Coupling:** Minimize dependencies between components
3. **Synchronous FTP:** All FTP operations must be asynchronous
4. **Credential Exposure:** Never log or expose FTP credentials

### Integration Points

#### External Services
1. **Supabase:** User authentication and management
2. **Claude API:** AI assistant functionality
3. **Monaco CDN:** Code editor component
4. **DigitalOcean:** PHP backend hosting
5. **Netlify:** Static asset delivery

#### Internal Components
1. **FTP Handler:** Core file operation engine
2. **Monaco Integration:** Editor initialization and management
3. **AI Assistant:** Context management and API integration
4. **File Explorer:** Tree view and navigation
5. **Authentication:** Session and credential management

### Performance Considerations

#### Optimization Targets
- **Initial Load:** < 3 seconds to interactive
- **File Operations:** < 1 second for open/save
- **AI Responses:** < 5 seconds for code suggestions
- **Memory Usage:** < 100MB browser memory footprint

#### Bottleneck Areas
1. **FTP Operations:** Network latency and server response times
2. **Monaco Loading:** Large editor bundle size
3. **AI API Calls:** External service dependency
4. **File Tree:** Large directory structures

### Security Architecture

#### Current Implementation
- PHP session-based authentication
- Basic input sanitization
- HTTPS for all external communications

#### Required Improvements
1. **FTP Credential Encryption:** AES-256 encryption for stored credentials
2. **CSRF Protection:** Token-based request validation
3. **Input Validation:** Comprehensive sanitization and validation
4. **Rate Limiting:** Prevent API abuse and brute force attacks

### Technical Debt Tracking

#### High Priority
1. **Method Name Mismatch:** `downloadFile()` vs `getFile()` inconsistency
2. **Error Handling:** Incomplete error management in FTP operations
3. **Session Security:** Basic session management needs hardening

#### Medium Priority
1. **Code Organization:** Some functions are growing too large
2. **Documentation:** Missing inline documentation for complex functions
3. **Testing:** No automated testing framework implemented

#### Low Priority
1. **Performance:** Minor optimizations in file tree rendering
2. **UI Polish:** Some responsive design edge cases
3. **Accessibility:** WCAG compliance improvements

### Migration Strategy

#### Phase 1: Stabilization (Current)
- Fix critical bugs and inconsistencies
- Complete core feature implementation
- Basic security hardening

#### Phase 2: Optimization (Q2 2025)
- Performance improvements
- Advanced security features
- Comprehensive testing suite

#### Phase 3: Scaling (Q3 2025)
- Multi-tenant architecture
- Advanced collaboration features
- Enterprise security compliance

### Decision Log

#### 2025-01-10: Monaco Editor Version
**Decision:** Stick with Monaco Editor v0.36.1
**Rationale:** Stable, well-documented, meets all requirements
**Impact:** No breaking changes needed

#### 2025-01-10: FTP Implementation
**Decision:** Use native PHP FTP functions
**Rationale:** Simpler than Node.js serverless functions
**Impact:** Easier deployment and maintenance

#### 2025-01-10: Authentication Strategy
**Decision:** Hybrid Supabase + PHP sessions
**Rationale:** Leverages Supabase strengths while maintaining PHP compatibility
**Impact:** Requires careful session state management

### Monitoring and Metrics

#### Technical KPIs
- Page load time: Target < 3 seconds
- File operation time: Target < 1 second
- Error rate: Target < 1%
- Uptime: Target 99.9%

#### Performance Monitoring
- Browser performance API for frontend metrics
- PHP execution time logging for backend metrics
- FTP operation timing and success rates
- AI API response times and token usage

---

**Last Updated:** 2025-01-23  
**Version:** 1.0  
**Next Review:** 2025-01-30