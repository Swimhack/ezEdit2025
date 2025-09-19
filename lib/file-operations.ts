/**
 * FTP file operations and utilities
 * Handles file tree manipulation, file type detection, and FTP operations
 */

import { FTPFileNode, FileContent, FilePreview } from './editor-types';
import { getLanguageFromFilename } from '@/types/monaco';

/**
 * File type icons mapping
 */
const FILE_ICONS: Record<string, string> = {
  // Directories
  directory: '📁',
  directoryOpen: '📂',

  // Code files
  '.js': '📄',
  '.jsx': '⚛️',
  '.ts': '📘',
  '.tsx': '⚛️',
  '.json': '📋',
  '.html': '🌐',
  '.css': '🎨',
  '.scss': '🎨',
  '.sass': '🎨',
  '.less': '🎨',

  // Text files
  '.md': '📝',
  '.txt': '📄',
  '.xml': '📄',
  '.yaml': '📄',
  '.yml': '📄',

  // Images
  '.jpg': '🖼️',
  '.jpeg': '🖼️',
  '.png': '🖼️',
  '.gif': '🖼️',
  '.svg': '🖼️',
  '.webp': '🖼️',

  // Documents
  '.pdf': '📕',
  '.doc': '📄',
  '.docx': '📄',

  // Archives
  '.zip': '🗜️',
  '.tar': '🗜️',
  '.gz': '🗜️',
  '.rar': '🗜️',

  // Default
  default: '📄'
};

/**
 * Get file icon for display
 */
export function getFileIcon(node: FTPFileNode): string {
  if (node.type === 'directory') {
    return node.isExpanded ? FILE_ICONS.directoryOpen : FILE_ICONS.directory;
  }

  const extension = getFileExtension(node.name);
  return FILE_ICONS[extension] || FILE_ICONS.default;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Check if file is editable (text file)
 */
export function isEditableFile(node: FTPFileNode): boolean {
  if (node.type === 'directory') return false;

  const extension = getFileExtension(node.name);
  const editableExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss', '.sass', '.less',
    '.md', '.txt', '.xml', '.yaml', '.yml', '.php', '.py', '.java', '.c', '.cpp',
    '.cs', '.go', '.rs', '.rb', '.swift', '.kt', '.sh', '.bash', '.ps1', '.sql',
    '.env', '.gitignore', '.dockerignore', '.dockerfile'
  ];

  return editableExtensions.includes(extension) || extension === '';
}

/**
 * Check if file can have a preview
 */
export function isPreviewableFile(node: FTPFileNode): boolean {
  if (node.type === 'directory') return false;

  const extension = getFileExtension(node.name);
  const previewableExtensions = [
    // Text files (show content preview)
    '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss', '.sass', '.less',
    '.md', '.txt', '.xml', '.yaml', '.yml', '.php', '.py', '.java', '.c', '.cpp',
    '.cs', '.go', '.rs', '.rb', '.swift', '.kt', '.sh', '.bash', '.ps1', '.sql',
    // Images (show thumbnail)
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'
  ];

  return previewableExtensions.includes(extension);
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const decimals = 2;

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(decimals)} ${units[i]}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today ${date.toLocaleTimeString()}`;
  } else if (diffDays === 1) {
    return `Yesterday ${date.toLocaleTimeString()}`;
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Sort file tree nodes
 */
export function sortFileTree(nodes: FTPFileNode[]): FTPFileNode[] {
  return [...nodes].sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }

    // Then alphabetically by name
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}

/**
 * Find node in file tree by path
 */
export function findNodeByPath(nodes: FTPFileNode[], path: string): FTPFileNode | null {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get all parent paths for a given path
 */
export function getParentPaths(path: string): string[] {
  const parts = path.split('/').filter(Boolean);
  const parents: string[] = [];

  for (let i = 0; i < parts.length - 1; i++) {
    const parentPath = '/' + parts.slice(0, i + 1).join('/');
    parents.push(parentPath);
  }

  return parents;
}

/**
 * Check if a path is a child of another path
 */
export function isChildPath(childPath: string, parentPath: string): boolean {
  if (parentPath === '/') return true;
  return childPath.startsWith(parentPath + '/');
}

/**
 * Get relative path from parent to child
 */
export function getRelativePath(childPath: string, parentPath: string): string {
  if (parentPath === '/') return childPath.substring(1);
  return childPath.substring(parentPath.length + 1);
}

/**
 * Convert FTP list response to FTPFileNode
 */
export function convertToFileNode(ftpItem: any, basePath: string = ''): FTPFileNode {
  const fullPath = basePath ? `${basePath}/${ftpItem.name}` : `/${ftpItem.name}`;

  return {
    path: fullPath,
    name: ftpItem.name,
    type: ftpItem.type === 1 ? 'directory' : 'file',
    size: ftpItem.size || 0,
    modified: new Date(ftpItem.modifiedAt || ftpItem.date),
    permissions: ftpItem.permissions || '',
    isExpanded: false,
    isLoaded: false,
    children: ftpItem.type === 1 ? [] : undefined
  };
}

/**
 * Build file tree from flat list
 */
export function buildFileTree(items: any[], basePath: string = ''): FTPFileNode[] {
  const nodes = items.map(item => convertToFileNode(item, basePath));
  return sortFileTree(nodes);
}

/**
 * Filter file tree by search term
 */
export function filterFileTree(nodes: FTPFileNode[], searchTerm: string): FTPFileNode[] {
  if (!searchTerm.trim()) return nodes;

  const term = searchTerm.toLowerCase();

  return nodes.reduce<FTPFileNode[]>((filtered, node) => {
    const nameMatch = node.name.toLowerCase().includes(term);
    const pathMatch = node.path.toLowerCase().includes(term);

    if (nameMatch || pathMatch) {
      filtered.push(node);
    } else if (node.children) {
      const filteredChildren = filterFileTree(node.children, searchTerm);
      if (filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren,
          isExpanded: true // Expand directories with matches
        });
      }
    }

    return filtered;
  }, []);
}

/**
 * Get breadcrumb path for navigation
 */
export function getBreadcrumbs(path: string): Array<{ name: string; path: string }> {
  if (path === '/') return [{ name: 'Root', path: '/' }];

  const parts = path.split('/').filter(Boolean);
  const breadcrumbs = [{ name: 'Root', path: '/' }];

  for (let i = 0; i < parts.length; i++) {
    const breadcrumbPath = '/' + parts.slice(0, i + 1).join('/');
    breadcrumbs.push({
      name: parts[i],
      path: breadcrumbPath
    });
  }

  return breadcrumbs;
}

/**
 * Validate file operation
 */
export function validateFileOperation(node: FTPFileNode, operation: 'read' | 'write' | 'delete'): string | null {
  // Check permissions (simplified)
  const permissions = node.permissions || '';

  switch (operation) {
    case 'read':
      if (permissions.includes('r') || permissions.includes('4')) {
        return null;
      }
      return 'Permission denied: Cannot read file';

    case 'write':
      if (node.type === 'directory') {
        return 'Cannot write to directory';
      }
      if (permissions.includes('w') || permissions.includes('2')) {
        return null;
      }
      return 'Permission denied: Cannot write to file';

    case 'delete':
      if (permissions.includes('w') || permissions.includes('2')) {
        return null;
      }
      return 'Permission denied: Cannot delete file';

    default:
      return 'Unknown operation';
  }
}

/**
 * Check if file is too large for editing
 */
export function isFileTooLarge(node: FTPFileNode, maxSize: number = 10 * 1024 * 1024): boolean {
  return node.type === 'file' && node.size > maxSize;
}

/**
 * Get file MIME type from extension
 */
export function getMimeType(filename: string): string {
  const extension = getFileExtension(filename);

  const mimeTypes: Record<string, string> = {
    '.js': 'application/javascript',
    '.jsx': 'application/javascript',
    '.ts': 'application/typescript',
    '.tsx': 'application/typescript',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css': 'text/css',
    '.scss': 'text/scss',
    '.sass': 'text/sass',
    '.less': 'text/less',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.yaml': 'application/x-yaml',
    '.yml': 'application/x-yaml',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Create preview content for text files
 */
export function createTextPreview(content: string, maxLength: number = 1000): string {
  if (content.length <= maxLength) {
    return content;
  }

  return content.substring(0, maxLength) + '...';
}

/**
 * Create file preview object
 */
export function createFilePreview(node: FTPFileNode, content?: string): FilePreview {
  const preview: FilePreview = {
    path: node.path,
    name: node.name,
    type: node.type,
    size: node.size,
    lastModified: node.modified.toISOString(),
    permissions: node.permissions,
    mimeType: getMimeType(node.name)
  };

  if (isPreviewableFile(node) && content) {
    preview.preview = {
      available: true,
      content: createTextPreview(content)
    };
  } else {
    preview.preview = {
      available: false
    };
  }

  return preview;
}

/**
 * Expand all parent directories for a given path
 */
export function expandParentsForPath(nodes: FTPFileNode[], targetPath: string): FTPFileNode[] {
  const parentPaths = getParentPaths(targetPath);

  return nodes.map(node => {
    if (parentPaths.includes(node.path)) {
      return {
        ...node,
        isExpanded: true,
        children: node.children ? expandParentsForPath(node.children, targetPath) : undefined
      };
    }
    if (node.children) {
      return {
        ...node,
        children: expandParentsForPath(node.children, targetPath)
      };
    }
    return node;
  });
}