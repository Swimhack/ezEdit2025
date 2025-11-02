import { create } from 'zustand';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  size?: number;
  modified?: Date;
}

interface FileSystemState {
  files: FileNode[];
  expandedFolders: Set<string>;
  selectedFile: string | null;
  isConnected: boolean;
  connectionType: 'ftp' | 'sftp' | 's3' | 'local' | 'wordpress' | 'wix' | null;
  activeConnection: any | null;
  
  setFiles: (files: FileNode[]) => void;
  toggleFolder: (path: string) => void;
  selectFile: (path: string | null) => void;
  setConnected: (connected: boolean, type?: 'ftp' | 'sftp' | 's3' | 'local' | 'wordpress' | 'wix', connection?: any) => void;
  expandFolder: (path: string) => void;
  collapseFolder: (path: string) => void;
  setActiveConnection: (connection: any | null) => void;
}

export const useFileSystemStore = create<FileSystemState>((set) => ({
  files: [],
  expandedFolders: new Set(),
  selectedFile: null,
  isConnected: false,
  connectionType: null,
  activeConnection: null,

  setFiles: (files) => set({ files }),

  toggleFolder: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { expandedFolders: newExpanded };
    }),

  expandFolder: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.add(path);
      return { expandedFolders: newExpanded };
    }),

  collapseFolder: (path) =>
    set((state) => {
      const newExpanded = new Set(state.expandedFolders);
      newExpanded.delete(path);
      return { expandedFolders: newExpanded };
    }),

  selectFile: (path) => set({ selectedFile: path }),

  setConnected: (connected, type, connection) =>
    set({ isConnected: connected, connectionType: type || null, activeConnection: connection || null }),

  setActiveConnection: (connection) => set({ activeConnection: connection }),
}));
