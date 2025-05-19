// Define explicit interfaces instead of using Zod inferences

/* ——— core entities ——— */
export interface SiteCred {
  host: string;
  username: string;
  password: string;
  rootPath: string;
}

export interface FileMeta {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  mtime: number; // epoch ms
}

/* ——— request/response shapes ——— */
export type ConnectReq = SiteCred; // POST /connect
export interface ConnectRes {
  ok: boolean;
  error?: string;
}

export interface ListReq {
  root: string;
}
export type ListRes = FileMeta[];

export interface ContentReq {
  path: string;
}
export interface ContentRes {
  data: string | Buffer;
}

export interface SaveReq {
  path: string;
  content: string;
}
export interface SaveRes {
  ok: boolean;
  error?: string;
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

// Add FTP-related types that match the API endpoints mentioned in memories
export interface FTPResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// These types align with the API endpoints from the memories
export interface FTPConnection {
  host: string;
  username: string;
  password: string;
  port?: number;
  secure?: boolean;
  root_path?: string;
}

export interface FTPListItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: string;
  path: string;
}
