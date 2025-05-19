// Direct import of zod
import { z } from 'zod';
export { z };

export const SiteSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(), 
  name: z.string(),
  host: z.string(),
  username: z.string(),
  password: z.string(),
  root_path: z.string().default('/'),
  created_at: z.string().datetime(),
});

export const FileMetaSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['file', 'dir']),
  size: z.number().optional(),
  modified: z.string().datetime().optional(),
  children: z.array(z.lazy(() => FileMetaSchema)).optional(),
});

// Define types directly instead of using z.infer to avoid TypeScript errors
export interface Site {
  id: string;
  owner_id: string;
  name: string;
  host: string;
  username: string;
  password: string;
  root_path: string;
  created_at: string;
}

export interface FileMeta {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  modified?: string;
  children?: FileMeta[];
}

// Add common FTP types to ensure they're available
export const FTPConfigSchema = z.object({
  host: z.string(),
  user: z.string(),
  pass: z.string(),
  port: z.number().optional().default(21),
  secure: z.boolean().optional().default(false),
  rootPath: z.string().default('/'),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
});

export interface FTPConfigType {
  host: string;
  user: string;
  pass: string;
  port?: number;
  secure?: boolean;
  rootPath: string;
  timeout: number;
  retries: number;
}

// API related schemas
export const SiteCredSchema = z.object({
  host: z.string(),
  username: z.string(),
  password: z.string(),
  port: z.number().optional().default(21),
  secure: z.boolean().optional().default(false),
  root_path: z.string().optional().default('/'),
});

export interface SiteCred {
  host: string;
  username: string;
  password: string;
  port?: number;
  secure?: boolean;
  root_path?: string;
}

export const ListResSchema = z.object({
  items: z.array(FileMetaSchema),
  path: z.string(),
});

export interface ListRes {
  items: FileMeta[];
  path: string;
}

export const ContentResSchema = z.object({
  content: z.string(),
  path: z.string(),
});

export interface ContentRes {
  content: string;
  path: string;
}

export const SaveReqSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export interface SaveReq {
  path: string;
  content: string;
}

export const RefactorReqSchema = z.object({
  path: z.string(),
  content: z.string(),
  instruction: z.string(),
});

export interface RefactorReq {
  path: string;
  content: string;
  instruction: string;
}

export const RefactorResSchema = z.object({
  content: z.string(),
  diff: z.string().optional(),
});

export interface RefactorRes {
  content: string;
  diff?: string;
}
