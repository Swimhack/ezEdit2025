// TypeScript declarations for MCP services - exported types only

// Define common entry type for both services
export interface FileEntry {
  name: string;
  type?: 'file' | 'directory';
  isDirectory?: boolean;
  size?: number;
  lastModified?: string;
}

// Define the structure of the LocalFS MCP service
export interface LocalFSService {
  list_directory: (params: { path: string }) => Promise<{ entries: FileEntry[] }>;
  read_file: (params: { path: string }) => Promise<string>;
  write_file: (params: { path: string; content: string }) => Promise<any>;
}

// Define the structure of the FTP MCP service
export interface FTPService {
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
