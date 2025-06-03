/**
 * SFTP Client Service
 * Frontend service for interacting with the SFTP client API
 */
import axios from 'axios';

/**
 * SFTP Credentials interface
 */
export interface SftpCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  rootPath?: string;
}

/**
 * SFTP File interface
 */
export interface SftpFile {
  name: string;
  type: string;
  size: number;
  modifyTime: number;
  accessTime: number;
  path: string;
}

/**
 * SFTP Client Service
 */
export class SftpClientService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to localhost:3000
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Test connection to SFTP server
   * 
   * @param credentials SFTP connection credentials
   * @returns Promise resolving to success status and message
   */
  public async testConnection(credentials: SftpCredentials): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/sftp-client/connect`, credentials);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * List files in a directory
   * 
   * @param credentials SFTP connection credentials
   * @param path Directory path to list
   * @returns Promise resolving to list of files
   */
  public async listFiles(
    credentials: SftpCredentials, 
    path: string = '/'
  ): Promise<{ success: boolean; path: string; files: SftpFile[] }> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/sftp-client/list`, {
        ...credentials,
        path
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Read a file
   * 
   * @param credentials SFTP connection credentials
   * @param path Path to the file
   * @returns Promise resolving to file content
   */
  public async readFile(
    credentials: SftpCredentials, 
    path: string
  ): Promise<{ success: boolean; path: string; content: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/sftp-client/read`, {
        ...credentials,
        path
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Write to a file
   * 
   * @param credentials SFTP connection credentials
   * @param path Path to the file
   * @param content Content to write
   * @returns Promise resolving to success status
   */
  public async writeFile(
    credentials: SftpCredentials, 
    path: string, 
    content: string
  ): Promise<{ success: boolean; path: string; message: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/api/sftp-client/write`, {
        ...credentials,
        path,
        content
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }
}

// Export singleton instance
export const sftpClientService = new SftpClientService();
