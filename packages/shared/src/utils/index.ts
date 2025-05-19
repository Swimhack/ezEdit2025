/**
 * Utility functions for the ezEdit application
 */

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get the file extension from a path
 */
export function getFileExtension(path: string): string {
  const parts = path.split('.');
  if (parts.length === 1) return '';
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Determine if a file is a text file based on its extension
 */
export function isTextFile(path: string): boolean {
  const textExtensions = [
    'txt', 'md', 'markdown', 'html', 'htm', 'css', 'scss', 'less', 
    'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'yaml', 'yml', 'php',
    'py', 'rb', 'java', 'c', 'cpp', 'h', 'cs', 'go', 'rs', 'swift',
    'kt', 'kts', 'sh', 'bash', 'zsh', 'bat', 'ps1', 'sql', 'config',
    'ini', 'env', 'gitignore', 'htaccess'
  ];
  
  const ext = getFileExtension(path);
  return textExtensions.includes(ext);
}

/**
 * Get the language for syntax highlighting based on file extension
 */
export function getLanguageFromPath(path: string): string {
  const ext = getFileExtension(path);
  
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'md': 'markdown',
    'markdown': 'markdown',
    'php': 'php',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'kts': 'kotlin',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'bat': 'batch',
    'ps1': 'powershell',
    'sql': 'sql',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
  };
  
  return langMap[ext] || 'plaintext';
}

/**
 * Normalize a path by removing duplicate slashes and trailing slashes
 */
export function normalizePath(path: string): string {
  // Replace multiple slashes with a single slash
  let normalized = path.replace(/\/+/g, '/');
  
  // Remove trailing slash unless it's the root path
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  
  return normalized;
}

/**
 * Join path segments, handling leading and trailing slashes
 */
export function joinPaths(...paths: string[]): string {
  const joined = paths.join('/').replace(/\/+/g, '/');
  return normalizePath(joined);
}

/**
 * Get the parent directory of a path
 */
export function getParentPath(path: string): string {
  if (path === '/' || path === '') return '/';
  
  const normalized = normalizePath(path);
  const lastSlashIndex = normalized.lastIndexOf('/');
  
  if (lastSlashIndex <= 0) return '/';
  return normalized.substring(0, lastSlashIndex);
}

/**
 * Get the filename from a path
 */
export function getFilename(path: string): string {
  if (path === '/' || path === '') return '';
  
  const normalized = normalizePath(path);
  const lastSlashIndex = normalized.lastIndexOf('/');
  
  if (lastSlashIndex === -1) return normalized;
  return normalized.substring(lastSlashIndex + 1);
}

/**
 * Subscription plan constants
 */
export const PLANS = {
  FREE: 'free',
  PRO: 'pro',
};

/**
 * Stripe price IDs
 */
export const STRIPE_PRICES = {
  ONE_TIME_SITE: 'price_oneTimeSite_$500',
  PRO_SUBSCRIPTION: 'price_subPro_$100',
};
