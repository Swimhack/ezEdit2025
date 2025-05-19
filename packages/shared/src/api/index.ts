import { 
  SiteCred, 
  ListRes, 
  ContentRes, 
  SaveReq, 
  RefactorReq, 
  RefactorRes 
} from '../types';

// Use environment variable if available, otherwise default to localhost
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return (window as any).__ENV?.VITE_API_URL || 'http://localhost:3000';
  } else {
    // Node.js environment
    return process.env.API_URL || 'http://localhost:3000';
  }
};

/**
 * API client for interacting with the ezEdit backend
 */
export const api = {
  /**
   * Test connection to an FTP site
   */
  connect: (body: SiteCred) => req('/ftp/connect', 'POST', body),
  
  /**
   * List files in a directory
   */
  list: (root = '/') => req<ListRes>(`/ftp/list?root=${encodeURIComponent(root)}`),
  
  /**
   * Get file content
   */
  get: (path: string) => req<ContentRes>(`/ftp/content?path=${encodeURIComponent(path)}`),
  
  /**
   * Save file content
   */
  save: (body: SaveReq) => req('/ftp/content', 'PUT', body),
  
  /**
   * Refactor code using AI
   */
  refactor: (body: RefactorReq) => req<RefactorRes>('/ai/refactor', 'POST', body),
};

/**
 * Generic request function with error handling
 */
async function req<T = unknown>(url: string, method: string = 'GET', body?: any): Promise<T> {
  const base = getBaseUrl();
  const res = await fetch(base + url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `API request failed: ${res.status}`);
  }
  
  return res.json();
}
