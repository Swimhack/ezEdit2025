# EzEdit.co Product Requirements Document (PRD)

## Executive Summary

EzEdit.co is a web-based FTP code editor that brings the familiar three-pane layout of classic IDEs like Dreamweaver to the modern web, enhanced with AI assistance capabilities. The platform empowers developers to edit files directly on their servers through FTP while leveraging AI to accelerate development workflows.

## Vision Statement

"Democratize professional web development by combining the simplicity of direct server editing with the power of AI assistance, making professional-grade tools accessible to developers at all skill levels."

## Target Audience

### Primary Users
1. **Freelance Web Developers** 
   - Need quick server-side edits without complex deployment pipelines
   - Value direct FTP access for client projects
   - Appreciate AI assistance for faster development

2. **Small Agency Developers**
   - Manage multiple client sites across different servers
   - Require collaborative editing capabilities
   - Need cost-effective professional tools

3. **WordPress/PHP Developers**
   - Edit theme and plugin files directly on servers
   - Debug production issues quickly
   - Maintain legacy projects efficiently

### Secondary Users
1. **Hobbyist Developers** - Learning web development with real server access
2. **System Administrators** - Quick configuration file edits
3. **Content Managers** - Minor code adjustments without full IDE setup

## Core Features

### 1. Three-Pane Editor Layout
- **Left Pane**: FTP file explorer with tree view
- **Center Pane**: Monaco-based code editor with diff view
- **Right Pane**: AI assistant (Klein) for code help

### 2. FTP Integration
- **Connection Management**
  - Save multiple FTP server profiles
  - Support for FTP, FTPS, and SFTP protocols
  - Automatic reconnection on timeout
  - Connection pooling for performance

- **File Operations**
  - Browse remote directories
  - Create, rename, delete files/folders
  - Upload/download files
  - Batch operations support
  - File permissions management

### 3. Monaco Editor Features
- **Advanced Editing**
  - Syntax highlighting for 50+ languages
  - IntelliSense and auto-completion
  - Multi-cursor editing
  - Find and replace with regex
  - Code folding and minimap

- **Diff View**
  - Side-by-side comparison
  - Inline diff mode
  - Revert individual changes
  - Conflict resolution tools

### 4. AI Assistant (Klein)
- **Code Generation**
  - Generate code from natural language
  - Auto-complete complex snippets
  - Suggest optimizations

- **Code Understanding**
  - Explain code functionality
  - Identify potential bugs
  - Suggest best practices
  - Generate documentation

### 5. User Authentication & Plans

#### Authentication Methods
- Email/password with Supabase
- Google OAuth integration
- GitHub OAuth (planned)
- Magic link authentication

#### Subscription Tiers

**Free Trial (7 days)**
- Full feature access
- Limited to 1 FTP connection
- 100 AI requests/day
- Preview-only mode after trial

**Pro Plan ($50/month)**
- Unlimited FTP connections
- Unlimited AI requests
- Team collaboration (up to 5 users)
- Priority support
- Custom themes

**Lifetime Access ($500 one-time)**
- All Pro features
- Single domain license
- Lifetime updates
- White-label option
- API access

### 6. Collaboration Features
- **Real-time Editing** (Pro only)
  - See other users' cursors
  - Live change synchronization
  - Chat within editor

- **Project Sharing**
  - Share read-only links
  - Temporary edit access
  - Export project snapshots

### 7. Security & Compliance
- **Data Protection**
  - End-to-end encryption for FTP credentials
  - No server-side storage of file contents
  - Secure session management
  - GDPR compliant

- **Access Control**
  - IP whitelisting
  - Two-factor authentication
  - Audit logs
  - Session timeout controls

## Technical Architecture

### Frontend Stack
- **Framework**: Vanilla JavaScript (migration to React planned)
- **Editor**: Monaco Editor v0.36.1
- **Styling**: Tailwind CSS
- **State Management**: Local storage + session storage
- **Build Tools**: None (static files served directly)

### Backend Stack
- **Language**: PHP 8.x
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth + PHP sessions
- **File Operations**: Native PHP FTP functions
- **API**: RESTful endpoints

### Infrastructure
- **Hosting**: Netlify (static) + DigitalOcean (PHP backend)
- **CDN**: Cloudflare
- **Monitoring**: Custom health checks
- **Analytics**: Privacy-focused analytics

### AI Integration
- **Primary**: Claude 3.5 Sonnet API
- **Fallback**: OpenAI GPT-4
- **Local Models**: GGUF support for offline mode
- **Context Management**: Vector embeddings with Pinecone

## User Experience

### Onboarding Flow
1. **Sign Up** → Email verification → Welcome tutorial
2. **First Connection** → Guided FTP setup → Test connection
3. **First Edit** → Interactive editor tour → AI assistant introduction
4. **Upgrade Prompt** → Feature comparison → Trial countdown

### Key User Journeys

#### Quick Edit Flow
1. User opens EzEdit → Auto-connects to last server
2. Navigates to file → Double-click to open
3. Makes changes → AI assists if needed
4. Saves file → Changes uploaded instantly

#### Project Setup Flow
1. Create new project → Add FTP credentials
2. Map local folders → Set file filters
3. Configure AI preferences → Choose language modes
4. Start editing → Save project template

### Design Principles
1. **Familiarity** - Dreamweaver-inspired layout
2. **Speed** - Sub-second file operations
3. **Reliability** - Automatic error recovery
4. **Accessibility** - WCAG 2.1 AA compliance
5. **Responsiveness** - Works on tablets (mobile planned)

## Success Metrics

### User Acquisition
- **Target**: 10,000 users in Year 1
- **Conversion**: 10% free-to-paid conversion
- **Retention**: 80% monthly retention for paid users

### Technical Performance
- **Page Load**: < 3 seconds
- **File Operation**: < 1 second average
- **AI Response**: < 2 seconds
- **Uptime**: 99.9% availability

### Business Metrics
- **MRR Target**: $50,000 by Month 12
- **CAC**: < $50 per paid user
- **LTV**: > $600 per paid user
- **Churn**: < 5% monthly

## Competitive Analysis

### Direct Competitors
1. **Coda** - More expensive, complex setup
2. **Cloud9 (AWS)** - Requires AWS account, steeper learning curve  
3. **Codeanywhere** - Limited AI features, slower performance

### Indirect Competitors
1. **VS Code + FTP extensions** - Requires local setup
2. **cPanel File Manager** - Basic features only
3. **Desktop FTP clients** - No code editing features

### Competitive Advantages
1. **AI Integration** - Native AI assistant vs. plugins
2. **No Installation** - Pure web-based solution
3. **Familiar Interface** - Dreamweaver users feel at home
4. **Price Point** - More affordable than enterprise solutions
5. **FTP Focus** - Specialized for FTP workflows

## Roadmap

### Phase 1: MVP (Current)
- ✅ Basic FTP operations
- ✅ Monaco editor integration  
- ✅ User authentication
- 🔄 AI assistant integration
- 🔄 File browser improvements

### Phase 2: Enhanced Features (Q2 2025)
- Git integration
- SFTP/FTPS support
- Team collaboration
- Mobile responsive design
- Offline mode with sync

### Phase 3: Platform Expansion (Q3 2025)
- Plugin marketplace
- API for third-party integrations
- White-label solutions
- Enterprise features
- Desktop app (Electron)

### Phase 4: AI Evolution (Q4 2025)
- Custom AI model training
- Project-specific AI context
- Automated testing integration
- Code review assistant
- Deployment automation

## Risk Analysis

### Technical Risks
1. **FTP Protocol Limitations** - Mitigate with connection pooling
2. **Browser Restrictions** - Use service workers for offline
3. **AI API Costs** - Implement caching and rate limiting

### Business Risks
1. **Competition from Free Tools** - Focus on integrated experience
2. **Platform Dependencies** - Multi-provider strategy
3. **Security Concerns** - Regular audits and compliance

### Mitigation Strategies
1. Progressive enhancement approach
2. Multiple AI provider fallbacks
3. Open-source core components
4. Strong community building
5. Transparent security practices

## Success Criteria

### Launch Success (Month 1)
- 1,000 signups
- 100 paid conversions
- < 2% critical bug rate
- 4+ star average rating

### Growth Success (Month 6)
- 5,000 active users
- $10,000 MRR
- 50 NPS score
- 3 major features shipped

### Market Success (Year 1)
- 10,000 total users
- $50,000 MRR
- Industry recognition
- Profitable operations

## Conclusion

EzEdit.co represents a unique opportunity to capture the underserved market of developers who need simple, direct server editing with modern AI assistance. By focusing on FTP workflows and familiar interfaces while adding cutting-edge AI capabilities, we can create a sustainable, profitable business that truly serves the developer community.

The combination of proven interaction patterns (Dreamweaver-style layout) with modern technology (Monaco Editor, AI assistance) positions EzEdit.co to become the go-to solution for rapid server-side development in 2025 and beyond.