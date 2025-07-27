'use client'

import React, { useState, useEffect } from 'react'
import { useFileSystemStore, useFTPStore, useEditorStore } from '@/store'
import { FileNode } from '@/types'
import { 
  Folder, 
  FolderOpen, 
  File, 
  Plus, 
  RefreshCw, 
  Settings,
  ChevronRight,
  ChevronDown,
  Loader2
} from 'lucide-react'

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  const iconMap: Record<string, string> = {
    js: '🟨',
    jsx: '⚛️',
    ts: '🔷',
    tsx: '⚛️',
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    sass: '🎨',
    json: '📋',
    md: '📝',
    php: '🐘',
    py: '🐍',
    rb: '💎',
    go: '🐹',
    java: '☕',
    cpp: '⚙️',
    c: '⚙️',
    sh: '🐚',
    sql: '🗃️',
    xml: '📄',
    yaml: '📄',
    yml: '📄',
    txt: '📄',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    pdf: '📕',
    zip: '📦',
    rar: '📦',
    tar: '📦',
    gz: '📦',
  }
  
  return iconMap[ext || ''] || '📄'
}

interface FileTreeItemProps {
  file: FileNode
  level: number
  onFileSelect: (file: FileNode) => void
  onFolderToggle: (file: FileNode) => void
  expandedFolders: Set<string>
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  level,
  onFileSelect,
  onFolderToggle,
  expandedFolders,
}) => {
  const isExpanded = expandedFolders.has(file.id)
  const hasChildren = file.children && file.children.length > 0

  const handleClick = () => {
    if (file.type === 'directory') {
      onFolderToggle(file)
    } else {
      onFileSelect(file)
    }
  }

  return (
    <div>
      <div
        className={`
          flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
          text-sm select-none
        `}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {file.type === 'directory' && (
          <span className="mr-1 text-gray-400">
            {hasChildren ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : (
              <div className="w-3.5" />
            )}
          </span>
        )}
        
        <span className="mr-2">
          {file.type === 'directory' ? (
            isExpanded ? <FolderOpen size={16} className="text-blue-500" /> : <Folder size={16} className="text-blue-500" />
          ) : (
            <span className="text-base">{getFileIcon(file.name)}</span>
          )}
        </span>
        
        <span className="flex-1 truncate text-gray-700 dark:text-gray-300">
          {file.name}
        </span>
        
        {file.type === 'file' && file.size && (
          <span className="text-xs text-gray-400 ml-2">
            {formatFileSize(file.size)}
          </span>
        )}
      </div>
      
      {file.type === 'directory' && isExpanded && file.children && (
        <div>
          {file.children.map((child) => (
            <FileTreeItem
              key={child.id}
              file={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              onFolderToggle={onFolderToggle}
              expandedFolders={expandedFolders}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function FileExplorer() {
  const { activeConnection } = useFTPStore()
  const { files, expandedFolders, loading, toggleFolder } = useFileSystemStore()
  const { addOpenFile } = useEditorStore()
  const [refreshing, setRefreshing] = useState(false)

  const currentFiles = activeConnection ? files[activeConnection.id] || [] : []

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file') {
      // Add file to open files in editor
      addOpenFile(file)
    }
  }

  const handleFolderToggle = (file: FileNode) => {
    toggleFolder(file.id)
  }

  const handleRefresh = async () => {
    if (!activeConnection) return
    
    setRefreshing(true)
    try {
      // TODO: Implement file refresh logic
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    } finally {
      setRefreshing(false)
    }
  }

  const handleCreateFile = () => {
    // TODO: Implement create file logic
  }

  const handleCreateFolder = () => {
    // TODO: Implement create folder logic
  }

  if (!activeConnection) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white">Files</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <Folder size={48} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No FTP connection</p>
            <p className="text-xs">Connect to a server to browse files</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">Files</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
            <button
              onClick={handleCreateFile}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="New File"
            >
              <File size={14} />
            </button>
            <button
              onClick={handleCreateFolder}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="New Folder"
            >
              <Folder size={14} />
            </button>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
          {activeConnection.name} ({activeConnection.host})
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : currentFiles.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Folder size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files found</p>
            </div>
          </div>
        ) : (
          <div className="py-1">
            {currentFiles.map((file) => (
              <FileTreeItem
                key={file.id}
                file={file}
                level={0}
                onFileSelect={handleFileSelect}
                onFolderToggle={handleFolderToggle}
                expandedFolders={expandedFolders}
              />
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        {currentFiles.length} item{currentFiles.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}