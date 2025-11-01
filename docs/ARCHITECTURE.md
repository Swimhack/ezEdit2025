# EzEdit v2 - Architecture Documentation

## System Overview

EzEdit is built as a modern web application using Next.js 16 with a client-server architecture that integrates multiple AI providers and remote storage systems.

## Core Components

### 1. Frontend Layer (`app/` & `components/`)

#### Component Structure
```
components/
├── EditorLayout.tsx          # Main three-pane layout
├── editor/
│   └── CodeEditor.tsx        # Monaco editor wrapper
├── file-explorer/
│   └── FileExplorer.tsx      # File tree and navigation
├── ai-assistant/
│   └── AIAssistant.tsx       # AI chat interface
└── ui/                        # ShadCN UI components
```

#### Key Technologies
- **React 19** - UI library with concurrent features
- **Next.js 16 App Router** - Full-stack framework
- **TailwindCSS** - Utility-first styling
- **Monaco Editor** - VS Code editing experience
- **React Resizable Panels** - Draggable pane dividers

---

### 2. AI Integration Layer (`lib/ai/`)

#### Supported Providers
- **OpenAI GPT-5** - Primary reasoning model
- **Anthropic Claude Code** - Code-focused AI
- **Ollama 3** - Local LLaMA models

#### AI Modes
Each mode provides specialized assistance:
- `explain` - Code explanation and documentation
- `refactor` - Code optimization and restructuring
- `seo` - SEO improvements for web content
- `debug` - Error detection and fixing
- `deploy` - Deployment assistance
- `rollback` - Version control and restoration

---

### 3. Storage Adapters (`lib/storage/` & `lib/ftp/`)

#### FTP/SFTP Client
- Uses `basic-ftp` for FTP connections
- Uses `ssh2-sftp-client` for SFTP
- Supports encrypted credential storage

#### S3-Compatible Storage
- AWS SDK for S3 integration
- Compatible with DigitalOcean Spaces, Cloudflare R2, etc.
- Bucket-based file management

---

### 4. Backend API (`app/api/`)

#### API Routes
```
app/api/
├── connections/         # Manage FTP/S3 connections
├── files/               # File operations (read/write/delete)
├── ai/                  # AI provider proxies
├── deploy/              # Deployment endpoints
└── auth/                # Authentication endpoints
```

#### Supabase Integration
- **Database** - PostgreSQL for user data, connections, history
- **Auth** - OAuth2 with Google/GitHub
- **Storage** - File backups and version snapshots
- **Row-Level Security** - Multi-tenant data isolation

---

### 5. State Management

#### Zustand Stores
```typescript
// Global application state
- userStore        // User session and preferences
- connectionStore  // Active FTP/S3 connections
- editorStore      // Open tabs and file content
- aiStore          // AI conversation history
```

---

## Data Flow

### File Editing Flow
```
1. User selects file in FileExplorer
   ↓
2. FTP/S3 client fetches file content
   ↓
3. Content loads into Monaco Editor
   ↓
4. User edits → Auto-save triggers
   ↓
5. Changes pushed to remote server
   ↓
6. Version snapshot saved to Supabase
```

### AI Assistance Flow
```
1. User sends query in AI Assistant pane
   ↓
2. Current file context + cursor position collected
   ↓
3. API route proxies request to selected AI provider
   ↓
4. AI response streamed back to UI
   ↓
5. User can apply suggestions directly to editor
```

---

## Security Architecture

### Credential Encryption
- FTP/S3 credentials encrypted using AES-256
- Encryption keys stored in environment variables
- Never exposed to client-side code

### Authentication Flow
1. User logs in via Supabase Auth (OAuth2)
2. JWT token stored in HTTP-only cookie
3. All API requests validated with token
4. Role-based access enforced at DB level

### File Access Control
- Users can only access their own connections
- Shared projects use team-based permissions
- Audit logs track all file modifications

---

## Deployment Architecture

### Recommended Stack
```
Frontend:    Vercel / Netlify (Edge Network)
Backend API: Fly.io / AWS Lambda (serverless)
Database:    Supabase (managed PostgreSQL)
Storage:     S3-compatible bucket
AI:          OpenAI API / Claude API / Self-hosted Ollama
```

### Environment Variables
See `.env.example` for required configuration:
- Supabase credentials
- AI provider API keys
- S3 bucket configuration
- Security keys

---

## Performance Optimizations

### Code Splitting
- Monaco Editor lazy-loaded via dynamic import
- AI provider SDKs loaded on-demand
- Route-based code splitting with Next.js

### Caching Strategy
- File tree cached in browser localStorage
- API responses cached with SWR
- Monaco editor models reused across tabs

### Real-time Features
- WebSocket connection for collaborative editing (future)
- Optimistic UI updates for file operations
- Debounced auto-save (500ms delay)

---

## Future Enhancements

### Phase 2
- [ ] Real-time collaboration (multi-user editing)
- [ ] Git integration (commit/push/pull)
- [ ] Plugin system for custom AI modes
- [ ] Mobile responsive design

### Phase 3
- [ ] Self-hosted deployment option
- [ ] Custom AI model fine-tuning
- [ ] Advanced project templates
- [ ] CI/CD pipeline integration

---

## Development Guidelines

### Code Style
- Follow TypeScript strict mode
- Use ESLint + Prettier for formatting
- Component naming: PascalCase
- Utilities: camelCase

### Testing Strategy
- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Playwright
- AI integration mocks for deterministic tests

### Git Workflow
- `main` - production-ready code
- `develop` - integration branch
- Feature branches: `feature/feature-name`
- Commit format: Conventional Commits

---

**Last Updated:** 2025-11-01  
**Maintainer:** EzEdit Team
