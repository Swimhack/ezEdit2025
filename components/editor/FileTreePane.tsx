/**
 * FileTreePane - VS Code-style file explorer sidebar
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
      console.log('[FileTree] Directory clicked:', node.path, node.isExpanded ? 'collapsing' : 'expanding');
      if (node.isExpanded) {
        collapseDirectory(node.path);
      } else {
        await expandDirectory(node.path);
      }
    } else {
      console.log('[FileTree] File clicked:', node.path, 'editable:', isEditableFile(node));
      
      // Select file
      selectFile(node.path);

      // Single-click to open file for editing (WYSIWYG)
      if (isEditableFile(node)) {
        const validation = validateFileOperation(node, 'read');
        if (validation) {
          console.error('[FileTree] File validation failed:', validation);
          actions.setError(validation);
          return;
        }

        try {
          console.log('[FileTree] Loading file content...');
          await loadFile(node.path);
          console.log('[FileTree] File loaded successfully');
        } catch (error) {
          console.error('[FileTree] Failed to load file:', error);
          actions.setError(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else {
        console.log('[FileTree] File is not editable, skipping load');
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
    <div className="h-full flex flex-col bg-[#252526] text-[#cccccc]" data-testid="file-tree-pane">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#3e3e42]">
        <h3 className="text-xs font-semibold uppercase text-[#858585] tracking-wider">Explorer</h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 rounded hover:bg-[#37373d] text-[#cccccc] transition-colors"
            title="Search files"
            data-testid="search-toggle"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-1.5 rounded hover:bg-[#37373d] text-[#cccccc] transition-colors"
            title="Refresh"
            data-testid="refresh-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-[#3e3e42]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search files..."
            className="w-full px-2 py-1.5 bg-[#3c3c3c] border border-[#3e3e42] rounded text-sm text-[#cccccc] placeholder-[#858585] focus:outline-none focus:border-[#007acc]"
            data-testid="search-input"
          />
        </div>
      )}

      {/* File Tree */}
      <div className="flex-1 overflow-auto" data-testid="file-tree-container">
        {isLoading && fileTree.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#007acc] mx-auto mb-2"></div>
              <p className="text-sm text-[#858585]">Loading files...</p>
            </div>
          </div>
        ) : filteredFileTree.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-[#858585]">
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
 * Individual file tree node component - VS Code style
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
        className={`flex items-center py-0.5 px-2 text-sm cursor-pointer transition-colors ${
          isSelected || isCurrent
            ? 'bg-[#37373d] text-[#ffffff]'
            : 'hover:bg-[#2a2d2e] text-[#cccccc]'
        }`}
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
          <span className="w-4 h-4 flex items-center justify-center mr-1 text-[#858585] text-xs">
            {node.isExpanded ? '▼' : '▶'}
          </span>
        )}

        {/* File/directory icon */}
        <span className="mr-1.5 text-base" role="img" aria-label={node.type}>
          {icon}
        </span>

        {/* File/directory name */}
        <span className={`flex-1 truncate ${!isEditable && node.type === 'file' ? 'text-[#858585]' : ''}`}>
          {node.name}
        </span>

        {/* Current file indicator */}
        {isCurrent && (
          <span className="ml-2 text-[#007acc]" title="Currently editing">
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
