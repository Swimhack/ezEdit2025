/**
 * This file contains Zod schemas for validation
 * These are kept separate from type definitions to avoid circular dependencies
 */
import { z } from 'zod';

// Export z for convenience
export { z };

// Site schema for validation
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

// File schema for validation
export const FileMetaSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.enum(['file', 'dir']),
  size: z.number().optional(),
  modified: z.string().datetime().optional(),
  children: z.array(z.lazy(() => FileMetaSchema)).optional(),
});

// FTP configuration schema
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

// API related schemas for validation
export const SiteCredSchema = z.object({
  host: z.string(),
  username: z.string(),
  password: z.string(),
  port: z.number().optional().default(21),
  secure: z.boolean().optional().default(false),
  root_path: z.string().optional().default('/'),
});

export const ListResSchema = z.object({
  items: z.array(FileMetaSchema),
  path: z.string(),
});

export const ContentResSchema = z.object({
  content: z.string(),
  path: z.string(),
});

export const SaveReqSchema = z.object({
  path: z.string(),
  content: z.string(),
});

export const RefactorReqSchema = z.object({
  path: z.string(),
  content: z.string(),
  instruction: z.string(),
});

export const RefactorResSchema = z.object({
  content: z.string(),
  diff: z.string().optional(),
});
