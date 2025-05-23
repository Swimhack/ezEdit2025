import React, { useEffect, useState } from 'react';
import { Folder, File, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import * as localFs from '../lib/mcpLocalFs';
import * as ftpFs from '../lib/mcpFtp';
import type { EditorMode } from './ModeToggle';
import type { Site } from '../stores/sites';

interface FileTreeProps {
  onOpen: (path: string, content: string) => void;
  mode: EditorMode;
  currentSite?: Site | null;
  basePath?: string;
}

export default function FileTree({ 
  onOpen, 
  mode, 
  currentSite, 
  basePath = mode === 'local' ? '.' : '/' 
}: FileTreeProps) {
  const [entries, setEntries] = useState<Array<{name: string; type: string; path: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Reset state when mode changes
  useEffect(() => {
    setEntries([]);
    setError(null);
    setExpandedFolders({});
  }, [mode]);

  // Load files/directories when mode or path changes
  useEffect(() => {
    if (mode === 'ftp' && !currentSite) {
      setLoading(false);
      setError('No FTP site selected');
      return;
    }

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // Set credentials if in FTP mode
        if (mode === 'ftp' && currentSite) {
          await ftpFs.setFtpCredentials(currentSite);
        }

        // Get directory listing based on mode
        const items = mode === 'local' 
          ? await localFs.listDir(basePath)
          : await ftpFs.listDir(basePath);

        // Transform to common format
        const formattedEntries = items.map(item => ({
          name: item.name,
          type: item.type || (item.isDirectory ? 'directory' : 'file'),
          path: mode === 'local'
            ? `${basePath === '.' ? '' : basePath + '/'}${item.name}`
            : `${basePath === '/' ? '/' : basePath + '/'}${item.name}`
        }));

        // Sort: directories first, then alphabetically
        formattedEntries.sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });

        setEntries(formattedEntries);
      } catch (err) {
        console.error(`Error listing ${mode} directory:`, err);
        setError(`Failed to list ${mode === 'local' ? 'local' : 'FTP'} directory`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mode, basePath, currentSite]);

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleFileClick = async (item: { name: string; type: string; path: string }) => {
    if (item.type === 'directory') {
      // Handle directory expansion here if needed
      toggleFolder(item.path);
      return;
    }

    try {
      // Read file based on mode
      const content = mode === 'local'
        ? await localFs.readFile(item.path)
        : await ftpFs.readFile(item.path);
      
      onOpen(item.path, content);
    } catch (err) {
      console.error(`Error reading ${mode} file ${item.path}:`, err);
      setError(`Failed to read file: ${item.name}`);
    }
  };

  const handleRefresh = () => {
    // Force re-fetch by triggering the useEffect
    setLoading(true);
  };

  if (loading) {
    return <div className="p-2 text-sm text-gray-500">Loading files...</div>;
  }

  if (error) {
    return (
      <div className="p-2">
        <div className="text-red-500 text-sm mb-2">{error}</div>
        <button 
          onClick={handleRefresh}
          className="px-2 py-1 bg-gray-700 text-white text-xs rounded flex items-center"
        >
          <RefreshCw className="w-3 h-3 mr-1" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <div className="p-2 border-b border-gray-600 flex justify-between items-center">
        <h3 className="font-medium">
          {mode === 'local' ? 'Local Files' : currentSite?.name || 'FTP Files'}
        </h3>
        <button 
          className="p-1 rounded hover:bg-gray-700"
          onClick={handleRefresh}
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="p-2 text-sm text-gray-500">No files found</div>
      ) : (
        <ul className="overflow-auto max-h-[calc(100vh-200px)]">
          {entries.map(item => (
            <li
              key={item.path}
              className="group cursor-pointer hover:bg-gray-700 px-3 py-1.5 flex items-center"
              onClick={() => handleFileClick(item)}
            >
              {item.type === 'directory' ? (
                <>
                  <button
                    className="w-4 h-4 mr-1 flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolder(item.path);
                    }}
                  >
                    {expandedFolders[item.path] ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <Folder className="w-5 h-5 mr-2 text-blue-400" />
                </>
              ) : (
                <>
                  <span className="w-4 mr-1"></span>
                  <File className="w-5 h-5 mr-2 text-gray-400" />
                </>
              )}
              <span className="truncate">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
