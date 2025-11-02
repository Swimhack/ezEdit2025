'use client';

import { Button } from '@/components/ui/button';
import { FolderIcon, FileIcon, ChevronRightIcon, ChevronDownIcon, RefreshCwIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFileSystemStore, FileNode } from '@/lib/stores/fileSystemStore';
import { ConnectionManager } from '@/components/ConnectionManager';
import type { FTPConnection } from '@/types';
import type { WordPressConnection, WixConnection } from '@/types/cms';

function FileTreeNode({ node, level = 0 }: { node: FileNode; level?: number }) {
  const { expandedFolders, selectedFile, toggleFolder, selectFile } = useFileSystemStore();
  const isExpanded = expandedFolders.has(node.path);
  const isSelected = selectedFile === node.path;
  const isFolder = node.type === 'folder';

  const handleClick = () => {
    if (isFolder) {
      toggleFolder(node.path);
    } else {
      selectFile(node.path);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent rounded-sm ${
          isSelected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <span className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </span>
        )}
        {!isFolder && <span className="w-4" />}
        {isFolder ? (
          <FolderIcon className="h-4 w-4 flex-shrink-0 text-yellow-500" />
        ) : (
          <FileIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { files, isConnected, connectionType, setFiles, setConnected } = useFileSystemStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/files');
      const result = await response.json();
      
      if (result.success) {
        setFiles(result.data);
        setConnected(true, 'local');
      } else {
        setError(result.error || 'Failed to load files');
      }
    } catch (err) {
      setError('Failed to connect to file system');
      console.error('Error loading files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (connection: FTPConnection | WordPressConnection | WixConnection) => {
    setLoading(true);
    setError(null);
    
    try {
      let endpoint = '/api/ftp';
      let action = 'connect';
      
      if (connection.type === 'wordpress') {
        endpoint = '/api/wordpress';
      } else if (connection.type === 'wix') {
        endpoint = '/api/wix';
      }
      
      // Connect to the service
      const connectResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, config: connection }),
      });
      
      const connectResult = await connectResponse.json();
      
      if (!connectResult.success) {
        throw new Error(connectResult.error || 'Failed to connect');
      }
      
      // Get the file tree
      if (connection.type === 'ftp' || connection.type === 'sftp') {
        const listResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'list', path: '/' }),
        });
        const listResult = await listResponse.json();
        if (listResult.success) {
          setFiles(listResult.files);
        }
      } else {
        const treeResponse = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getTree' }),
        });
        const treeResult = await treeResponse.json();
        if (treeResult.success) {
          setFiles(treeResult.tree);
        }
      }
      
      setConnected(true, connection.type, connection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-load local files on mount
    loadFiles();
  }, []);

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm">File Explorer</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadFiles}
          disabled={loading}
          className="h-7 w-7 p-0"
        >
          <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Connection Section */}
      <div className="p-4 border-b space-y-2">
        {isConnected && (
          <div className="text-xs text-muted-foreground mb-2">
            Connected: {connectionType}
          </div>
        )}
        <ConnectionManager onConnect={handleConnect} />
        {!isConnected && (
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={loadFiles}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Load Local Files'}
          </Button>
        )}
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        {error && (
          <div className="text-sm text-red-500 text-center py-4 px-2">
            {error}
          </div>
        )}
        {!error && !isConnected && !loading && (
          <div className="text-sm text-muted-foreground text-center py-8">
            Connect to a server to browse files
          </div>
        )}
        {isConnected && files.length === 0 && !loading && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No files found
          </div>
        )}
        {isConnected && files.length > 0 && (
          <div className="space-y-0.5">
            {files.map((node) => (
              <FileTreeNode key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
