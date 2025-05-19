import { Client, FileInfo } from 'basic-ftp';
import { Readable, Writable } from 'stream';
import { FTPConfig, FTPListItem, FTPResponse } from '../types';

/**
 * FTP Client wrapper for basic-ftp with error handling and retries
 */
export class FTPClient {
  private client: Client;
  private config: FTPConfig;
  private connected: boolean = false;

  constructor(config: FTPConfig) {
    this.client = new Client();
    this.config = config;
    this.client.ftp.verbose = false;
  }

  /**
   * Connect to the FTP server
   */
  async connect(): Promise<FTPResponse<boolean>> {
    try {
      await this.client.access({
        host: this.config.host,
        user: this.config.user,
        password: this.config.pass,
        port: this.config.port,
        secure: this.config.secure,
      });
      
      if (this.config.rootPath && this.config.rootPath !== '/') {
        await this.client.cd(this.config.rootPath);
      }
      
      this.connected = true;
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * List files in the specified directory
   */
  async listFiles(path: string = '/'): Promise<FTPResponse<FTPListItem[]>> {
    try {
      if (!this.connected) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return connectResult as FTPResponse<FTPListItem[]>;
        }
      }

      const list = await this.client.list(path);
      
      const items: FTPListItem[] = list.map(item => ({
        name: item.name,
        type: item.isDirectory ? 'dir' : 'file',
        size: item.size,
        modified: item.modifiedAt?.toISOString(),
        path: path === '/' ? `/${item.name}` : `${path}/${item.name}`,
      }));

      return { success: true, data: items };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Download a file from the FTP server
   */
  async downloadFile(remotePath: string): Promise<FTPResponse<string>> {
    try {
      if (!this.connected) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return connectResult as FTPResponse<string>;
        }
      }

      const chunks: Buffer[] = [];
      
      const writable = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(Buffer.from(chunk));
          callback();
        }
      });

      await this.client.downloadTo(writable, remotePath);
      
      const content = Buffer.concat(chunks).toString('utf-8');
      return { success: true, data: content };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Upload a file to the FTP server
   */
  async uploadFile(content: string, remotePath: string): Promise<FTPResponse<boolean>> {
    try {
      if (!this.connected) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return connectResult as FTPResponse<boolean>;
        }
      }

      const buffer = Buffer.from(content, 'utf-8');
      const readable = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        }
      });

      await this.client.uploadFrom(readable, remotePath);
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create a directory on the FTP server
   */
  async createDirectory(remotePath: string): Promise<FTPResponse<boolean>> {
    try {
      if (!this.connected) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return connectResult as FTPResponse<boolean>;
        }
      }

      await this.client.ensureDir(remotePath);
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete a file from the FTP server
   */
  async deleteFile(remotePath: string): Promise<FTPResponse<boolean>> {
    try {
      if (!this.connected) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return connectResult as FTPResponse<boolean>;
        }
      }

      await this.client.remove(remotePath);
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Delete a directory from the FTP server
   */
  async deleteDirectory(remotePath: string): Promise<FTPResponse<boolean>> {
    try {
      if (!this.connected) {
        const connectResult = await this.connect();
        if (!connectResult.success) {
          return connectResult as FTPResponse<boolean>;
        }
      }

      await this.client.removeDir(remotePath);
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Close the FTP connection
   */
  close(): void {
    this.client.close();
    this.connected = false;
  }
}
