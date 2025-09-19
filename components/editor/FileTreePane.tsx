/**
 * FileTreePane - Left pane component for FTP file tree navigation
 * Displays hierarchical file tree with expand/collapse and file selection
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useFileTree, useFileOperations, useEditor } from '@/lib/editor-state';
import { FTPFileNode } from '@/lib/editor-types';
import {
  getFileIcon,
  isEditableFile,
  formatFileSize,
  formatDate,
  filterFileTree,
  getBreadcrumbs,
  validateFileOperation
} from '@/lib/file-operations';

export default function FileTreePane() {
  const { fileTree, isLoading, expandDirectory, collapseDirectory } = useFileTree();
  const { selectFile, loadFile, selectedFile, currentFile } = useFileOperations();
  const { actions } = useEditor();

  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Filter file tree based on search
  const filteredFileTree = useMemo(() => {
    if (!searchTerm.trim()) return fileTree;
    return filterFileTree(fileTree, searchTerm);
  }, [fileTree, searchTerm]);

  // Handle file/directory click
  const handleNodeClick = useCallback(async (node: FTPFileNode, event: React.MouseEvent) => {
    event.stopPropagation();

    if (node.type === 'directory') {
      if (node.isExpanded) {
        collapseDirectory(node.path);
      } else {
        await expandDirectory(node.path);
      }
    } else {
      // Select file
      selectFile(node.path);

      // Double-click to open file for editing
      if (event.detail === 2 && isEditableFile(node)) {
        const validation = validateFileOperation(node, 'read');
        if (validation) {
          actions.setError(validation);
          return;
        }

        try {
          await loadFile(node.path);
        } catch (error) {
          actions.setError(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  }, [expandDirectory, collapseDirectory, selectFile, loadFile, actions]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, node: FTPFileNode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNodeClick(node, event as any);
    }
  }, [handleNodeClick]);

  // Context menu (right-click) handling
  const handleContextMenu = useCallback((event: React.MouseEvent, node: FTPFileNode) => {
    event.preventDefault();
    // TODO: Implement context menu for file operations
    console.log('Context menu for:', node.path);
  }, []);

  return (
    <div className="h-full flex flex-col bg-white" data-testid="file-tree-pane">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Files</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1 rounded hover:bg-gray-100"
            title="Search files"
            data-testid="search-toggle"
          >
            🔍
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-1 rounded hover:bg-gray-100"
            title="Refresh"
            data-testid="refresh-button"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 border-b border-gray-200">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="search-input"
          />
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-auto" data-testid="file-tree-container">
        {isLoading && fileTree.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading files...</p>
            </div>
          </div>
        ) : filteredFileTree.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-gray-500">
              {searchTerm ? 'No files match your search' : 'No files found'}
            </p>
          </div>
        ) : (
          <FileTreeNodeList
            nodes={filteredFileTree}
            level={0}
            onNodeClick={handleNodeClick}
            onKeyDown={handleKeyDown}
            onContextMenu={handleContextMenu}
            selectedFile={selectedFile}
            currentFile={currentFile}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500">
        {filteredFileTree.length} items
        {searchTerm && ` (filtered)`}
      </div>
    </div>
  );
}

/**
 * Recursive file tree node list component
 */
interface FileTreeNodeListProps {
  nodes: FTPFileNode[];
  level: number;
  onNodeClick: (node: FTPFileNode, event: React.MouseEvent) => void;
  onKeyDown: (event: React.KeyboardEvent, node: FTPFileNode) => void;
  onContextMenu: (event: React.MouseEvent, node: FTPFileNode) => void;
  selectedFile: string | null;
  currentFile: string | null;
}

function FileTreeNodeList({
  nodes,
  level,
  onNodeClick,
  onKeyDown,
  onContextMenu,
  selectedFile,
  currentFile
}: FileTreeNodeListProps) {
  return (
    <div>
      {nodes.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          level={level}
          onNodeClick={onNodeClick}
          onKeyDown={onKeyDown}
          onContextMenu={onContextMenu}
          selectedFile={selectedFile}
          currentFile={currentFile}
        />
      ))}
    </div>
  );
}

/**
 * Individual file tree node component
 */
interface FileTreeNodeProps {
  node: FTPFileNode;
  level: number;
  onNodeClick: (node: FTPFileNode, event: React.MouseEvent) => void;
  onKeyDown: (event: React.KeyboardEvent, node: FTPFileNode) => void;
  onContextMenu: (event: React.MouseEvent, node: FTPFileNode) => void;
  selectedFile: string | null;
  currentFile: string | null;
}

function FileTreeNode({
  node,
  level,
  onNodeClick,
  onKeyDown,
  onContextMenu,
  selectedFile,
  currentFile
}: FileTreeNodeProps) {
  const isSelected = selectedFile === node.path;
  const isCurrent = currentFile === node.path;
  const isEditable = isEditableFile(node);

  const icon = getFileIcon(node);
  const indent = level * 16;

  return (
    <div data-testid={`file-node-${node.type}-${node.name}`}>
      {/* Node itself */}
      <div
        className={`flex items-center py-1 px-2 text-sm cursor-pointer hover:bg-gray-100 ${
          isSelected ? 'bg-blue-100 text-blue-900' : ''
        } ${isCurrent ? 'font-semibold' : ''}`}
        style={{ paddingLeft: `${8 + indent}px` }}
        onClick={(e) => onNodeClick(node, e)}
        onKeyDown={(e) => onKeyDown(e, node)}
        onContextMenu={(e) => onContextMenu(e, node)}
        tabIndex={0}
        role="treeitem"
        aria-expanded={node.type === 'directory' ? node.isExpanded : undefined}
        aria-selected={isSelected}
        data-testid={
          node.type === 'directory'
            ? `directory-${node.name}`
            : `file-${node.name.replace(/\./g, '-')}`
        }
      >
        {/* Expand/collapse icon for directories */}
        {node.type === 'directory' && (
          <span className="w-4 h-4 flex items-center justify-center mr-1 text-gray-500">
            {node.isExpanded ? '▼' : '▶'}
          </span>
        )}

        {/* File/directory icon */}
        <span className="mr-2" role="img" aria-label={node.type}>
          {icon}
        </span>

        {/* File/directory name */}
        <span className={`flex-1 truncate ${!isEditable && node.type === 'file' ? 'text-gray-500' : ''}`}>
          {node.name}
        </span>

        {/* File size (for files only) */}
        {node.type === 'file' && (
          <span className="text-xs text-gray-400 ml-2">
            {formatFileSize(node.size)}
          </span>
        )}

        {/* Current file indicator */}
        {isCurrent && (
          <span className="ml-2 text-blue-600" title="Currently editing">
            ●
          </span>
        )}
      </div>

      {/* Children (for expanded directories) */}
      {node.type === 'directory' && node.isExpanded && node.children && (
        <div data-testid="directory-contents">
          <FileTreeNodeList
            nodes={node.children}
            level={level + 1}
            onNodeClick={onNodeClick}
            onKeyDown={onKeyDown}
            onContextMenu={onContextMenu}
            selectedFile={selectedFile}
            currentFile={currentFile}
          />
        </div>
      )}
    </div>
  );
}

/**
 * File tree breadcrumb navigation
 */
interface BreadcrumbProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function FileTreeBreadcrumb({ currentPath, onNavigate }: BreadcrumbProps) {
  const breadcrumbs = getBreadcrumbs(currentPath);

  return (
    <div className="flex items-center space-x-1 text-sm text-gray-600 p-2 border-b border-gray-200">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          {index > 0 && <span className="text-gray-400">/</span>}
          <button
            onClick={() => onNavigate(crumb.path)}
            className={`hover:text-blue-600 ${
              index === breadcrumbs.length - 1 ? 'font-semibold' : ''
            }`}
            data-testid={`breadcrumb-${index}`}
          >
            {crumb.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}