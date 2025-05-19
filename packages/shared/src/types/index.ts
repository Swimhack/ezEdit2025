// Define all types explicitly to avoid Zod inference issues

// Site related types
export interface Site {
  id: string;
  owner_id: string;
  name: string;
  host: string;
  username: string;
  password: string;
  port: number;
  secure: boolean;
  root_path: string;
  created_at: string;
}

// File related types
export interface FileMeta {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  modified?: string;
  children?: FileMeta[];
}

// API related types
export interface SiteConnection {
  id: string;
  name: string;
  lastConnected: string;
}

export interface SiteCred {
  host: string;
  username: string;
  password: string;
  port?: number;
  secure?: boolean;
  root_path?: string;
}

export interface ListRes {
  items: FileMeta[];
  path: string;
}

export interface ContentRes {
  content: string;
  path: string;
}

export interface SaveReq {
  path: string;
  content: string;
}

export interface RefactorReq {
  path: string;
  content: string;
  instruction: string;
}

export interface RefactorRes {
  content: string;
  diff?: string;
}

// FTP related types
export interface FTPConfig {
  host: string;
  user: string;
  pass: string;
  port?: number;
  secure?: boolean;
  rootPath: string;
  timeout: number;
  retries: number;
}

export interface FTPListItem {
  name: string;
  type: 'file' | 'dir';
  size?: number;
  modified?: string;
  path: string;
}

export interface FTPResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// For schema validation, you can import the Zod schemas from a separate file
// This way the types can be used without Zod dependencies
export * from '../zod';
