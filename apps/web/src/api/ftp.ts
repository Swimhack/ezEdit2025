import type { FTPCredentials, Site } from '../stores/sites';
import type { FTPListItem, FTPResponse } from './types';

// Re-export the types for components that import from ftp.ts directly
export type { FTPListItem, FTPResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const ftpService = {
  /**
   * Test FTP connection with given credentials
   */
  async testConnection(credentials: FTPCredentials): Promise<FTPResponse<boolean>> {
    try {
      const response = await fetch(`${API_URL}/ftp/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error testing FTP connection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to FTP server',
      };
    }
  },

  /**
   * List files in a directory on the FTP server
   */
  async listFiles(site: Site, path: string = '/'): Promise<FTPResponse<FTPListItem[]>> {
    try {
      const credentials = {
        host: site.host,
        port: site.port,
        username: site.user, 
        password: site.pass, 
        secure: site.secure,
        root_path: '/', 
      };

      const response = await fetch(`${API_URL}/ftp/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          path: path,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error listing FTP files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list files',
      };
    }
  },

  /**
   * Download a file from the FTP server
   */
  async downloadFile(site: Site, path: string): Promise<FTPResponse<string>> {
    try {
      const credentials = {
        host: site.host,
        port: site.port,
        username: site.user, 
        password: site.pass, 
        secure: site.secure,
        root_path: '/', 
      };

      const response = await fetch(`${API_URL}/ftp/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          path,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error downloading FTP file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to download file',
      };
    }
  },

  /**
   * Upload a file to the FTP server
   */
  async uploadFile(
    site: Site,
    path: string,
    content: string
  ): Promise<FTPResponse<boolean>> {
    try {
      const credentials = {
        host: site.host,
        port: site.port,
        username: site.user, 
        password: site.pass, 
        secure: site.secure,
        root_path: '/', 
      };

      const response = await fetch(`${API_URL}/ftp/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          path,
          content,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading FTP file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      };
    }
  },

  /**
   * Create a new directory on the FTP server
   */
  async createDirectory(
    site: Site,
    path: string
  ): Promise<FTPResponse<boolean>> {
    try {
      const credentials = {
        host: site.host,
        port: site.port,
        username: site.user, 
        password: site.pass, 
        secure: site.secure,
        root_path: '/', 
      };

      const response = await fetch(`${API_URL}/ftp/directory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          path,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating FTP directory:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create directory',
      };
    }
  },

  /**
   * Delete a file or directory on the FTP server
   */
  async delete(site: Site, path: string, isDirectory: boolean): Promise<FTPResponse<boolean>> {
    try {
      const credentials = {
        host: site.host,
        port: site.port,
        username: site.user, 
        password: site.pass, 
        secure: site.secure,
        root_path: '/', 
      };

      const response = await fetch(`${API_URL}/ftp/${isDirectory ? 'directory' : 'file'}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          path,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting FTP item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete item',
      };
    }
  },

  /**
   * Delete a file or directory on the FTP server (convenience method for FileExplorer)
   */
  async deleteItem(site: Site, path: string, type: 'file' | 'directory'): Promise<FTPResponse<boolean>> {
    return this.delete(site, path, type === 'directory');
  },

  /**
   * Rename a file or directory on the FTP server
   */
  async rename(site: Site, oldPath: string, newPath: string): Promise<FTPResponse<boolean>> {
    try {
      const credentials = {
        host: site.host,
        port: site.port,
        username: site.user, 
        password: site.pass, 
        secure: site.secure,
        root_path: '/', 
      };

      const response = await fetch(`${API_URL}/ftp/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          oldPath,
          newPath,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error renaming FTP item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to rename item',
      };
    }
  }
};
