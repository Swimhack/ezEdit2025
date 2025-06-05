import express from 'express';
import type { Request, Response } from 'express';
import { Client } from 'basic-ftp';
import { z } from 'zod';
import { Readable } from 'stream';

const router = express.Router();

/**
 * Retry Configuration for FTP operations
 */
interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  backoffFactor: 2,
  maxDelayMs: 30000, // 30 seconds
};

/**
 * Sleep for the specified number of milliseconds
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute an operation with retry logic and exponential back-off
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // First attempt (attempt=0) has no delay
      if (attempt > 0) {
        await sleep(delay);
        // Increase the delay for the next attempt (with a max cap)
        delay = Math.min(delay * config.backoffFactor, config.maxDelayMs);
        console.log(`FTP retry attempt ${attempt}/${config.maxRetries} after ${delay}ms delay`);
      }

      // Attempt the operation
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`FTP operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}):`, error);
      
      // If this was the last attempt, we'll throw the error
      if (attempt === config.maxRetries) {
        break;
      }
    }
  }

  // If we get here, all retries failed
  throw lastError;
}

// Site Credentials Schema - this is what we use for FTP connections
const SiteCredSchema = z.object({
  host: z.string(),
  username: z.string(), 
  password: z.string(),
  port: z.number().optional().default(21),
  secure: z.boolean().optional().default(false),
  root_path: z.string().optional().default('/'),
});

// Define TypeScript types for our schemas
type SiteCred = {
  host: string;
  username: string;
  password: string;
  port?: number;
  secure?: boolean;
  root_path?: string;
};

interface FTPListItem {
  name: string;
  type: 'file' | 'dir';
  size?: number;
  modified?: string;
  path: string;
}

// Helper function to format FTP list response
function formatListResponse(items: any[], currentPath: string): FTPListItem[] {
  return items.map(item => ({
    name: item.name,
    type: item.isDirectory ? 'dir' : 'file',
    size: item.size,
    modified: item.modifiedAt?.toISOString(),
    path: currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`,
  }));
}

/**
 * Test connection to an FTP server
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    const credentials: SiteCred = SiteCredSchema.parse(req.body);
    const client = new Client();
    
    try {
      await client.access({
        host: credentials.host,
        user: credentials.username,
        password: credentials.password,
        port: credentials.port,
        secure: credentials.secure
      });
      
      // Test changing to root path if specified
      if (credentials.root_path && credentials.root_path !== '/') {
        await client.cd(credentials.root_path);
      }
      
      client.close();
      res.json({ success: true });
    } catch (error) {
      client.close();
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: 'Invalid credentials format' 
    });
  }
});

/**
 * List files and directories in a path
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const credentials = SiteCredSchema.parse(req.query.credentials);
    const path = String(req.query.path || '/');
    
    const client = new Client();
    client.ftp.verbose = false;
    
    try {
      await client.access({
        host: credentials.host,
        user: credentials.username,
        password: credentials.password,
        port: credentials.port,
        secure: credentials.secure
      });
      
      // Change to root path if specified
      if (credentials.root_path && credentials.root_path !== '/') {
        await client.cd(credentials.root_path);
      }
      
      // Now change to the requested path
      if (path !== '/') {
        await client.cd(path);
      }
      
      const list = await client.list();
      const formattedList = formatListResponse(list, path);
      
      client.close();
      res.json({ 
        success: true, 
        data: { 
          items: formattedList,
          path: path 
        }
      });
    } catch (error) {
      client.close();
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list files' 
      });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: 'Invalid request format' 
    });
  }
});

/**
 * Get file content
 */
router.get('/content', async (req: Request, res: Response) => {
  try {
    const credentials = SiteCredSchema.parse(req.query.credentials);
    const path = String(req.query.path || '/');
    
    if (!path || path === '/') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file path' 
      });
    }
    
    const client = new Client();
    client.ftp.verbose = false;
    
    try {
      await client.access({
        host: credentials.host,
        user: credentials.username,
        password: credentials.password,
        port: credentials.port,
        secure: credentials.secure
      });
      
      // Download the file to memory using a buffer
      const chunks: Buffer[] = [];
      const writable = new (require('stream').Writable)({
        write(chunk: Buffer, _encoding: string, callback: () => void) {
          chunks.push(Buffer.from(chunk));
          callback();
        }
      });
      
      await client.downloadTo(writable, path);
      const content = Buffer.concat(chunks).toString('utf-8');
      
      client.close();
      res.json({ 
        success: true, 
        data: { 
          content: content,
          path: path 
        }
      });
    } catch (error) {
      client.close();
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to download file' 
      });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: 'Invalid request format' 
    });
  }
});

/**
 * Save file content
 */
router.put('/content', async (req: Request, res: Response) => {
  try {
    const credentials = SiteCredSchema.parse(req.body.credentials);
    const { path, content } = req.body;
    
    if (!path || path === '/' || typeof content !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file path or content' 
      });
    }
    
    const client = new Client();
    client.ftp.verbose = false;
    
    try {
      await client.access({
        host: credentials.host,
        user: credentials.username,
        password: credentials.password,
        port: credentials.port,
        secure: credentials.secure
      });
      
      // Upload the content with retry logic
      const buffer = Buffer.from(content);
      
      // Define the upload operation for retry
      await withRetry(async () => {
        // Create a readable stream from the buffer for each attempt
        const readable = Readable.from(buffer);
        return await client.uploadFrom(readable, path);
      }, {
        // Custom retry options can be specified here
        maxRetries: 5,
        initialDelayMs: 1000,
        backoffFactor: 1.5,
        maxDelayMs: 15000
      });
      
      client.close();
      res.json({ 
        success: true,
        data: { path }
      });
    } catch (error) {
      client.close();
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload file' 
      });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: 'Invalid request format' 
    });
  }
});

/**
 * Create a new directory
 */
router.post('/directory', async (req: Request, res: Response) => {
  try {
    const credentials = SiteCredSchema.parse(req.body.credentials);
    const { path } = req.body;
    
    if (!path || path === '/') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid directory path' 
      });
    }
    
    const client = new Client();
    client.ftp.verbose = false;
    
    try {
      await client.access({
        host: credentials.host,
        user: credentials.username,
        password: credentials.password,
        port: credentials.port,
        secure: credentials.secure
      });
      
      // Create the directory
      await client.ensureDir(path);
      
      client.close();
      res.json({ 
        success: true,
        data: { path }
      });
    } catch (error) {
      client.close();
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create directory' 
      });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: 'Invalid request format' 
    });
  }
});

/**
 * Delete a file or directory
 */
router.delete('/:type', async (req: Request, res: Response) => {
  try {
    const credentials = SiteCredSchema.parse(req.body.credentials);
    const { path } = req.body;
    const type = req.params.type;
    
    if (!path || path === '/' || (type !== 'file' && type !== 'directory')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid path or type' 
      });
    }
    
    const client = new Client();
    client.ftp.verbose = false;
    
    try {
      await client.access({
        host: credentials.host,
        user: credentials.username,
        password: credentials.password,
        port: credentials.port,
        secure: credentials.secure
      });
      
      // Delete the file or directory
      if (type === 'file') {
        await client.remove(path);
      } else {
        await client.removeDir(path);
      }
      
      client.close();
      res.json({ 
        success: true,
        data: { path }
      });
    } catch (error) {
      client.close();
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : `Failed to delete ${type}` 
      });
    }
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: 'Invalid request format' 
    });
  }
});

export default router;
