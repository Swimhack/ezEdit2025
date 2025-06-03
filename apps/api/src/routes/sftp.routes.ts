import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { sftpService, SftpCredentialsSchema, SftpError } from '../services/sftp/sftp.service';

const router: Router = Router();

/**
 * Test SFTP connection
 * POST /api/sftp/connect
 */
router.post('/connect', async (req, res) => {
  try {
    // Validate request body
    const credentials = SftpCredentialsSchema.parse(req.body);
    
    // Connect to SFTP server
    await sftpService.connect(credentials);
    
    // Disconnect after successful test
    await sftpService.disconnect();
    
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
    
    const sftpError = error instanceof SftpError 
      ? error 
      : new SftpError('Unknown error occurred', 'UNKNOWN_ERROR');
    
    res.status(400).json({
      success: false,
      message: sftpError.message,
      code: sftpError.code
    });
  }
});

/**
 * List files in a directory
 * POST /api/sftp/list
 */
router.post('/list', async (req, res) => {
  try {
    // Validate request body
    const schema = SftpCredentialsSchema.extend({
      path: z.string().optional().default('/')
    });
    
    const { path, ...credentials } = schema.parse(req.body);
    
    // Connect to SFTP server
    await sftpService.connect(credentials);
    
    // List files
    const files = await sftpService.listFiles(path);
    
    // Format response
    const formattedFiles = files.map(file => ({
      name: file.filename,
      longname: file.longname,
      isDirectory: file.attrs.isDirectory,
      isFile: file.attrs.isFile,
      isSymbolicLink: file.attrs.isSymbolicLink,
      size: file.attrs.size,
      modifyTime: file.attrs.mtime,
      accessTime: file.attrs.atime,
      permissions: file.attrs.permissions
    }));
    
    res.status(200).json({
      success: true,
      path,
      files: formattedFiles
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
    
    const sftpError = error instanceof SftpError 
      ? error 
      : new SftpError('Unknown error occurred', 'UNKNOWN_ERROR');
    
    res.status(400).json({
      success: false,
      message: sftpError.message,
      code: sftpError.code,
      path: sftpError.operation
    });
    
  } finally {
    // Always disconnect
    await sftpService.disconnect().catch(console.error);
  }
});

/**
 * Read a file
 * POST /api/sftp/read
 */
router.post('/read', async (req, res) => {
  try {
    // Validate request body
    const schema = SftpCredentialsSchema.extend({
      path: z.string().min(1, 'File path is required')
    });
    
    const { path, ...credentials } = schema.parse(req.body);
    
    // Connect to SFTP server
    await sftpService.connect(credentials);
    
    // Read file
    const content = await sftpService.readFile(path);
    
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
    
    const sftpError = error instanceof SftpError 
      ? error 
      : new SftpError('Unknown error occurred', 'UNKNOWN_ERROR');
    
    res.status(400).json({
      success: false,
      message: sftpError.message,
      code: sftpError.code,
      path: sftpError.operation
    });
    
  } finally {
    // Always disconnect
    await sftpService.disconnect().catch(console.error);
  }
});

/**
 * Write to a file
 * POST /api/sftp/write
 */
router.post('/write', async (req, res) => {
  try {
    // Validate request body
    const schema = SftpCredentialsSchema.extend({
      path: z.string().min(1, 'File path is required'),
      content: z.string().default('')
    });
    
    const { path, content, ...credentials } = schema.parse(req.body);
    
    // Connect to SFTP server
    await sftpService.connect(credentials);
    
    // Write file
    await sftpService.writeFile(path, content);
    
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
    
    const sftpError = error instanceof SftpError 
      ? error 
      : new SftpError('Unknown error occurred', 'UNKNOWN_ERROR');
    
    res.status(400).json({
      success: false,
      message: sftpError.message,
      code: sftpError.code,
      path: sftpError.operation
    });
    
  } finally {
    // Always disconnect
    await sftpService.disconnect().catch(console.error);
  }
});

/**
 * Create a directory
 * POST /api/sftp/directory
 */
router.post('/directory', async (req, res) => {
  try {
    // Validate request body
    const schema = SftpCredentialsSchema.extend({
      path: z.string().min(1, 'Directory path is required')
    });
    
    const { path, ...credentials } = schema.parse(req.body);
    
    // Connect to SFTP server
    await sftpService.connect(credentials);
    
    // Create directory
    await sftpService.createDirectory(path);
    
    res.status(200).json({
      success: true,
      path,
      message: 'Directory successfully created'
    });
    
  } catch (error) {
    console.error('SFTP mkdir error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors
      });
    }
    
    const sftpError = error instanceof SftpError 
      ? error 
      : new SftpError('Unknown error occurred', 'UNKNOWN_ERROR');
    
    res.status(400).json({
      success: false,
      message: sftpError.message,
      code: sftpError.code,
      path: sftpError.operation
    });
    
  } finally {
    // Always disconnect
    await sftpService.disconnect().catch(console.error);
  }
});

/**
 * Delete a file
 * DELETE /api/sftp/file
 */
router.delete('/file', async (req, res) => {
  try {
    // Validate request body
    const schema = SftpCredentialsSchema.extend({
      path: z.string().min(1, 'File path is required')
    });
    
    const { path, ...credentials } = schema.parse(req.body);
    
    // Connect to SFTP server
    await sftpService.connect(credentials);
    
    // Delete file
    await sftpService.deleteFile(path);
    
    res.status(200).json({
      success: true,
      path,
      message: 'File successfully deleted'
    });
    
  } catch (error) {
    console.error('SFTP delete file error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors
      });
    }
    
    const sftpError = error instanceof SftpError 
      ? error 
      : new SftpError('Unknown error occurred', 'UNKNOWN_ERROR');
    
    res.status(400).json({
      success: false,
      message: sftpError.message,
      code: sftpError.code,
      path: sftpError.operation
    });
    
  } finally {
    // Always disconnect
    await sftpService.disconnect().catch(console.error);
  }
});

/**
 * Delete a directory
 * DELETE /api/sftp/directory
 */
router.delete('/directory', async (req, res) => {
  try {
    // Validate request body
    const schema = SftpCredentialsSchema.extend({
      path: z.string().min(1, 'Directory path is required')
    });
    
    const { path, ...credentials } = schema.parse(req.body);
    
    // Connect to SFTP server
    await sftpService.connect(credentials);
    
    // Delete directory
    await sftpService.deleteDirectory(path);
    
    res.status(200).json({
      success: true,
      path,
      message: 'Directory successfully deleted'
    });
    
  } catch (error) {
    console.error('SFTP delete directory error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors
      });
    }
    
    const sftpError = error instanceof SftpError 
      ? error 
      : new SftpError('Unknown error occurred', 'UNKNOWN_ERROR');
    
    res.status(400).json({
      success: false,
      message: sftpError.message,
      code: sftpError.code,
      path: sftpError.operation
    });
    
  } finally {
    // Always disconnect
    await sftpService.disconnect().catch(console.error);
  }
});

export default router;
