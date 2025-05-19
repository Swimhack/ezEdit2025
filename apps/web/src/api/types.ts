// Common API interfaces for FTP operations

/**
 * FTP List Item response structure
 */
export interface FTPListItem {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedTime?: string;
  permissions?: string;
}

/**
 * Standard API response wrapper
 */
export interface FTPResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
