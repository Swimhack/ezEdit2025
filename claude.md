# CLAUDE.md - EzEdit.co AI Assistant Context

## Project Identity

**Project Name:** EzEdit.co  
**Vision:** The world's most intuitive web-based FTP code editor with AI assistance  
**Owner:** James Strickland  
**Current Status:** MVP Development (FTP File Browser + Monaco Editor Integration)  
**Target Launch:** Q1 2025

## Core Mission

EzEdit.co democratizes professional web development by combining the familiar three-pane layout of classic IDEs (like Dreamweaver) with modern AI assistance, making server-side code editing accessible to developers at all skill levels through simple FTP connections.

## Project Architecture Overview

### Technology Stack
- **Frontend:** Vanilla JavaScript, Monaco Editor v0.36.1, Tailwind CSS
- **Backend:** PHP 8.2+ with native FTP functions  
- **Database:** PostgreSQL via Supabase
- **Authentication:** Hybrid Supabase + PHP sessions
- **AI:** Claude 3.5 Sonnet (primary), OpenAI GPT-4 (fallback)
- **Deployment:** Netlify (static) + DigitalOcean (PHP backend)

### Current Implementation Status

#### ✅ Completed Components
1. **User Authentication System** - Supabase + PHP session hybrid
2. **FTP Handler Backend** (`/public/ftp/ftp-handler.php`) - Full CRUD operations
3. **Monaco Editor Integration** - Diff editor with syntax highlighting
4. **Basic File Explorer** - Tree view with lazy loading
5. **Project Structure** - MVC-style PHP backend

#### 🔄 In Progress
1. **FTP Connection Issues** - Edge function errors on Netlify
2. **Monaco-FTP Integration** - Method name mismatches
3. **AI Assistant (Klein)** - Backend integration pending

#### 🎯 Priority Fixes Needed
1. **Critical Issue:** `ftpService.downloadFile()` called but only `getFile()` exists (`monaco-editor.js:192` vs `ftp-service.js:511-538`)
2. **Deployment Issue:** PHP FTP handler doesn't work on Netlify, needs serverless function conversion
3. **Missing Redirect:** `netlify.toml` needs `/ftp/ftp-handler.php` redirect

## File Structure & Key Components

```
/public/
├── editor.php              # Main editor interface
├── ftp/ftp-handler.php     # FTP operations backend
├── js/
│   ├── monaco-editor.js    # Monaco integration (line 192 issue)
│   ├── file-explorer.js    # File tree component  
│   ├── ftp-service.js      # FTP API client (line 511-538)
│   └── ai-assistant.js     # Klein AI integration
└── css/
    └── editor.css          # Editor-specific styles
```

## Business Model

### Subscription Tiers
- **Free Trial (7 days):** Full features, view/preview only after trial
- **Pro ($50/month):** Unlimited FTP connections, full save access, team features
- **Lifetime ($500):** Single domain license, all Pro features forever

### Target Users
1. **Primary:** Freelance web developers, small agencies
2. **Secondary:** WordPress/PHP developers, hobbyists
3. **Use Cases:** Quick server edits, theme/plugin development, production debugging

## AI Assistant Integration (Klein)

### Planned Features
- **Code Explanation:** Understand existing code
- **Code Generation:** Write code from natural language
- **Bug Detection:** Identify potential issues
- **Optimization Suggestions:** Performance improvements
- **Documentation Generation:** Auto-create comments/docs

### Implementation Requirements
- Token usage tracking for billing
- Context management (current file + conversation history)
- Multiple AI provider support (Claude primary, OpenAI fallback)
- Real-time streaming responses

## Development Priorities

### Immediate Tasks (Next 30 Days)
1. **Fix FTP-Monaco Integration**
   - Resolve `downloadFile()` vs `getFile()` mismatch
   - Test complete file open → edit → save workflow
   - Fix Netlify deployment issues

2. **Complete AI Assistant**
   - Implement Klein backend API
   - Add UI components for AI chat
   - Integrate with Monaco editor for context

3. **Enhanced File Operations**
   - Drag & drop file upload
   - Batch file operations
   - File search functionality

### Medium-term Goals (Q2 2025)
- Git integration for version control
- Team collaboration features  
- Mobile-responsive design
- SFTP/FTPS protocol support

## Technical Standards

### Code Quality Requirements
- **Security First:** No exposed credentials, encrypted FTP passwords
- **Performance:** Sub-3 second page loads, sub-1 second file operations
- **Accessibility:** WCAG 2.1 AA compliance
- **Browser Support:** Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

### API Design Patterns
- RESTful endpoints with consistent error handling
- JSON responses with `success` boolean and `data`/`error` structure
- Bearer token authentication for AI services
- Session-based auth for FTP operations

## Deployment Configuration

### Netlify Setup
```toml
# netlify.toml (needs FTP redirect fix)
[[redirects]]
  from = "/ftp/*"
  to = "https://api.ezedit.co/ftp/:splat"
  status = 200
```

### Environment Variables
```bash
SUPABASE_URL=https://natjhcqynqziccsnwim.supabase.co
SUPABASE_ANON_KEY=[configured]
CLAUDE_API_KEY=[configured]
OPENAI_API_KEY=[configured]
ENCRYPTION_KEY=[for FTP password encryption]
```

## Testing Strategy

### Critical Test Cases
1. **FTP Connection Flow:** Connect → Browse → Open File → Edit → Save
2. **Authentication:** Login → Session persistence → Logout
3. **Error Handling:** Network failures, invalid credentials, file permissions
4. **AI Integration:** Question → Context → Response → Token tracking

### Test Data Requirements
- Test FTP server (test.rebex.net recommended)
- Sample files for editing (HTML, CSS, JS, PHP)
- Mock AI responses for development

## Known Issues & Solutions

### Issue #1: Method Name Mismatch
**Problem:** `monaco-editor.js:192` calls `ftpService.downloadFile()` but `ftp-service.js` only has `getFile()`  
**Solution:** Standardize on `getFile()` method name across all components

### Issue #2: Netlify PHP Execution
**Problem:** PHP files can't execute on Netlify, causing "Edge Function" errors  
**Solution:** Convert `ftp-handler.php` to Node.js serverless function

### Issue #3: Session Management
**Problem:** PHP sessions don't persist across serverless functions  
**Solution:** Use JWT tokens stored in localStorage with refresh mechanism

## Success Metrics

### Technical KPIs
- Page load time < 3 seconds
- File operation time < 1 second  
- 99.9% uptime
- Zero exposed credentials

### Business KPIs
- 10% free-to-paid conversion
- $50,000 MRR by Month 12
- 80% monthly retention (paid users)
- 4+ star average rating

## Communication Preferences

### For AI Assistants Working on EzEdit.co
1. **Always start with current status check** - What's working/broken?
2. **Focus on practical solutions** - Code examples over theory
3. **Consider deployment constraints** - Netlify static + DigitalOcean PHP
4. **Test thoroughly** - Full user workflow validation
5. **Document changes** - Update this file when architecture changes

### Code Review Standards
- Security audit for any FTP/auth code
- Performance impact assessment
- Mobile compatibility check
- AI token usage optimization

## Project Context for AI Assistance

**Working Style:** James values rapid prototyping with production-ready quality. He prefers proven technologies over cutting-edge experiments. Solutions should be scalable but not over-engineered.

**Business Constraints:** Bootstrap budget, targeting profitability by Month 6. Every feature must justify its development cost through user value or revenue impact.

**Technical Philosophy:** "Make it work, make it right, make it fast" - in that order. Prioritize user experience over technical elegance when they conflict.

## Quick Reference

### Most Common Tasks for AI Assistants
1. **Debug FTP issues** - Check connection pooling, error handling
2. **Optimize Monaco integration** - Language detection, theme management
3. **Implement AI features** - Context building, token management
4. **Fix deployment issues** - Netlify redirects, serverless functions
5. **Enhance file operations** - Upload, download, permissions

### Critical Files to Understand
- `/public/ftp/ftp-handler.php` - All FTP logic
- `/public/js/monaco-editor.js` - Editor integration
- `/public/js/ftp-service.js` - Frontend FTP client
- `/public/editor.php` - Main UI layout
- `/netlify.toml` - Deployment configuration

### Emergency Contacts
- **Primary Developer:** James Strickland
- **Repository:** Private GitHub repo
- **Deployment:** Netlify + DigitalOcean
- **Database:** Supabase dashboard access required

---

*Last Updated: 2025-01-10*  
*Document Version: 1.0*  
*Update this file whenever major architecture changes occur*