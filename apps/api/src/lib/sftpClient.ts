/**
 * SFTP Client Utility
 * Handles SFTP connection, list, read, write operations with retry logic
 */
// Using require for compatibility since types might not be available
const Client = require('ssh2-sftp-client');
import { z } from 'zod';

// SFTP Connection Credentials Schema
export const SftpCredentialsSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  // Optional root path to start from
  rootPath: z.string().optional().default('/'),
});

// SFTP Connection Credentials Type
export type SftpCredentials = z.infer<typeof SftpCredentialsSchema>;

// Global SFTP client instance
const sftp = new Client();
let isConnected = false;

/**
 * Connect to SFTP server
 * 
 * @param credentials SFTP connection credentials
 * @returns SFTP client instance
 */
export async function connectSFTP(credentials: SftpCredentials): Promise<any> {
  try {
    // Validate credentials
    const validatedCredentials = SftpCredentialsSchema.parse(credentials);
    
    // Close existing connection if open
    if (isConnected) {
      await sftp.end();
      isConnected = false;
    }
    
    // Connect to server
    await sftp.connect({
      host: validatedCredentials.host,
      port: validatedCredentials.port,
      username: validatedCredentials.username,
      password: validatedCredentials.password,
      retries: 3,
      retry_factor: 2,
      retry_minTimeout: 1000
    });
    
    isConnected = true;
    return sftp;
  } catch (error) {
    console.error('SFTP Connection Error:', error);
    throw new Error(`Failed to connect to SFTP server: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * List files in a directory
 * 
 * @param path Directory path to list
 * @returns Promise resolving to array of file info objects
 */
export async function listFiles(path: string = '/'): Promise<any[]> {
  if (!isConnected) {
    throw new Error('SFTP client not connected');
  }
  
  try {
    const files = await sftp.list(path);
    return files.map((file: any) => ({
      name: file.name,
      type: file.type, // d: directory, -: file, l: symlink
      size: file.size,
      modifyTime: file.modifyTime,
      accessTime: file.accessTime,
      path: path === '/' ? `/${file.name}` : `${path}/${file.name}`
    }));
  } catch (error) {
    console.error('SFTP List Error:', error);
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Read a file from SFTP server
 * 
 * @param remotePath Path to file on SFTP server
 * @returns Promise resolving to file content as string
 */
export async function readFile(remotePath: string): Promise<string> {
  if (!isConnected) {
    throw new Error('SFTP client not connected');
  }
  
  try {
    const data = await sftp.get(remotePath);
    
    // Handle different return types
    if (Buffer.isBuffer(data)) {
      return data.toString('utf8');
    } else if (typeof data === 'string') {
      return data;
    } else {
      throw new Error('Unexpected data format returned from SFTP server');
    }
  } catch (error) {
    console.error('SFTP Read Error:', error);
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Write content to a file on SFTP server
 * 
 * @param remotePath Path to file on SFTP server
 * @param content Content to write (string or Buffer)
 * @returns Promise that resolves when write is complete
 */
export async function writeFile(remotePath: string, content: string | Buffer): Promise<void> {
  if (!isConnected) {
    throw new Error('SFTP client not connected');
  }
  
  try {
    const buffer = typeof content === 'string' ? Buffer.from(content) : content;
    await sftp.put(buffer, remotePath);
  } catch (error) {
    console.error('SFTP Write Error:', error);
    throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Disconnect from SFTP server
 */
export async function disconnectSFTP(): Promise<void> {
  if (isConnected) {
    await sftp.end();
    isConnected = false;
  }
}
