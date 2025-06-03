/**
 * SFTP Client Routes
 * API endpoints for SFTP operations
 */
import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { 
  connectSFTP, 
  disconnectSFTP, 
  listFiles, 
  readFile, 
  writeFile, 
  SftpCredentialsSchema 
} from '../lib/sftpClient';

const router: Router = Router();

/**
 * Test SFTP connection
 * POST /api/sftp-client/connect
 */
router.post('/connect', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const credentials = SftpCredentialsSchema.parse(req.body);
    
    // Connect to SFTP server
    await connectSFTP(credentials);
    
    // Disconnect after successful test
    await disconnectSFTP();
    
    res.status(200).json({
      success: true,
      message: 'Successfully connected to SFTP server'
    });
    
  } catch (error) {
    console.error('SFTP connection error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid SFTP credentials',
        errors: error.errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * List files in directory
 * POST /api/sftp-client/list
 */
router.post('/list', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const schema = SftpCredentialsSchema.extend({
      path: z.string().optional().default('/')
    });
    
    const { path, ...credentials } = schema.parse(req.body);
    
    // Connect to SFTP server
    await connectSFTP(credentials);
    
    // List files
    const files = await listFiles(path);
    
    res.status(200).json({
      success: true,
      path,
      files
    });
    
  } catch (error) {
    console.error('SFTP list error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
    
  } finally {
    // Always disconnect
    await disconnectSFTP().catch(console.error);
  }
});

/**
 * Read file content
 * POST /api/sftp-client/read
 */
router.post('/read', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const schema = SftpCredentialsSchema.extend({
      path: z.string().min(1, 'File path is required')
    });
    
    const { path, ...credentials } = schema.parse(req.body);
    
    // Connect to SFTP server
    await connectSFTP(credentials);
    
    // Read file
    const content = await readFile(path);
    
    res.status(200).json({
      success: true,
      path,
      content
    });
    
  } catch (error) {
    console.error('SFTP read error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
    
  } finally {
    // Always disconnect
    await disconnectSFTP().catch(console.error);
  }
});

/**
 * Write file content
 * POST /api/sftp-client/write
 */
router.post('/write', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const schema = SftpCredentialsSchema.extend({
      path: z.string().min(1, 'File path is required'),
      content: z.string().min(1, 'File content is required')
    });
    
    const { path, content, ...credentials } = schema.parse(req.body);
    
    // Connect to SFTP server
    await connectSFTP(credentials);
    
    // Write file
    await writeFile(path, content);
    
    res.status(200).json({
      success: true,
      path,
      message: 'File successfully written'
    });
    
  } catch (error) {
    console.error('SFTP write error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors
      });
    }
    
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : String(error)
    });
    
  } finally {
    // Always disconnect
    await disconnectSFTP().catch(console.error);
  }
});

export default router;
