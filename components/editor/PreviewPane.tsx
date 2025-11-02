/**
 * PreviewPane - Right pane component for file metadata and preview
 * Displays file information, content preview, and additional metadata
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useFileOperations, useEditor } from '@/lib/editor-state';
import { FilePreview } from '@/lib/editor-types';
import {
  getFileIcon,
  isPreviewableFile,
  formatFileSize,
  formatDate,
  getMimeType,
  createTextPreview
} from '@/lib/file-operations';
import { getLanguageFromFilename, getLanguageIcon } from '@/types/monaco';

export default function PreviewPane() {
  const { selectedFile, currentFile } = useFileOperations();
  const { state, actions } = useEditor();

  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<'info' | 'preview' | 'history'>('info');

  const activeFile = currentFile || selectedFile;

  // Load file preview when file selection changes
  useEffect(() => {
    if (activeFile) {
      loadFilePreview(activeFile);
    } else {
      setFilePreview(null);
    }
  }, [activeFile]);

  const loadFilePreview = useCallback(async (filePath: string) => {
    setIsLoading(true);
    try {
      const preview = await actions.loadFilePreview(filePath);
      setFilePreview(preview);
    } catch (error) {
      console.error('Failed to load file preview:', error);
      setFilePreview(null);
    } finally {
      setIsLoading(false);
    }
  }, [actions]);

  // Get file node from tree
  const getFileNode = useCallback(() => {
    if (!activeFile) return null;
    return findFileInTree(state.fileTree, activeFile);
  }, [activeFile, state.fileTree]);

  const fileNode = getFileNode();

  // Show no file selected state
  if (!activeFile) {
    return (
      <div className="h-full flex flex-col bg-white" data-testid="preview-pane">
        <div className="p-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Preview</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">👁️</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No File Selected</h3>
            <p className="text-gray-600">Select a file to view its details and preview</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white" data-testid="preview-pane">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-gray-900">Preview</h3>
          {currentFile === activeFile && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Editing
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200" data-testid="preview-tabs">
        {[
          { key: 'info', label: 'Info', icon: 'ℹ️' },
          { key: 'preview', label: 'Preview', icon: '👁️' },
          { key: 'history', label: 'History', icon: '🕒' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setPreviewTab(tab.key as any)}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
              previewTab === tab.key
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            data-testid={`preview-tab-${tab.key}`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto" data-testid="preview-content">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading preview...</p>
            </div>
          </div>
        ) : (
          <>
            {previewTab === 'info' && (
              <FileInfoTab fileNode={fileNode} filePreview={filePreview} />
            )}
            {previewTab === 'preview' && (
              <FilePreviewTab fileNode={fileNode} filePreview={filePreview} />
            )}
            {previewTab === 'history' && (
              <FileHistoryTab fileNode={fileNode} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * File Information Tab
 */
interface FileInfoTabProps {
  fileNode: any;
  filePreview: FilePreview | null;
}

function FileInfoTab({ fileNode, filePreview }: FileInfoTabProps) {
  if (!fileNode || !fileNode.name) return null;

  const mimeType = getMimeType(fileNode.name);
  const language = getLanguageFromFilename(fileNode.name);
  const icon = getFileIcon(fileNode);

  return (
    <div className="p-4 space-y-4" data-testid="file-info-tab">
      {/* File Header */}
      <div className="flex items-start space-x-3">
        <span className="text-2xl" role="img" aria-label={fileNode.type}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate" title={fileNode.name}>
            {fileNode.name}
          </h4>
          <p className="text-sm text-gray-500 truncate" title={fileNode.path}>
            {fileNode.path}
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="space-y-2">
        <h5 className="font-medium text-gray-900">File Details</h5>
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Type:</span>
            <span className="text-gray-900 capitalize">{fileNode.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Size:</span>
            <span className="text-gray-900">{formatFileSize(fileNode.size)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Modified:</span>
            <span className="text-gray-900">{formatDate(fileNode.modified)}</span>
          </div>
          {fileNode.permissions && (
            <div className="flex justify-between">
              <span className="text-gray-600">Permissions:</span>
              <span className="text-gray-900 font-mono">{fileNode.permissions}</span>
            </div>
          )}
        </div>
      </div>

      {/* Technical Information */}
      {fileNode.type === 'file' && (
        <div className="space-y-2">
          <h5 className="font-medium text-gray-900">Technical Info</h5>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">MIME Type:</span>
              <span className="text-gray-900 font-mono text-xs">{mimeType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Language:</span>
              <span className="text-gray-900 capitalize">{language}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Editable:</span>
              <span className={`${isPreviewableFile(fileNode) ? 'text-green-600' : 'text-red-600'}`}>
                {isPreviewableFile(fileNode) ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <h5 className="font-medium text-gray-900">Quick Actions</h5>
        <div className="space-y-2">
          <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded">
            📋 Copy Path
          </button>
          <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded">
            📁 Show in Tree
          </button>
          {fileNode.type === 'file' && isPreviewableFile(fileNode) && (
            <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded">
              📝 Open for Editing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * File Preview Tab
 */
interface FilePreviewTabProps {
  fileNode: any;
  filePreview: FilePreview | null;
}

function FilePreviewTab({ fileNode, filePreview }: FilePreviewTabProps) {
  if (!fileNode || !fileNode.name) return null;

  if (fileNode.type === 'directory') {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">📁</div>
          <h4 className="font-medium text-gray-900 mb-2">Directory</h4>
          <p className="text-gray-600 text-sm">
            Directories cannot be previewed. Select a file to see its content.
          </p>
        </div>
      </div>
    );
  }

  if (!isPreviewableFile(fileNode)) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">🚫</div>
          <h4 className="font-medium text-gray-900 mb-2">No Preview Available</h4>
          <p className="text-gray-600 text-sm">
            This file type cannot be previewed in the text editor.
          </p>
        </div>
      </div>
    );
  }

  if (!filePreview?.preview?.available) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">⏳</div>
          <h4 className="font-medium text-gray-900 mb-2">Preview Loading</h4>
          <p className="text-gray-600 text-sm">
            File preview is being generated...
          </p>
        </div>
      </div>
    );
  }

  const mimeType = getMimeType(fileNode.name || '');
  const isImage = mimeType.startsWith('image/');

  return (
    <div className="p-4" data-testid="file-preview-tab">
      {isImage ? (
        <div className="space-y-3">
          <h5 className="font-medium text-gray-900">Image Preview</h5>
          {filePreview.preview.thumbnail ? (
            <div className="border rounded-lg overflow-hidden">
              <img
                src={`data:${mimeType};base64,${filePreview.preview.thumbnail}`}
                alt={fileNode.name}
                className="w-full h-auto max-h-64 object-contain"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-2xl mb-2">🖼️</div>
              <p className="text-gray-600 text-sm">Image preview not available</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-900">Content Preview</h5>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {(fileNode?.name ? getLanguageFromFilename(fileNode.name) : 'plaintext').toUpperCase()}
            </span>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <pre className="p-3 text-xs font-mono bg-gray-50 overflow-auto max-h-96 whitespace-pre-wrap">
              <code>{filePreview.preview.content || 'No content available'}</code>
            </pre>
          </div>
          {filePreview.preview.content && filePreview.preview.content.endsWith('...') && (
            <p className="text-xs text-gray-500 text-center">
              Preview truncated. Open file to see full content.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * File History Tab
 */
interface FileHistoryTabProps {
  fileNode: any;
}

function FileHistoryTab({ fileNode }: FileHistoryTabProps) {
  if (!fileNode) return null;

  return (
    <div className="p-4" data-testid="file-history-tab">
      <div className="space-y-3">
        <h5 className="font-medium text-gray-900">Recent Activity</h5>

        <div className="space-y-2">
          <div className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">File modified</p>
              <p className="text-xs text-gray-500">{formatDate(fileNode.modified)}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">File accessed</p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Full history tracking coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to find file in tree recursively
 */
function findFileInTree(nodes: any[], targetPath: string): any {
  for (const node of nodes) {
    if (node.path === targetPath) {
      return node;
    }
    if (node.children) {
      const found = findFileInTree(node.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}