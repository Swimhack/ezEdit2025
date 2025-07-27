import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { User, FileNode, FTPConnection, EditHistory, AIConversation, AppSettings, LayoutState, EditorState, NotificationState } from '@/types'

// Auth Store
interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ loading }),
      logout: () => set({ user: null }),
    }),
    { name: 'auth-store' }
  )
)

// FTP Connections Store
interface FTPState {
  connections: FTPConnection[]
  activeConnection: FTPConnection | null
  connecting: boolean
  setConnections: (connections: FTPConnection[]) => void
  setActiveConnection: (connection: FTPConnection | null) => void
  addConnection: (connection: FTPConnection) => void
  updateConnection: (id: string, updates: Partial<FTPConnection>) => void
  removeConnection: (id: string) => void
  setConnecting: (connecting: boolean) => void
}

export const useFTPStore = create<FTPState>()(
  devtools(
    immer((set) => ({
      connections: [],
      activeConnection: null,
      connecting: false,
      setConnections: (connections) => set({ connections }),
      setActiveConnection: (connection) => set({ activeConnection: connection }),
      addConnection: (connection) =>
        set((state) => {
          state.connections.push(connection)
        }),
      updateConnection: (id, updates) =>
        set((state) => {
          const index = state.connections.findIndex((c) => c.id === id)
          if (index !== -1) {
            Object.assign(state.connections[index], updates)
          }
          if (state.activeConnection?.id === id) {
            Object.assign(state.activeConnection, updates)
          }
        }),
      removeConnection: (id) =>
        set((state) => {
          state.connections = state.connections.filter((c) => c.id !== id)
          if (state.activeConnection?.id === id) {
            state.activeConnection = null
          }
        }),
      setConnecting: (connecting) => set({ connecting }),
    })),
    { name: 'ftp-store' }
  )
)

// File System Store
interface FileSystemState {
  files: Record<string, FileNode[]> // keyed by connection ID
  expandedFolders: Set<string>
  loading: boolean
  setFiles: (connectionId: string, files: FileNode[]) => void
  addFile: (connectionId: string, file: FileNode) => void
  updateFile: (connectionId: string, fileId: string, updates: Partial<FileNode>) => void
  removeFile: (connectionId: string, fileId: string) => void
  toggleFolder: (folderId: string) => void
  setLoading: (loading: boolean) => void
  clearFiles: (connectionId: string) => void
}

export const useFileSystemStore = create<FileSystemState>()(
  devtools(
    immer((set) => ({
      files: {},
      expandedFolders: new Set(),
      loading: false,
      setFiles: (connectionId, files) =>
        set((state) => {
          state.files[connectionId] = files
        }),
      addFile: (connectionId, file) =>
        set((state) => {
          if (!state.files[connectionId]) {
            state.files[connectionId] = []
          }
          state.files[connectionId].push(file)
        }),
      updateFile: (connectionId, fileId, updates) =>
        set((state) => {
          const files = state.files[connectionId]
          if (files) {
            const index = files.findIndex((f) => f.id === fileId)
            if (index !== -1) {
              Object.assign(files[index], updates)
            }
          }
        }),
      removeFile: (connectionId, fileId) =>
        set((state) => {
          const files = state.files[connectionId]
          if (files) {
            state.files[connectionId] = files.filter((f) => f.id !== fileId)
          }
        }),
      toggleFolder: (folderId) =>
        set((state) => {
          if (state.expandedFolders.has(folderId)) {
            state.expandedFolders.delete(folderId)
          } else {
            state.expandedFolders.add(folderId)
          }
        }),
      setLoading: (loading) => set({ loading }),
      clearFiles: (connectionId) =>
        set((state) => {
          delete state.files[connectionId]
        }),
    })),
    { name: 'file-system-store' }
  )
)

// Editor Store
interface EditorStoreState extends EditorState {
  setOpenFiles: (files: FileNode[]) => void
  addOpenFile: (file: FileNode) => void
  removeOpenFile: (fileId: string) => void
  setActiveFile: (fileId: string | undefined) => void
  updateFileContent: (fileId: string, content: string) => void
  saveFile: (fileId: string) => void
  hasUnsavedChanges: (fileId: string) => boolean
  setCursorPosition: (fileId: string, line: number, column: number) => void
}

export const useEditorStore = create<EditorStoreState>()(
  devtools(
    immer((set, get) => ({
      open_files: [],
      active_file_id: undefined,
      unsaved_changes: {},
      cursor_position: {},
      setOpenFiles: (files) =>
        set((state) => {
          state.open_files = files
        }),
      addOpenFile: (file) =>
        set((state) => {
          if (!state.open_files.find((f) => f.id === file.id)) {
            state.open_files.push(file)
          }
          state.active_file_id = file.id
        }),
      removeOpenFile: (fileId) =>
        set((state) => {
          state.open_files = state.open_files.filter((f) => f.id !== fileId)
          delete state.unsaved_changes[fileId]
          delete state.cursor_position[fileId]
          if (state.active_file_id === fileId) {
            state.active_file_id = state.open_files[0]?.id
          }
        }),
      setActiveFile: (fileId) =>
        set((state) => {
          state.active_file_id = fileId
        }),
      updateFileContent: (fileId, content) =>
        set((state) => {
          state.unsaved_changes[fileId] = content
        }),
      saveFile: (fileId) =>
        set((state) => {
          const file = state.open_files.find((f) => f.id === fileId)
          if (file && state.unsaved_changes[fileId]) {
            file.content = state.unsaved_changes[fileId]
            delete state.unsaved_changes[fileId]
          }
        }),
      hasUnsavedChanges: (fileId) => {
        const state = get()
        return fileId in state.unsaved_changes
      },
      setCursorPosition: (fileId, line, column) =>
        set((state) => {
          state.cursor_position[fileId] = { line, column }
        }),
    })),
    { name: 'editor-store' }
  )
)

// AI Store
interface AIState {
  conversations: AIConversation[]
  activeConversation: AIConversation | null
  loading: boolean
  streaming: boolean
  setConversations: (conversations: AIConversation[]) => void
  setActiveConversation: (conversation: AIConversation | null) => void
  addConversation: (conversation: AIConversation) => void
  updateConversation: (id: string, updates: Partial<AIConversation>) => void
  removeConversation: (id: string) => void
  setLoading: (loading: boolean) => void
  setStreaming: (streaming: boolean) => void
}

export const useAIStore = create<AIState>()(
  devtools(
    immer((set) => ({
      conversations: [],
      activeConversation: null,
      loading: false,
      streaming: false,
      setConversations: (conversations) => set({ conversations }),
      setActiveConversation: (conversation) => set({ activeConversation: conversation }),
      addConversation: (conversation) =>
        set((state) => {
          state.conversations.unshift(conversation)
          state.activeConversation = conversation
        }),
      updateConversation: (id, updates) =>
        set((state) => {
          const index = state.conversations.findIndex((c) => c.id === id)
          if (index !== -1) {
            Object.assign(state.conversations[index], updates)
          }
          if (state.activeConversation?.id === id) {
            Object.assign(state.activeConversation, updates)
          }
        }),
      removeConversation: (id) =>
        set((state) => {
          state.conversations = state.conversations.filter((c) => c.id !== id)
          if (state.activeConversation?.id === id) {
            state.activeConversation = state.conversations[0] || null
          }
        }),
      setLoading: (loading) => set({ loading }),
      setStreaming: (streaming) => set({ streaming }),
    })),
    { name: 'ai-store' }
  )
)

// Settings Store
interface SettingsState extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void
  resetSettings: () => void
}

const defaultSettings: AppSettings = {
  theme: 'system',
  editor_theme: 'vs-dark',
  font_size: 14,
  font_family: 'JetBrains Mono',
  auto_save: true,
  auto_save_delay: 2000,
  show_minimap: true,
  word_wrap: true,
  ai_provider: 'openai',
  ai_model: 'gpt-4',
}

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      immer((set) => ({
        ...defaultSettings,
        updateSettings: (settings) =>
          set((state) => {
            Object.assign(state, settings)
          }),
        resetSettings: () => set(defaultSettings),
      })),
      {
        name: 'settings-store',
      }
    ),
    { name: 'settings-store' }
  )
)

// Layout Store
interface LayoutStoreState extends LayoutState {
  updateLayout: (layout: Partial<LayoutState>) => void
  toggleFileExplorer: () => void
  toggleAIAssistant: () => void
  resetLayout: () => void
}

const defaultLayout: LayoutState = {
  file_explorer_width: 300,
  ai_assistant_width: 400,
  show_file_explorer: true,
  show_ai_assistant: true,
}

export const useLayoutStore = create<LayoutStoreState>()(
  devtools(
    persist(
      immer((set) => ({
        ...defaultLayout,
        updateLayout: (layout) =>
          set((state) => {
            Object.assign(state, layout)
          }),
        toggleFileExplorer: () =>
          set((state) => {
            state.show_file_explorer = !state.show_file_explorer
          }),
        toggleAIAssistant: () =>
          set((state) => {
            state.show_ai_assistant = !state.show_ai_assistant
          }),
        resetLayout: () => set(defaultLayout),
      })),
      {
        name: 'layout-store',
      }
    ),
    { name: 'layout-store' }
  )
)

// Notifications Store
interface NotificationStoreState extends NotificationState {
  addNotification: (notification: Omit<NotificationState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAll: () => void
}

export const useNotificationStore = create<NotificationStoreState>()(
  devtools(
    immer((set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => {
          const id = Math.random().toString(36).substr(2, 9)
          state.notifications.unshift({
            ...notification,
            id,
            timestamp: new Date().toISOString(),
            read: false,
          })
          // Keep only last 50 notifications
          if (state.notifications.length > 50) {
            state.notifications = state.notifications.slice(0, 50)
          }
        }),
      removeNotification: (id) =>
        set((state) => {
          state.notifications = state.notifications.filter((n) => n.id !== id)
        }),
      markAsRead: (id) =>
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          if (notification) {
            notification.read = true
          }
        }),
      clearAll: () =>
        set((state) => {
          state.notifications = []
        }),
    })),
    { name: 'notification-store' }
  )
)