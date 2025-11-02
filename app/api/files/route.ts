import { NextRequest, NextResponse } from 'next/server';
import { FileNode } from '@/lib/stores/fileSystemStore';

// Mock file system data for demonstration
// In production, this would connect to FTP/S3/SFTP
const mockFileSystem: FileNode[] = [
  {
    id: 'root-1',
    name: 'public',
    path: '/public',
    type: 'folder',
    children: [
      {
        id: 'file-1',
        name: 'index.html',
        path: '/public/index.html',
        type: 'file',
        size: 2048,
        modified: new Date('2025-01-15'),
      },
      {
        id: 'file-2',
        name: 'styles.css',
        path: '/public/styles.css',
        type: 'file',
        size: 1024,
        modified: new Date('2025-01-14'),
      },
      {
        id: 'folder-2',
        name: 'images',
        path: '/public/images',
        type: 'folder',
        children: [
          {
            id: 'file-3',
            name: 'logo.png',
            path: '/public/images/logo.png',
            type: 'file',
            size: 15360,
            modified: new Date('2025-01-10'),
          },
          {
            id: 'file-4',
            name: 'hero.jpg',
            path: '/public/images/hero.jpg',
            type: 'file',
            size: 51200,
            modified: new Date('2025-01-10'),
          },
        ],
      },
    ],
  },
  {
    id: 'root-2',
    name: 'src',
    path: '/src',
    type: 'folder',
    children: [
      {
        id: 'file-5',
        name: 'main.js',
        path: '/src/main.js',
        type: 'file',
        size: 4096,
        modified: new Date('2025-01-16'),
      },
      {
        id: 'file-6',
        name: 'config.json',
        path: '/src/config.json',
        type: 'file',
        size: 512,
        modified: new Date('2025-01-12'),
      },
      {
        id: 'folder-3',
        name: 'components',
        path: '/src/components',
        type: 'folder',
        children: [
          {
            id: 'file-7',
            name: 'Header.jsx',
            path: '/src/components/Header.jsx',
            type: 'file',
            size: 2048,
            modified: new Date('2025-01-15'),
          },
          {
            id: 'file-8',
            name: 'Footer.jsx',
            path: '/src/components/Footer.jsx',
            type: 'file',
            size: 1536,
            modified: new Date('2025-01-14'),
          },
        ],
      },
    ],
  },
  {
    id: 'file-9',
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    size: 3072,
    modified: new Date('2025-01-01'),
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');

    // If path is specified, return only that directory's contents
    if (path) {
      // Find the folder at the specified path
      const folder = findNodeByPath(mockFileSystem, path);
      if (folder && folder.type === 'folder') {
        return NextResponse.json({ 
          success: true, 
          data: folder.children || [] 
        });
      }
      return NextResponse.json(
        { success: false, error: 'Folder not found' },
        { status: 404 }
      );
    }

    // Return root level files
    return NextResponse.json({ 
      success: true, 
      data: mockFileSystem 
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// Helper function to find a node by path
function findNodeByPath(nodes: FileNode[], path: string): FileNode | null {
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
