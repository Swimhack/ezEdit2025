import * as ftp from 'basic-ftp';
import SftpClient from 'ssh2-sftp-client';
import type { FileNode } from '@/types';
import type { FTPConnection } from '@/types';

export class FTPService {
  private ftpClient: ftp.Client | null = null;
  private sftpClient: SftpClient | null = null;
  private connection: FTPConnection | null = null;

  async connect(config: FTPConnection): Promise<void> {
    this.connection = config;

    if (config.type === 'sftp') {
      this.sftpClient = new SftpClient();
      await this.sftpClient.connect({
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
      });
    } else {
      this.ftpClient = new ftp.Client();
      this.ftpClient.ftp.verbose = true; // Enable verbose logging
      await this.ftpClient.access({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        secure: config.secure || false,
        secureOptions: config.secure ? { rejectUnauthorized: false } : undefined,
      });
    }
  }

  async disconnect(): Promise<void> {
    if (this.ftpClient) {
      this.ftpClient.close();
      this.ftpClient = null;
    }
    if (this.sftpClient) {
      await this.sftpClient.end();
      this.sftpClient = null;
    }
    this.connection = null;
  }

  async listFiles(remotePath: string = '/'): Promise<FileNode[]> {
    if (this.sftpClient) {
      const list = await this.sftpClient.list(remotePath);
      return list.map((item) => ({
        id: `${remotePath}/${item.name}`,
        name: item.name,
        path: `${remotePath}/${item.name}`,
        type: item.type === 'd' ? ('directory' as const) : ('file' as const),
        size: item.size,
        modifiedAt: new Date(item.modifyTime),
      }));
    }

    if (this.ftpClient) {
      const list = await this.ftpClient.list(remotePath);
      return list.map((item) => ({
        id: `${remotePath}/${item.name}`,
        name: item.name,
        path: `${remotePath}/${item.name}`,
        type: item.isDirectory ? ('directory' as const) : ('file' as const),
        size: item.size,
        modifiedAt: item.modifiedAt,
      }));
    }

    throw new Error('Not connected to any FTP/SFTP server');
  }

  async readFile(remotePath: string): Promise<string> {
    if (this.sftpClient) {
      const buffer = await this.sftpClient.get(remotePath);
      return buffer.toString('utf-8');
    }

    if (this.ftpClient) {
      const chunks: Buffer[] = [];
      await this.ftpClient.downloadTo(
        {
          write: (chunk: Buffer) => chunks.push(chunk),
          end: () => {},
        } as any,
        remotePath
      );
      return Buffer.concat(chunks).toString('utf-8');
    }

    throw new Error('Not connected to any FTP/SFTP server');
  }

  async writeFile(remotePath: string, content: string): Promise<void> {
    const buffer = Buffer.from(content, 'utf-8');

    if (this.sftpClient) {
      await this.sftpClient.put(buffer, remotePath);
      return;
    }

    if (this.ftpClient) {
      const readable = require('stream').Readable.from([buffer]);
      await this.ftpClient.uploadFrom(readable, remotePath);
      return;
    }

    throw new Error('Not connected to any FTP/SFTP server');
  }

  async deleteFile(remotePath: string): Promise<void> {
    if (this.sftpClient) {
      await this.sftpClient.delete(remotePath);
      return;
    }

    if (this.ftpClient) {
      await this.ftpClient.remove(remotePath);
      return;
    }

    throw new Error('Not connected to any FTP/SFTP server');
  }

  async createDirectory(remotePath: string): Promise<void> {
    if (this.sftpClient) {
      await this.sftpClient.mkdir(remotePath, true);
      return;
    }

    if (this.ftpClient) {
      await this.ftpClient.ensureDir(remotePath);
      return;
    }

    throw new Error('Not connected to any FTP/SFTP server');
  }

  isConnected(): boolean {
    return !!(this.ftpClient || this.sftpClient);
  }
}

// Singleton instance
export const ftpService = new FTPService();
