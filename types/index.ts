// ==================== File System Types ====================

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  modifiedAt?: Date;
  children?: FileNode[];
  isLoading?: boolean;
  isExpanded?: boolean;
}

export interface FileContent {
  path: string;
  content: string;
  language: string;
  encoding?: string;
}

// ==================== Connection Types ====================

export type ConnectionType = 'ftp' | 'sftp' | 's3' | 'local' | 'wordpress' | 'wix';

export interface FTPConnection {
  id: string;
  name: string;
  type: 'ftp' | 'sftp';
  host: string;
  port: number;
  username: string;
  password: string;
  secure?: boolean;
  basePath?: string;
}

export interface S3Connection {
  id: string;
  name: string;
  type: 's3';
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

export interface WordPressConnection {
  id: string;
  name: string;
  type: 'wordpress';
  siteUrl: string;
  username: string;
  applicationPassword: string;
  basePath?: string;
}

export interface WixConnection {
  id: string;
  name: string;
  type: 'wix';
  siteId: string;
  apiKey: string;
  refreshToken?: string;
}

export type Connection = FTPConnection | S3Connection | WordPressConnection | WixConnection;

// ==================== AI Types ====================

export type AIProvider = 'openai' | 'anthropic' | 'ollama';

export type AIMode = 
  | 'explain'
  | 'refactor'
  | 'seo'
  | 'debug'
  | 'deploy'
  | 'rollback'
  | 'general';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  mode?: AIMode;
}

export interface AIConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIContextFile {
  path: string;
  content: string;
  language: string;
}

export interface AIRequest {
  messages: AIMessage[];
  mode: AIMode;
  config: AIConfig;
  context?: {
    files?: AIContextFile[];
    selection?: string;
    cursorPosition?: { line: number; column: number };
  };
}

// ==================== Editor Types ====================

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
  cursorPosition?: { line: number; column: number };
}

export interface EditorState {
  tabs: EditorTab[];
  activeTabId: string | null;
}

// ==================== User & Auth Types ====================

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
}

export type UserRole = 'admin' | 'developer' | 'editor' | 'viewer';

// ==================== Deploy & History Types ====================

export interface DeploymentConfig {
  connectionId: string;
  targetPath: string;
  autoBackup: boolean;
  notification?: boolean;
}

export interface FileVersion {
  id: string;
  filePath: string;
  content: string;
  userId: string;
  timestamp: Date;
  message?: string;
}

export interface DeploymentLog {
  id: string;
  userId: string;
  connectionId: string;
  files: string[];
  status: 'pending' | 'success' | 'failed';
  timestamp: Date;
  error?: string;
}

// ==================== Application State Types ====================

export interface AppState {
  user: User | null;
  connections: Connection[];
  activeConnection: Connection | null;
  fileTree: FileNode[];
  editorState: EditorState;
  aiMessages: AIMessage[];
  isLoading: boolean;
  error: string | null;
}

// ==================== UI Types ====================

export interface PaneSize {
  fileExplorer: number;
  editor: number;
  aiAssistant: number;
}

export interface ThemeConfig {
  mode: 'light' | 'dark';
  editorTheme: 'vs-dark' | 'vs-light';
}
