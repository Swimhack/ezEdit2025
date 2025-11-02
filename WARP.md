# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**EzEdit v2** is a browser-based AI-assisted website editor that combines Monaco Editor, FTP/S3 integration, and multi-AI provider support. The application provides a three-pane interface (File Explorer, Code Editor, AI Assistant) for editing remote files with real-time AI assistance.

## Development Commands

### Core Commands
```bash
# Start development server on http://localhost:3000
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code (uses ESLint with Next.js config)
npm run lint
```

### Notes
- No test framework is currently configured
- No type-check script exists; run `npx tsc --noEmit` manually if needed
- React Compiler is enabled in next.config.ts

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router (React 19, TypeScript 5)
- **Styling**: TailwindCSS 4 with ShadCN UI components
- **Editor**: Monaco Editor (@monaco-editor/react)
- **State Management**: Zustand (installed but not yet implemented)
- **Layout**: react-resizable-panels for three-pane interface
- **AI Providers**: OpenAI, Anthropic Claude, Ollama
- **Storage**: FTP/SFTP (basic-ftp, ssh2-sftp-client), AWS S3, Supabase
- **Auth**: Supabase Auth

### Application Structure

```
app/
├── page.tsx          # Root page renders EditorLayout
├── layout.tsx        # Root layout with Geist fonts
└── globals.css       # Global styles

components/
├── EditorLayout.tsx              # Main three-pane layout wrapper
├── file-explorer/FileExplorer.tsx  # Left pane: FTP/S3 file browser
├── editor/CodeEditor.tsx           # Center pane: Monaco editor
├── ai-assistant/AIAssistant.tsx    # Right pane: AI chat interface
└── ui/                             # ShadCN UI components

lib/
├── ai/         # AI provider integrations (not yet implemented)
├── ftp/        # FTP/SFTP clients (not yet implemented)
├── storage/    # Storage adapters (not yet implemented)
├── supabase/   # Supabase client (not yet implemented)
└── utils.ts    # Utility functions (ShadCN helper)

types/
└── index.ts    # Comprehensive TypeScript definitions for entire app
```

### Key Type Definitions

All types are centralized in `types/index.ts`:
- **File System**: FileNode, FileContent
- **Connections**: FTPConnection, S3Connection, ConnectionType
- **AI**: AIProvider, AIMode, AIMessage, AIConfig, AIRequest
- **Editor**: EditorTab, EditorState
- **Auth**: User, UserRole
- **Deploy**: DeploymentConfig, FileVersion, DeploymentLog
- **App State**: AppState (global application state structure)

### Component Architecture

**EditorLayout** (components/EditorLayout.tsx)
- Client component using ResizablePanelGroup
- Three-pane layout: FileExplorer (20%) | CodeEditor (50%) | AIAssistant (30%)
- Resizable with minimum/maximum size constraints

**FileExplorer** (components/file-explorer/FileExplorer.tsx)
- Currently a placeholder showing connection button
- Will implement FTP/S3 connection and file tree browsing

**CodeEditor** (components/editor/CodeEditor.tsx)
- Monaco Editor with VS Code experience
- Tab-based interface (currently shows "Welcome" tab)
- Configured with minimap, line numbers, 80-char ruler
- Auto-save and syntax highlighting planned

**AIAssistant** (components/ai-assistant/AIAssistant.tsx)
- Provider selection: OpenAI GPT-5, Claude Code, Ollama 3
- AI Modes: explain, refactor, seo, debug, deploy, rollback
- Chat interface with textarea input (Enter to send, Shift+Enter for newline)

## Environment Setup

Required environment variables (see `.env.example`):
- **Supabase**: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- **AI**: OPENAI_API_KEY, ANTHROPIC_API_KEY, OLLAMA_API_URL
- **AWS S3**: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME
- **Security**: FTP_ENCRYPTION_KEY, NEXTAUTH_SECRET

Create `.env.local` from `.env.example` and populate with actual credentials.

## Path Aliases

Uses `@/*` alias mapping to project root (configured in tsconfig.json).

Example: `import { Button } from '@/components/ui/button'`

## Development Patterns

### Client Components
All interactive components use `'use client'` directive since they rely on React hooks (useState, etc.).

### State Management
Zustand is installed but not yet implemented. When implementing state:
- Create stores in `lib/` directory
- Follow the AppState type structure from `types/index.ts`
- Consider stores for: connections, file tree, editor state, AI messages

### AI Integration
When implementing AI features:
- Use AIRequest type with proper context (files, selection, cursorPosition)
- Support all AI modes defined in types (explain, refactor, seo, debug, deploy, rollback)
- Handle multi-provider switching (OpenAI, Anthropic, Ollama)

### File Operations
When implementing FTP/S3:
- Use Connection types from `types/index.ts`
- Encrypt credentials using FTP_ENCRYPTION_KEY
- Build FileNode tree structures for file explorer
- Implement auto-save functionality in editor

## Code Style

- TypeScript strict mode enabled
- Use React 19 features (jsx transform uses react-jsx)
- Follow ShadCN UI patterns for components
- Prefer interface over type for object definitions (see types/index.ts)
- Use Geist Sans for UI, Geist Mono for code

## Security Considerations

- Credentials must be encrypted before storage (FTP_ENCRYPTION_KEY)
- Implement Row-Level Security when using Supabase
- Use NEXTAUTH_SECRET for authentication
- Never expose service role keys in client-side code
- Implement audit logging for file modifications

## Known Limitations

- No test suite currently configured
- Type-check script not in package.json
- Core functionality (FTP, S3, AI integration) not yet implemented
- Authentication system not yet integrated
- Deployment and rollback features planned but not built
