# EzEdit v2 - Architecture Documentation

## System Overview

EzEdit v2 is a browser-based AI-assisted website editor built as a single-page application (SPA) using Next.js 16 with the App Router. The architecture follows a client-heavy design where most business logic runs in the browser, with API routes handling server-side operations like AI requests, FTP connections, and database operations.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              EditorLayout (Main UI)                    │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │  File    │  │    Monaco    │  │      AI      │   │  │
│  │  │ Explorer │  │    Editor    │  │  Assistant   │   │  │
│  │  │          │  │              │  │              │   │  │
│  │  └────┬─────┘  └──────┬───────┘  └──────┬───────┘   │  │
│  │       │                │                  │            │  │
│  │       └────────────────┼──────────────────┘            │  │
│  │                        │                               │  │
│  │                 Zustand State Store                    │  │
│  └────────────────────────┼───────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
                    HTTP/WebSocket
                              │
┌─────────────────────────────┼───────────────────────────────┐
│                    Next.js Server (API)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    API Routes                          │  │
│  │  /api/ftp/*    /api/ai/*    /api/storage/*           │  │
│  └───┬────────────────┬────────────────┬──────────────┬──┘  │
│      │                │                │              │     │
│  ┌───▼────┐  ┌────────▼──────┐  ┌─────▼──────┐  ┌───▼───┐ │
│  │  FTP   │  │   AI Clients  │  │  S3 Client │  │Supabase│ │
│  │ Client │  │OpenAI/Claude  │  │            │  │ Client │ │
│  └────────┘  └───────────────┘  └────────────┘  └────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼─────┐     ┌────────▼───────┐    ┌──────▼──────┐
    │   FTP/   │     │   AI Services  │    │  Supabase   │
    │   SFTP   │     │  OpenAI/Claude │    │ PostgreSQL  │
    │  Servers │     │     Ollama     │    │   Storage   │
    └──────────┘     └────────────────┘    └─────────────┘
```

## Core Components

### 1. Frontend Architecture

#### EditorLayout (Main Container)
- **Location**: `components/EditorLayout.tsx`
- **Purpose**: Root layout component managing three-pane interface
- **Technology**: react-resizable-panels for dynamic resizing
- **State**: Local state for panel sizes, connects to Zustand stores

#### File Explorer
- **Location**: `components/file-explorer/`
- **Responsibilities**:
  - Display file tree from FTP/S3/Local connections
  - Handle file operations (upload, delete, rename)
  - Context menu for AI operations
  - Connection management UI
- **State**: File tree structure, active connection, selected files

#### Monaco Editor
- **Location**: `components/editor/`
- **Responsibilities**:
  - Code editing with syntax highlighting
  - Tab management for multiple files
  - Auto-save functionality
  - Integration with AI for code completion
- **Technology**: @monaco-editor/react
- **State**: Open tabs, active file, cursor position, dirty state

#### AI Assistant
- **Location**: `components/ai-assistant/`
- **Responsibilities**:
  - Chat interface for AI interactions
  - AI provider selection (OpenAI, Claude, Ollama)
  - Mode selection (explain, refactor, debug, etc.)
  - Display AI responses with code formatting
- **State**: Message history, active provider, selected mode

### 2. State Management (Zustand)

#### Store Structure
```typescript
// Planned stores in lib/stores/

// Connection Store
useConnectionStore: {
  connections: Connection[];
  activeConnection: Connection | null;
  connect: (config) => Promise<void>;
  disconnect: () => void;
}

// File Tree Store
useFileTreeStore: {
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  loadDirectory: (path: string) => Promise<void>;
  refreshTree: () => Promise<void>;
}

// Editor Store
useEditorStore: {
  tabs: EditorTab[];
  activeTabId: string | null;
  openFile: (path: string) => Promise<void>;
  closeTab: (tabId: string) => void;
  saveFile: (tabId: string) => Promise<void>;
  updateContent: (tabId: string, content: string) => void;
}

// AI Store
useAIStore: {
  messages: AIMessage[];
  provider: AIProvider;
  mode: AIMode;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  setProvider: (provider: AIProvider) => void;
  setMode: (mode: AIMode) => void;
}
```

### 3. Backend Services (API Routes)

#### FTP/SFTP Service
- **Routes**: `/api/ftp/*`
- **Endpoints**:
  - `POST /api/ftp/connect` - Establish connection
  - `GET /api/ftp/list?path=` - List directory contents
  - `GET /api/ftp/file?path=` - Read file content
  - `PUT /api/ftp/file` - Write file content
  - `DELETE /api/ftp/file?path=` - Delete file
  - `POST /api/ftp/upload` - Upload file
- **Libraries**: basic-ftp, ssh2-sftp-client
- **Security**: Credentials stored encrypted in Supabase

#### AI Service
- **Routes**: `/api/ai/*`
- **Endpoints**:
  - `POST /api/ai/chat` - Send message to AI
  - `POST /api/ai/complete` - Code completion
  - `POST /api/ai/explain` - Explain code
  - `POST /api/ai/refactor` - Refactor code
- **Providers**:
  - OpenAI (openai SDK)
  - Anthropic (anthropic-ai SDK)
  - Ollama (direct HTTP calls)
- **Context Management**: Includes relevant files, cursor position, selection

#### Storage Service
- **Routes**: `/api/storage/*`
- **Endpoints**:
  - `POST /api/storage/connect` - Connect to S3
  - `GET /api/storage/list` - List bucket contents
  - `GET /api/storage/object` - Get object
  - `PUT /api/storage/object` - Upload object
- **Library**: @aws-sdk/client-s3
- **Features**: Supports S3-compatible services (AWS, DigitalOcean, etc.)

#### Auth Service
- **Routes**: `/api/auth/*`
- **Provider**: Supabase Auth
- **Methods**: Email/Password, Google OAuth
- **Session**: JWT tokens, stored in httpOnly cookies
- **Middleware**: Route protection, role verification

### 4. Data Flow Patterns

#### File Editing Flow
```
1. User clicks file in File Explorer
   └─> FileExplorer dispatches openFile()
       └─> useEditorStore.openFile(path)
           └─> API call: GET /api/ftp/file?path={path}
               └─> FTP client fetches file
                   └─> Returns file content
                       └─> Store creates new EditorTab
                           └─> Monaco Editor renders content

2. User edits file in Monaco
   └─> onChange event
       └─> useEditorStore.updateContent(tabId, content)
           └─> Tab marked as dirty
               └─> Auto-save timer started (debounced 2s)

3. Auto-save triggers
   └─> useEditorStore.saveFile(tabId)
       └─> API call: PUT /api/ftp/file
           └─> FTP client writes file
               └─> Tab marked as clean
                   └─> UI indicator updated
```

#### AI Interaction Flow
```
1. User types message in AI Assistant
   └─> User presses Enter
       └─> useAIStore.sendMessage(content)
           └─> Gathers context:
               - Active file content
               - Selected text
               - Cursor position
               - File tree structure
           └─> API call: POST /api/ai/chat
               └─> AI provider processes request
                   └─> Streams response back
                       └─> Updates useAIStore.messages
                           └─> UI displays response

2. AI suggests code change
   └─> User clicks "Apply"
       └─> useEditorStore.updateContent(tabId, newContent)
           └─> Monaco Editor updates
               └─> Auto-save triggers
```

### 5. Type System

All types are centralized in `types/index.ts` and organized by domain:

- **File System**: FileNode, FileContent
- **Connections**: FTPConnection, S3Connection, ConnectionType
- **AI**: AIProvider, AIMode, AIMessage, AIConfig, AIRequest, AIContextFile
- **Editor**: EditorTab, EditorState
- **User & Auth**: User, UserRole
- **Deployment**: DeploymentConfig, FileVersion, DeploymentLog
- **Application**: AppState, PaneSize, ThemeConfig

This centralized approach ensures type consistency across the application.

### 6. Security Architecture

#### Authentication Flow
```
1. User visits app
   └─> Check for valid session (Supabase)
       └─> If valid: Load user data
       └─> If invalid: Redirect to login

2. User logs in
   └─> Submit credentials
       └─> Supabase Auth validates
           └─> Returns JWT token
               └─> Store in httpOnly cookie
                   └─> Redirect to editor
```

#### Credential Management
```
1. User adds FTP connection
   └─> Enter credentials in UI
       └─> API call: POST /api/connections
           └─> Encrypt with FTP_ENCRYPTION_KEY
               └─> Store in Supabase with user_id
                   └─> Return connection ID only

2. User connects to FTP
   └─> Select connection
       └─> API call: POST /api/ftp/connect
           └─> Fetch encrypted credentials
               └─> Decrypt server-side
                   └─> Establish FTP connection
                       └─> Return session token (not credentials)
```

#### Row-Level Security (Supabase)
```sql
-- Users can only see their own connections
CREATE POLICY "Users can view own connections"
ON connections FOR SELECT
USING (auth.uid() = user_id);

-- Users can only modify their own files
CREATE POLICY "Users can edit own file versions"
ON file_versions FOR ALL
USING (auth.uid() = user_id);
```

### 7. Performance Optimizations

#### Code Splitting
- Monaco Editor: Dynamically imported to reduce initial bundle
- AI SDK clients: Lazy loaded based on selected provider
- Heavy components: Use React.lazy() and Suspense

#### Caching Strategy
- File tree: Cache in Zustand store, refresh on demand
- File content: Cache open tabs, invalidate on external changes
- AI responses: Store in IndexedDB for session persistence

#### Debouncing
- Auto-save: 2-second debounce
- File tree search: 300ms debounce
- AI code completion: 500ms debounce

### 8. Error Handling

#### Client-Side Errors
```typescript
try {
  await useEditorStore.getState().saveFile(tabId);
} catch (error) {
  if (error.code === 'FTP_TIMEOUT') {
    toast.error('Connection timeout. Please reconnect.');
  } else if (error.code === 'PERMISSION_DENIED') {
    toast.error('Permission denied. Check file permissions.');
  } else {
    toast.error('Failed to save file.');
    console.error(error);
  }
}
```

#### API Error Responses
```typescript
// Standardized error format
{
  error: {
    code: 'FTP_CONNECTION_FAILED',
    message: 'Could not connect to FTP server',
    details: 'Connection timeout after 10 seconds'
  }
}
```

### 9. Deployment Architecture

#### Production Deployment
- **Platform**: Vercel (recommended) or AWS EC2
- **Environment**: Node.js 18+ runtime
- **Build**: `npm run build` generates optimized production bundle
- **Assets**: Static assets served via CDN
- **API Routes**: Serverless functions on Vercel, or Express server on EC2

#### Environment Configuration
- **Development**: `.env.local`
- **Production**: Environment variables set in platform dashboard
- **Secrets**: Encrypted at rest, never logged

### 10. Future Enhancements

#### WebSocket Integration
Real-time file change notifications when multiple users edit same file.

#### IndexedDB Storage
Cache file content locally for offline editing capabilities.

#### Web Workers
Move heavy operations (syntax parsing, large file operations) to background threads.

#### Progressive Web App (PWA)
Add service worker for offline functionality and installable app.

## Diagram: Component Communication

```
┌─────────────────┐
│  File Explorer  │
└────────┬────────┘
         │ selectFile(path)
         ▼
┌─────────────────┐
│  Editor Store   │◄────────────┐
└────────┬────────┘             │
         │ openFile(path)       │ updateContent()
         ▼                      │
┌─────────────────┐             │
│  FTP API Route  │             │
└────────┬────────┘             │
         │ fetch file           │
         ▼                      │
┌─────────────────┐      ┌──────────────┐
│  Monaco Editor  │──────│ AI Assistant │
└─────────────────┘      └──────┬───────┘
                                │ sendPrompt()
                                ▼
                         ┌──────────────┐
                         │  AI API      │
                         └──────────────┘
```

## Conclusion

EzEdit v2's architecture prioritizes developer experience, security, and extensibility. The separation of concerns between UI components, state management, and API services allows for independent development and testing of each layer.
