'use client'

import React, { useState, useCallback } from 'react'
import { useLayoutStore } from '@/store'
import FileExplorer from '../FileExplorer/FileExplorer'
import CodeEditor from '../MonacoEditor'
import AIAssistant from '../AIAssistant/AIAssistant'
import { PanelLeft, PanelRight, Menu } from 'lucide-react'

interface EditorLayoutProps {
  children?: React.ReactNode
}

const ResizeHandle = ({ 
  direction, 
  onResize 
}: { 
  direction: 'vertical' | 'horizontal'
  onResize: (delta: number) => void 
}) => {
  const [isResizing, setIsResizing] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const startPos = direction === 'vertical' ? e.clientX : e.clientY
    
    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'vertical' ? e.clientX : e.clientY
      const delta = currentPos - startPos
      onResize(delta)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [direction, onResize])

  return (
    <div
      className={`
        resize-handle resize-handle-${direction}
        ${direction === 'vertical' 
          ? 'right-0 w-1 hover:w-2 hover:bg-blue-500 cursor-col-resize' 
          : 'bottom-0 h-1 hover:h-2 hover:bg-blue-500 cursor-row-resize'
        }
        ${isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-500/20'}
        transition-all duration-150 z-10
      `}
      onMouseDown={handleMouseDown}
    />
  )
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  const {
    file_explorer_width,
    ai_assistant_width,
    show_file_explorer,
    show_ai_assistant,
    updateLayout,
    toggleFileExplorer,
    toggleAIAssistant,
  } = useLayoutStore()

  const handleFileExplorerResize = useCallback((delta: number) => {
    const newWidth = Math.max(200, Math.min(600, file_explorer_width + delta))
    updateLayout({ file_explorer_width: newWidth })
  }, [file_explorer_width, updateLayout])

  const handleAIAssistantResize = useCallback((delta: number) => {
    const newWidth = Math.max(300, Math.min(800, ai_assistant_width - delta))
    updateLayout({ ai_assistant_width: newWidth })
  }, [ai_assistant_width, updateLayout])

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Ez</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">EzEdit.co</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFileExplorer}
              className={`
                p-2 rounded-md transition-colors
                ${show_file_explorer 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }
              `}
              title="Toggle File Explorer"
            >
              <PanelLeft size={16} />
            </button>
            
            <button
              onClick={toggleAIAssistant}
              className={`
                p-2 rounded-md transition-colors
                ${show_ai_assistant 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }
              `}
              title="Toggle AI Assistant"
            >
              <PanelRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <Menu size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {show_file_explorer && (
          <div 
            className="relative border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            style={{ width: file_explorer_width }}
          >
            <FileExplorer />
            <ResizeHandle 
              direction="vertical" 
              onResize={handleFileExplorerResize} 
            />
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>

        {/* AI Assistant */}
        {show_ai_assistant && (
          <div 
            className="relative border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            style={{ width: ai_assistant_width }}
          >
            <ResizeHandle 
              direction="vertical" 
              onResize={handleAIAssistantResize} 
            />
            <AIAssistant />
          </div>
        )}
      </div>
    </div>
  )
}