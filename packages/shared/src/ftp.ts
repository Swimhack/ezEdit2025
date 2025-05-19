import { Client, FileInfo } from 'basic-ftp';
// Import from our central zod module
import { FTPConfigSchema, FTPConfigType } from './zod';

// Re-export the schema for convenience
export const FTPConfig = FTPConfigSchema;

export class FTPError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'FTPError';
  }
}

export class FTPClient {
  private client: Client;
  private connected = false;
  private currentPath = '/';

  constructor(private config: FTPConfigType) {
    this.client = new Client(config.timeout);
  }

  async connect(): Promise<void> {
    try {
      await this.client.access({
        host: this.config.host,
        user: this.config.user,
        password: this.config.pass,
        port: this.config.port,
        secure: this.config.secure,
      });

      // Handle legacy FTP servers that might not support UTF-8
      await this.client.send('OPTS UTF8 ON').catch(() => {
        // Ignore if server doesn't support UTF8
      });

      // Set binary mode for reliable file transfers
      await this.client.send('TYPE I');

      // Change to root path if specified
      if (this.config.rootPath !== '/') {
        await this.cd(this.config.rootPath);
      }

      this.connected = true;
    } catch (error: any) {
      throw new FTPError(
        `Failed to connect to FTP server: ${error.message}`,
        error.code,
        error
      );
    }
  }

  async list(path: string = '.'): Promise<FileInfo[]> {
    this.ensureConnected();
    try {
      return await this.client.list(path);
    } catch (error: any) {
      throw new FTPError(
        `Failed to list directory: ${error.message}`,
        error.code,
        error
      );
    }
  }

  async read(path: string): Promise<Buffer> {
    this.ensureConnected();
    try {
      // Create a temporary file to download to
      const tempPath = require('os').tmpdir() + '/' + Date.now() + '.tmp';
      await this.client.downloadTo(tempPath, path);
      const content = require('fs').readFileSync(tempPath);
      require('fs').unlinkSync(tempPath);
      return content;
    } catch (error: any) {
      throw new FTPError(
        `Failed to read file: ${error.message}`,
        error.code,
        error
      );
    }
  }

  async write(path: string, data: Buffer | string): Promise<void> {
    this.ensureConnected();
    try {
      // Create a temporary file to upload from
      const tempPath = require('os').tmpdir() + '/' + Date.now() + '.tmp';
      const dataToWrite = typeof data === 'string' ? data : data.toString();
      require('fs').writeFileSync(tempPath, dataToWrite);
      await this.client.uploadFrom(tempPath, path);
      require('fs').unlinkSync(tempPath);
    } catch (error: any) {
      throw new FTPError(
        `Failed to write file: ${error.message}`,
        error.code,
        error
      );
    }
  }

  async cd(path: string): Promise<void> {
    this.ensureConnected();
    try {
      await this.client.cd(path);
      this.currentPath = path;
    } catch (error: any) {
      throw new FTPError(
        `Failed to change directory: ${error.message}`,
        error.code,
        error
      );
    }
  }

  async mkdir(path: string): Promise<void> {
    this.ensureConnected();
    try {
      await this.client.send(`MKD ${path}`);
    } catch (error: any) {
      throw new FTPError(
        `Failed to create directory: ${error.message}`,
        error.code,
        error
      );
    }
  }

  async remove(path: string): Promise<void> {
    this.ensureConnected();
    try {
      await this.client.remove(path);
    } catch (error: any) {
      throw new FTPError(
        `Failed to remove file: ${error.message}`,
        error.code,
        error
      );
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    this.ensureConnected();
    try {
      await this.client.rename(oldPath, newPath);
    } catch (error: any) {
      throw new FTPError(
        `Failed to rename file: ${error.message}`,
        error.code,
        error
      );
    }
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
    }
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new FTPError('Not connected to FTP server');
    }
  }
} 