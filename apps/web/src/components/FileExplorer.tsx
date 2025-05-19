import React, { useState, useEffect } from 'react';
import { 
  Folder, File, ChevronRight, ChevronDown, 
  Plus, Trash2, FileEdit, RefreshCw 
} from 'lucide-react';
import type { FTPListItem, FTPResponse } from '../api/types';
import { ftpService } from '../api/ftp';
import { useSitesStore } from '../stores/sites';

interface FileExplorerProps {
  onSelectFile: (path: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onSelectFile }) => {
  const { currentSite } = useSitesStore();
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [files, setFiles] = useState<FTPListItem[]>([]);
  const [loadingFolders, setLoadingFolders] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['/']);
  const [showContextMenu, setShowContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    item: FTPListItem | null;
    path: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    item: null,
    path: ''
  });
  
  const fetchFiles = async (path: string = '/') => {
    if (!currentSite) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ftpService.listFiles(currentSite, path);
      
      if (response.success && response.data) {
        setFiles(response.data.sort((a, b) => {
          // Sort directories first, then files
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        }));
      } else {
        setError(response.error || 'Failed to load files');
      }
    } catch (err) {
      setError('An error occurred while fetching files');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchChildFolders = async (folderPath: string) => {
    if (!currentSite) return;
    
    setLoadingFolders(prev => ({ ...prev, [folderPath]: true }));
    
    try {
      const response = await ftpService.listFiles(currentSite, folderPath);
      
      if (response.success && response.data) {
        // Update the files state with the children for this folder
        const childFolders = response.data
          .sort((a, b) => a.name.localeCompare(b.name));
          
        // Currently we're not using this data directly, but we could merge it into 
        // a hierarchical state if we wanted to show a full tree view
        return childFolders;
      }
    } catch (err) {
      console.error(`Error fetching children for ${folderPath}:`, err);
    } finally {
      setLoadingFolders(prev => ({ ...prev, [folderPath]: false }));
    }

    return [];
  };
  
  const toggleFolder = async (folderPath: string) => {
    const isExpanded = expandedFolders[folderPath];
    
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !isExpanded
    }));
    
    if (!isExpanded) {
      // Fetch children when expanding
      await fetchChildFolders(folderPath);
    }
  };
  
  const handleFileClick = (file: FTPListItem, path: string) => {
    if (file.type === 'directory') {
      const fullPath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
      setCurrentPath(fullPath);
      setBreadcrumbs(prev => [...prev, file.name]);
      fetchFiles(fullPath);
    } else {
      const fullPath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;
      onSelectFile(fullPath);
    }
  };
  
  const navigateToBreadcrumb = (index: number) => {
    if (index < 0) return;
    
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    let newPath = '/';
    
    if (index > 0) {
      newPath = '/' + newBreadcrumbs.slice(1).join('/');
    }
    
    setCurrentPath(newPath);
    setBreadcrumbs(newBreadcrumbs);
    fetchFiles(newPath);
  };
  
  const handleContextMenu = (e: React.MouseEvent, item: FTPListItem, path: string) => {
    e.preventDefault();
    
    setShowContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item,
      path
    });
  };
  
  const closeContextMenu = () => {
    setShowContextMenu(prev => ({ ...prev, visible: false }));
  };
  
  // Handle creating new file or folder
  const handleCreateNew = async (type: 'file' | 'directory') => {
    if (!currentSite || !showContextMenu.item) return;
    
    const name = prompt(`Enter ${type} name:`);
    
    if (name) {
      const parentPath = showContextMenu.path;
      const newPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
      
      if (type === 'directory') {
        try {
          const response = await ftpService.createDirectory(currentSite, newPath);
          if (response.success) {
            fetchFiles(currentPath);
          } else {
            setError(response.error || `Failed to create directory: ${name}`);
          }
        } catch (err) {
          setError('An error occurred while creating directory');
          console.error(err);
        }
      } else {
        // For files, we just create an empty file
        try {
          const response = await ftpService.uploadFile(currentSite, newPath, '');
          if (response.success) {
            fetchFiles(currentPath);
            onSelectFile(newPath); // Open the new file in editor
          } else {
            setError(response.error || `Failed to create file: ${name}`);
          }
        } catch (err) {
          setError('An error occurred while creating file');
          console.error(err);
        }
      }
    }
    
    closeContextMenu();
  };
  
  // Handle rename
  const handleRename = async () => {
    if (!currentSite || !showContextMenu.item) return;
    
    const newName = prompt('Enter new name:', showContextMenu.item.name);
    
    if (newName && newName !== showContextMenu.item.name) {
      const oldPath = showContextMenu.path;
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${parentPath}/${newName}`;
      
      try {
        const response = await ftpService.rename(currentSite, oldPath, newPath);
        if (response.success) {
          fetchFiles(currentPath);
        } else {
          setError(response.error || `Failed to rename: ${showContextMenu.item.name}`);
        }
      } catch (err) {
        setError('An error occurred while renaming');
        console.error(err);
      }
    }
    
    closeContextMenu();
  };
  
  // Handle delete
  const handleDelete = async () => {
    if (!currentSite || !showContextMenu.item) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${showContextMenu.item.name}"?`);
    
    if (confirmed) {
      try {
        const response = await ftpService.deleteItem(
          currentSite, 
          showContextMenu.path, 
          showContextMenu.item.type
        );
        
        if (response.success) {
          fetchFiles(currentPath);
        } else {
          setError(response.error || `Failed to delete: ${showContextMenu.item.name}`);
        }
      } catch (err) {
        setError('An error occurred while deleting');
        console.error(err);
      }
    }
    
    closeContextMenu();
  };
  
  // Click outside to close context menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      closeContextMenu();
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Fetch files when component mounts or current site changes
  useEffect(() => {
    if (currentSite) {
      fetchFiles('/');
      setCurrentPath('/');
      setBreadcrumbs(['/']);
    }
  }, [currentSite]);
  
  // If no current site, show message
  if (!currentSite) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Please select a site to explore files</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb navigation */}
      <div className="flex items-center mb-2 overflow-x-auto pb-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="mx-1 text-gray-400">/</span>
            )}
            <button
              className="hover:underline truncate"
              onClick={() => navigateToBreadcrumb(index)}
            >
              {crumb === '/' ? 'Root' : crumb}
            </button>
          </React.Fragment>
        ))}
      </div>
      
      {/* Action bar */}
      <div className="flex mb-2">
        <button 
          onClick={() => fetchFiles(currentPath)}
          className="p-1 rounded hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
        
        <button 
          onClick={() => handleCreateNew('directory')}
          className="p-1 rounded hover:bg-gray-100 ml-2"
          title="New Folder"
        >
          <Folder className="w-4 h-4 text-gray-500" />
          <Plus className="w-3 h-3 text-gray-500 absolute -mt-1 -ml-1" />
        </button>
        
        <button 
          onClick={() => handleCreateNew('file')}
          className="p-1 rounded hover:bg-gray-100 ml-1"
          title="New File"
        >
          <File className="w-4 h-4 text-gray-500" />
          <Plus className="w-3 h-3 text-gray-500 absolute -mt-1 -ml-1" />
        </button>
      </div>
      
      {/* File list container */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : files.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>This folder is empty</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {files.map(file => (
              <li 
                key={file.name}
                className="px-2 py-1 flex items-center hover:bg-gray-50 cursor-pointer group"
                onClick={() => handleFileClick(file, currentPath)}
                onContextMenu={e => handleContextMenu(e, file, `${currentPath === '/' ? '' : currentPath}/${file.name}`)}
              >
                {file.type === 'directory' ? (
                  <>
                    <button
                      className="p-1"
                      onClick={e => {
                        e.stopPropagation();
                        toggleFolder(`${currentPath === '/' ? '' : currentPath}/${file.name}`);
                      }}
                    >
                      {expandedFolders[`${currentPath === '/' ? '' : currentPath}/${file.name}`] ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <Folder className="w-5 h-5 mr-2 text-primary-500" />
                  </>
                ) : (
                  <>
                    <span className="w-4 mr-1"></span>
                    <File className="w-5 h-5 mr-2 text-gray-500" />
                  </>
                )}
                <span className="text-sm truncate">{file.name}</span>
                
                {/* Quick actions that appear on hover */}
                <div className="ml-auto hidden group-hover:flex">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowContextMenu({
                        visible: true,
                        x: 0,
                        y: 0,
                        item: file,
                        path: `${currentPath === '/' ? '' : currentPath}/${file.name}`
                      });
                      handleRename();
                    }}
                    className="p-1 rounded hover:bg-gray-200"
                    title="Rename"
                  >
                    <FileEdit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowContextMenu({
                        visible: true,
                        x: 0,
                        y: 0,
                        item: file,
                        path: `${currentPath === '/' ? '' : currentPath}/${file.name}`
                      });
                      handleDelete();
                    }}
                    className="p-1 rounded hover:bg-gray-200"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Context menu */}
      {showContextMenu.visible && showContextMenu.item && (
        <div 
          className="fixed bg-white shadow-lg rounded-md py-1 z-50 w-48 border border-gray-200"
          style={{ 
            top: `${showContextMenu.y}px`, 
            left: `${showContextMenu.x}px` 
          }}
        >
          <ul>
            <li className="px-3 py-1 text-xs font-medium text-gray-500 border-b truncate">
              {showContextMenu.item.name}
            </li>
            
            <li>
              <button 
                onClick={handleRename}
                className="px-3 py-1.5 w-full text-left hover:bg-gray-100 flex items-center"
              >
                <FileEdit className="w-4 h-4 mr-2 text-gray-500" />
                <span>Rename</span>
              </button>
            </li>
            
            <li>
              <button 
                onClick={handleDelete}
                className="px-3 py-1.5 w-full text-left hover:bg-gray-100 text-red-600 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span>Delete</span>
              </button>
            </li>
            
            {showContextMenu.item.type === 'directory' && (
              <li>
                <button 
                  onClick={() => handleCreateNew('file')}
                  className="px-3 py-1.5 w-full text-left hover:bg-gray-100 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2 text-gray-500" />
                  <span>New File Here</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
