import { Client, ConnectConfig, SFTPWrapper } from 'ssh2';
import { Readable, Writable } from 'stream';
import { promisify } from 'util';
import { z } from 'zod';

/**
 * SFTP Connection Credentials Schema
 */
export const SftpCredentialsSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  // Optional root path to start from
  rootPath: z.string().optional().default('/'),
  // Advanced options
  readyTimeout: z.number().int().optional().default(10000), // 10 seconds
  retries: z.number().int().optional().default(3),
  retryDelay: z.number().int().optional().default(1000), // 1 second
});

/**
 * SFTP Credentials Type
 */
export type SftpCredentials = z.infer<typeof SftpCredentialsSchema>;

/**
 * SFTP File Type
 */
export interface SftpFile {
  filename: string;
  longname: string;
  attrs: {
    size: number;
    mtime: number;
    atime: number;
    uid: number;
    gid: number;
    mode: number;
    permissions: number;
    isDirectory: boolean;
    isFile: boolean;
    isSymbolicLink: boolean;
  };
}

/**
 * SFTP Service Error Class
 */
export class SftpError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly operation?: string
  ) {
    super(message);
    this.name = 'SftpError';
  }
}

/**
 * SFTP Client Service
 * 
 * Provides methods for connecting to SFTP servers and performing file operations
 * with exponential backoff retry logic.
 */
export class SftpService {
  private client: Client | null = null;
  private sftp: SFTPWrapper | null = null;
  private credentials: SftpCredentials | null = null;

  /**
   * Creates a new SFTP client connection
   * 
   * @param credentials SFTP connection credentials
   * @returns Promise that resolves when connected
   * @throws {SftpError} If connection fails
   */
  public async connect(credentials: SftpCredentials): Promise<void> {
    try {
      // Validate credentials
      this.credentials = SftpCredentialsSchema.parse(credentials);
      
      // Close any existing connection
      await this.disconnect();
      
      // Create new client
      this.client = new Client();
      
      // Setup config
      const config: ConnectConfig = {
        host: this.credentials.host,
        port: this.credentials.port,
        username: this.credentials.username,
        password: this.credentials.password,
        readyTimeout: this.credentials.readyTimeout,
      };

      // Connect with retry logic
      await this.connectWithRetry(config, this.credentials.retries, this.credentials.retryDelay);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new SftpError('Invalid SFTP credentials: ' + error.message, 'VALIDATION_ERROR');
      }
      
      const err = error as Error;
      throw new SftpError(
        `Failed to connect to SFTP server: ${err.message}`,
        'CONNECTION_ERROR'
      );
    }
  }

  /**
   * Attempts to connect to SFTP server with exponential backoff
   * 
   * @param config SSH2 connection config
   * @param maxRetries Maximum number of retry attempts
   * @param initialDelay Initial delay in ms before retrying
   * @private
   */
  private async connectWithRetry(
    config: ConnectConfig,
    maxRetries: number,
    initialDelay: number
  ): Promise<void> {
    let retryCount = 0;
    let lastError: Error | null = null;
    
    while (retryCount <= maxRetries) {
      try {
        // Connect to the server
        await new Promise<void>((resolve, reject) => {
          if (!this.client) {
            reject(new Error('SSH client not initialized'));
            return;
          }
          
          this.client
            .on('ready', () => {
              // When connected, get SFTP session
              this.client!.sftp((err, sftp) => {
                if (err) {
                  reject(new Error(`Failed to initialize SFTP session: ${err.message}`));
                  return;
                }
                this.sftp = sftp;
                resolve();
              });
            })
            .on('error', (err) => {
              reject(new Error(`SSH connection error: ${err.message}`));
            })
            .connect(config);
        });
        
        // If we get here, connection was successful
        return;
        
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        if (retryCount <= maxRetries) {
          // Calculate exponential backoff delay
          const delay = initialDelay * Math.pow(2, retryCount - 1);
          console.log(`SFTP connection failed. Retrying in ${delay}ms (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we get here, all retries failed
    throw new SftpError(
      `Failed to connect to SFTP server after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
      'MAX_RETRIES_EXCEEDED'
    );
  }

  /**
   * Disconnects from the SFTP server
   */
  public async disconnect(): Promise<void> {
    if (this.sftp) {
      this.sftp.end();
      this.sftp = null;
    }
    
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  /**
   * Lists files in a directory
   * 
   * @param path Directory path to list
   * @returns Promise resolving to array of file info objects
   * @throws {SftpError} If listing fails
   */
  public async listFiles(path: string = '/'): Promise<SftpFile[]> {
    try {
      this.ensureConnected();
      
      // Normalize path
      const dirPath = this.normalizePath(path);
      
      // List files
      return new Promise<SftpFile[]>((resolve, reject) => {
        this.sftp!.readdir(dirPath, (err, list) => {
          if (err) {
            reject(new SftpError(`Failed to list directory: ${err.message}`, 'LIST_ERROR', dirPath));
            return;
          }
          
          resolve(list as unknown as SftpFile[]);
        });
      });
      
    } catch (error) {
      const err = error as Error;
      throw new SftpError(
        `Failed to list files in directory: ${err.message}`,
        error instanceof SftpError ? error.code : 'LIST_ERROR',
        path
      );
    }
  }

  /**
   * Reads a file from the SFTP server
   * 
   * @param path Path to the file
   * @returns Promise resolving to file content as string
   * @throws {SftpError} If read fails
   */
  public async readFile(path: string): Promise<string> {
    try {
      this.ensureConnected();
      
      // Normalize path
      const filePath = this.normalizePath(path);
      
      return new Promise<string>((resolve, reject) => {
        const chunks: Buffer[] = [];
        
        // Create read stream
        const readStream = this.sftp!.createReadStream(filePath);
        
        readStream
          .on('data', (chunk: Buffer) => {
            chunks.push(chunk);
          })
          .on('end', () => {
            const fileContent = Buffer.concat(chunks).toString('utf8');
            resolve(fileContent);
          })
          .on('error', (err) => {
            reject(new SftpError(`Failed to read file: ${err.message}`, 'READ_ERROR', filePath));
          });
      });
      
    } catch (error) {
      const err = error as Error;
      throw new SftpError(
        `Failed to read file: ${err.message}`,
        error instanceof SftpError ? error.code : 'READ_ERROR',
        path
      );
    }
  }

  /**
   * Writes content to a file on the SFTP server
   * 
   * @param path Path to the file
   * @param content Content to write
   * @returns Promise that resolves when write is complete
   * @throws {SftpError} If write fails
   */
  public async writeFile(path: string, content: string): Promise<void> {
    try {
      this.ensureConnected();
      
      // Normalize path
      const filePath = this.normalizePath(path);
      
      return new Promise<void>((resolve, reject) => {
        // Create write stream
        const writeStream = this.sftp!.createWriteStream(filePath);
        
        writeStream
          .on('finish', () => {
            resolve();
          })
          .on('error', (err) => {
            reject(new SftpError(`Failed to write file: ${err.message}`, 'WRITE_ERROR', filePath));
          });
        
        // Write content to stream
        writeStream.write(content, (err) => {
          if (err) {
            reject(new SftpError(`Failed to write to stream: ${err.message}`, 'WRITE_ERROR', filePath));
            return;
          }
          writeStream.end();
        });
      });
      
    } catch (error) {
      const err = error as Error;
      throw new SftpError(
        `Failed to write file: ${err.message}`,
        error instanceof SftpError ? error.code : 'WRITE_ERROR',
        path
      );
    }
  }

  /**
   * Creates a directory on the SFTP server
   * 
   * @param path Path to the directory to create
   * @returns Promise that resolves when directory is created
   * @throws {SftpError} If mkdir fails
   */
  public async createDirectory(path: string): Promise<void> {
    try {
      this.ensureConnected();
      
      // Normalize path
      const dirPath = this.normalizePath(path);
      
      // Create directory
      const mkdir = promisify(this.sftp!.mkdir.bind(this.sftp));
      await mkdir(dirPath);
      
    } catch (error) {
      const err = error as Error;
      throw new SftpError(
        `Failed to create directory: ${err.message}`,
        'MKDIR_ERROR',
        path
      );
    }
  }

  /**
   * Deletes a file from the SFTP server
   * 
   * @param path Path to the file to delete
   * @returns Promise that resolves when file is deleted
   * @throws {SftpError} If unlink fails
   */
  public async deleteFile(path: string): Promise<void> {
    try {
      this.ensureConnected();
      
      // Normalize path
      const filePath = this.normalizePath(path);
      
      // Delete file
      const unlink = promisify(this.sftp!.unlink.bind(this.sftp));
      await unlink(filePath);
      
    } catch (error) {
      const err = error as Error;
      throw new SftpError(
        `Failed to delete file: ${err.message}`,
        'DELETE_ERROR',
        path
      );
    }
  }

  /**
   * Deletes a directory from the SFTP server
   * 
   * @param path Path to the directory to delete
   * @returns Promise that resolves when directory is deleted
   * @throws {SftpError} If rmdir fails
   */
  public async deleteDirectory(path: string): Promise<void> {
    try {
      this.ensureConnected();
      
      // Normalize path
      const dirPath = this.normalizePath(path);
      
      // Delete directory
      const rmdir = promisify(this.sftp!.rmdir.bind(this.sftp));
      await rmdir(dirPath);
      
    } catch (error) {
      const err = error as Error;
      throw new SftpError(
        `Failed to delete directory: ${err.message}`,
        'RMDIR_ERROR',
        path
      );
    }
  }

  /**
   * Ensures there is an active connection
   * @private
   */
  private ensureConnected(): void {
    if (!this.client || !this.sftp) {
      throw new SftpError('Not connected to SFTP server', 'NOT_CONNECTED');
    }
  }

  /**
   * Normalizes a path, combining root path with the given path
   * 
   * @param path Path to normalize
   * @returns Normalized path
   * @private
   */
  private normalizePath(path: string): string {
    if (!this.credentials) {
      throw new SftpError('SFTP credentials not set', 'INVALID_STATE');
    }
    
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // If rootPath is just /, return the normalized path
    if (this.credentials.rootPath === '/') {
      return normalizedPath;
    }
    
    // Otherwise, combine rootPath with normalized path
    const rootPath = this.credentials.rootPath.endsWith('/')
      ? this.credentials.rootPath.slice(0, -1)
      : this.credentials.rootPath;
      
    return `${rootPath}${normalizedPath}`;
  }
}

// Export singleton instance
export const sftpService = new SftpService();
