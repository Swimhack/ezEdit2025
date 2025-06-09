
import { useState, useEffect } from 'react';
import { Folder, File, RefreshCw, ChevronRight, ChevronDown } from 'lucide-react';

interface FileExplorerProps {
  connection: any;
  onFileSelect: (file: any) => void;
}

const FileExplorer = ({ connection, onFileSelect }: FileExplorerProps) => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  // Mock file structure for demo
  const mockFiles = [
    { name: 'index.html', type: 'file', size: '2.1 KB', modified: '2024-01-15' },
    { name: 'style.css', type: 'file', size: '1.5 KB', modified: '2024-01-14' },
    { name: 'script.js', type: 'file', size: '3.2 KB', modified: '2024-01-13' },
    { name: 'images', type: 'folder', children: [
      { name: 'logo.png', type: 'file', size: '15 KB', modified: '2024-01-10' },
      { name: 'hero.jpg', type: 'file', size: '45 KB', modified: '2024-01-09' }
    ]},
    { name: 'assets', type: 'folder', children: [
      { name: 'fonts', type: 'folder', children: [] },
      { name: 'icons', type: 'folder', children: [] }
    ]},
  ];

  useEffect(() => {
    if (connection) {
      loadFiles();
    }
  }, [connection, currentPath]);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would connect to your backend
      await new Promise(resolve => setTimeout(resolve, 500));
      setFiles(mockFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileItem = (item: any, depth = 0) => {
    const isExpanded = expandedFolders.has(item.name);
    
    return (
      <div key={item.name}>
        <div
          className={`flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer ${
            item.type === 'file' ? 'text-gray-700' : 'text-gray-900'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.name);
            } else {
              onFileSelect({ ...item, path: currentPath + item.name });
            }
          }}
        >
          {item.type === 'folder' && (
            <>
              {isExpanded ? (
                <ChevronDown size={16} className="text-gray-400" />
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )}
              <Folder size={16} className="text-blue-500" />
            </>
          )}
          {item.type === 'file' && (
            <>
              <span className="w-4" />
              <File size={16} className="text-gray-400" />
            </>
          )}
          <span className="flex-1 text-sm">{item.name}</span>
          {item.type === 'file' && (
            <span className="text-xs text-gray-400">{item.size}</span>
          )}
        </div>
        
        {item.type === 'folder' && isExpanded && item.children && (
          <div>
            {item.children.map((child: any) => renderFileItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!connection) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <div className="text-center">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No connection selected</h3>
          <p className="mt-1 text-sm text-gray-500">Select a connection to browse files.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Files</h3>
          <button
            onClick={loadFiles}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500 truncate">
          {connection.name} - {currentPath}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
            <p className="mt-1 text-sm text-gray-500">This directory appears to be empty.</p>
          </div>
        ) : (
          <div className="py-2">
            {files.map(item => renderFileItem(item))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
