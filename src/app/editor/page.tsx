'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore, useEditorStore } from '@/store'

export const dynamic = 'force-dynamic'
import EditorLayout from '@/components/Layout/EditorLayout'
import CodeEditor from '@/components/MonacoEditor'
import { FileNode } from '@/types'
import { X, Save, RotateCcw } from 'lucide-react'

const EditorTabs = () => {
  const { open_files, active_file_id, removeOpenFile, setActiveFile, hasUnsavedChanges } = useEditorStore()

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {open_files.map((file) => (
        <div
          key={file.id}
          className={`
            flex items-center px-4 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer
            ${active_file_id === file.id 
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white' 
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
            }
          `}
          onClick={() => setActiveFile(file.id)}
        >
          <span className="text-sm mr-2 truncate max-w-32">
            {file.name}
            {hasUnsavedChanges(file.id) && <span className="text-blue-500 ml-1">•</span>}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeOpenFile(file.id)
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

const EditorContent = () => {
  const { open_files, active_file_id, updateFileContent, saveFile, hasUnsavedChanges } = useEditorStore()
  const [editorValue, setEditorValue] = useState('')

  const activeFile = open_files.find(f => f.id === active_file_id)

  useEffect(() => {
    if (activeFile) {
      setEditorValue(activeFile.content || '')
    }
  }, [activeFile])

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFile) {
      setEditorValue(value)
      updateFileContent(activeFile.id, value)
    }
  }

  const handleSave = async () => {
    if (activeFile && hasUnsavedChanges(activeFile.id)) {
      // TODO: Implement actual file saving to FTP
      saveFile(activeFile.id)
      console.log('Saving file:', activeFile.path)
    }
  }

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      html: 'html',
      htm: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      json: 'json',
      xml: 'xml',
      php: 'php',
      py: 'python',
      rb: 'ruby',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      sh: 'shell',
      sql: 'sql',
      md: 'markdown',
      yaml: 'yaml',
      yml: 'yaml',
      txt: 'plaintext',
    }
    return languageMap[ext || ''] || 'plaintext'
  }

  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium mb-2">No file selected</h3>
          <p className="text-sm">Open a file from the file explorer to start editing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Editor Toolbar */}
      <div className="h-10 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <span>{activeFile.path}</span>
          {hasUnsavedChanges(activeFile.id) && (
            <span className="text-blue-500">• Modified</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges(activeFile.id)}
            className="flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={12} />
            <span>Save</span>
          </button>
          
          <button
            onClick={() => {
              if (activeFile.content) {
                setEditorValue(activeFile.content)
                // TODO: Clear unsaved changes
              }
            }}
            disabled={!hasUnsavedChanges(activeFile.id)}
            className="flex items-center space-x-1 px-3 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw size={12} />
            <span>Revert</span>
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <CodeEditor
          value={editorValue}
          onChange={handleEditorChange}
          language={getLanguageFromExtension(activeFile.name)}
          theme="vs-dark"
          options={{
            fontSize: 14,
            wordWrap: 'on',
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}

export default function EditorPage() {
  const { user, loading } = useAuthStore()
  const { open_files } = useEditorStore()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading editor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Please log in to access the editor</p>
          <a href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <EditorLayout>
      <div className="flex flex-col h-full">
        {open_files.length > 0 && <EditorTabs />}
        <EditorContent />
      </div>
    </EditorLayout>
  )
}