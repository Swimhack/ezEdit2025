// Global type declarations for MCP services

// Define common entry type for both services
interface FileEntry {
  name: string;
  type?: 'file' | 'directory';
  isDirectory?: boolean;
  size?: number;
  lastModified?: string;
}

// Define the structure of the LocalFS MCP service
interface LocalFSService {
  list_directory: (params: { path: string }) => Promise<{ entries: FileEntry[] }>;
  read_file: (params: { path: string }) => Promise<string>;
  write_file: (params: { path: string; content: string }) => Promise<any>;
}

// Define the structure of the FTP MCP service
interface FTPService {
  set_credentials: (params: {
    host: string;
    user: string;
    password: string;
    port?: number;
    secure?: boolean;
    passive?: boolean;
  }) => Promise<any>;
  list_directory: (params: { path: string }) => Promise<{ entries: FileEntry[] }>;
  read_file: (params: { path: string }) => Promise<string>;
  write_file: (params: { path: string; content: string }) => Promise<any>;
  delete_item: (params: { path: string; isDirectory: boolean }) => Promise<any>;
  rename_item: (params: { oldPath: string; newPath: string }) => Promise<any>;
}

// Declare the global MCP object on the Window interface
declare interface Window {
  mcp: {
    localfs: LocalFSService;
    ftp: FTPService;
  }
}
