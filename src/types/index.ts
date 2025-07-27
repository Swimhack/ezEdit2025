export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  subscription_tier?: 'free' | 'single' | 'unlimited'
}

export interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified: string
  content?: string
  language?: string
  parent_id?: string
  children?: FileNode[]
}

export interface FTPConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string
  protocol: 'ftp' | 'sftp'
  user_id: string
  created_at: string
  last_connected?: string
  is_active: boolean
}

export interface EditHistory {
  id: string
  file_path: string
  content: string
  change_type: 'create' | 'update' | 'delete'
  timestamp: string
  user_id: string
  connection_id: string
  file_size: number
  language?: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  context?: {
    file_path?: string
    selected_code?: string
    language?: string
  }
}

export interface AIConversation {
  id: string
  title: string
  messages: AIMessage[]
  created_at: string
  updated_at: string
  user_id: string
}

export interface CodeSuggestion {
  id: string
  type: 'fix' | 'improve' | 'explain' | 'generate'
  title: string
  description: string
  original_code: string
  suggested_code: string
  confidence: number
  file_path: string
  line_start: number
  line_end: number
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  editor_theme: 'vs-light' | 'vs-dark'
  font_size: number
  font_family: string
  auto_save: boolean
  auto_save_delay: number
  show_minimap: boolean
  word_wrap: boolean
  ai_provider: 'openai' | 'claude'
  ai_model: string
}

export interface LayoutState {
  file_explorer_width: number
  ai_assistant_width: number
  show_file_explorer: boolean
  show_ai_assistant: boolean
}

export interface EditorState {
  open_files: FileNode[]
  active_file_id?: string
  unsaved_changes: Record<string, string>
  cursor_position: Record<string, { line: number; column: number }>
}

export interface NotificationState {
  notifications: Notification[]
}

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}