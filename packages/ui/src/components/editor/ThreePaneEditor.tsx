import React, { useState, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { ThreePaneEditorProps, EditorTheme, EditorOptions } from './types';

/**
 * Three-pane editor component factory for ezEdit
 * 
 * Creates a Monaco-style split view with:
 * - Original code pane (left)
 * - Edited code pane (center)
 * - Chat-assist side panel (right, collapsible)
 * 
 * Supports diff view and patch application/discard
 */
export const ThreePaneEditor: React.FC<ThreePaneEditorProps> = ({
  originalContent,
  editedContent: initialEditedContent,
  language = 'javascript',
  theme = { base: 'vs' },
  originalOptions = { readOnly: true },
  editOptions = { readOnly: false },
  chatAssistOpen = false,
  chatAssistContent,
  onEditChange,
  onApplyPatch,
  onDiscardPatch,
}) => {
  // State
  const [editedContent, setEditedContent] = useState(initialEditedContent);
  const [isChatOpen, setIsChatOpen] = useState(chatAssistOpen);
  const [isDiffVisible, setIsDiffVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Update edited content if prop changes
  useEffect(() => {
    setEditedContent(initialEditedContent);
  }, [initialEditedContent]);
  
  // Handle content change
  const handleContentChange = useCallback((value: string) => {
    setEditedContent(value);
    if (onEditChange) {
      onEditChange(value);
    }
  }, [onEditChange]);
  
  // Toggle chat assist panel
  const toggleChatAssist = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);
  
  // Toggle diff view
  const toggleDiff = useCallback(() => {
    setIsDiffVisible(prev => !prev);
  }, []);
  
  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);
  
  // Apply patch (placeholder for Monaco implementation)
  const applyPatch = useCallback(() => {
    if (onApplyPatch) {
      // In a real implementation, generate a proper diff patch
      const patch = editedContent;
      onApplyPatch(patch);
    }
  }, [editedContent, onApplyPatch]);
  
  // Discard changes
  const discardChanges = useCallback(() => {
    setEditedContent(originalContent);
    if (onDiscardPatch) {
      onDiscardPatch();
    }
  }, [originalContent, onDiscardPatch]);
  
  return (
    <div 
      className={cn(
        "flex flex-col h-full w-full bg-gray-100 rounded-md overflow-hidden",
        isFullscreen && "fixed inset-0 z-50"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-200 border-b">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleDiff}
            className={cn(
              "px-3 py-1 text-sm rounded",
              isDiffVisible 
                ? "bg-blue-600 text-white" 
                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
            )}
          >
            {isDiffVisible ? "Hide Diff" : "Show Diff"}
          </button>
          <select 
            value={language}
            className="text-sm border rounded px-2 py-1 bg-white"
            onChange={() => {/* Language change handler */}}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="php">PHP</option>
            {/* Add more languages as needed */}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleChatAssist}
            className={cn(
              "px-3 py-1 text-sm rounded",
              isChatOpen
                ? "bg-purple-600 text-white"
                : "bg-gray-300 hover:bg-gray-400 text-gray-800"
            )}
          >
            {isChatOpen ? "Hide Klein" : "Show Klein"}
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1 text-sm rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor container */}
        <div className={cn(
          "flex flex-1 overflow-hidden",
          isChatOpen ? "w-3/4" : "w-full"
        )}>
          {/* Original editor - Only show in diff mode */}
          {isDiffVisible && (
            <div className="w-1/2 h-full border-r">
              {/* Monaco Editor would be mounted here */}
              <div className="h-full p-4 bg-white text-sm font-mono overflow-auto">
                <pre>{originalContent}</pre>
              </div>
            </div>
          )}
          
          {/* Edited code */}
          <div className={cn(
            "h-full",
            isDiffVisible ? "w-1/2" : "w-full"
          )}>
            {/* Monaco Editor would be mounted here */}
            <div className="h-full p-4 bg-white text-sm font-mono overflow-auto">
              <textarea
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full resize-none focus:outline-none font-mono"
                spellCheck="false"
              />
            </div>
          </div>
        </div>
        
        {/* Chat assist panel */}
        {isChatOpen && (
          <div className="w-1/4 border-l bg-white flex flex-col">
            <div className="p-2 bg-purple-100 border-b">
              <h3 className="text-sm font-semibold">Klein AI Assistant</h3>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {chatAssistContent || (
                <div className="text-gray-500 text-sm">
                  Klein is ready to help with your code. Ask a question to get started.
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="p-2 border-t flex justify-between">
              <button
                onClick={discardChanges}
                className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Discard
              </button>
              <button
                onClick={applyPatch}
                className="px-3 py-1 text-sm rounded bg-green-600 hover:bg-green-700 text-white"
              >
                Apply Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
