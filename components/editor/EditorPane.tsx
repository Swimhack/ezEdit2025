/**
 * EditorPane - VS Code-style editor with tabs
 * Integrates Monaco Editor with file content and provides editing features
 */

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useFileOperations, useEditor } from '@/lib/editor-state';
import { getLanguageFromFilename } from '@/types/monaco';
import { isEditableFile } from '@/lib/file-operations';

// Monaco Editor imports (dynamic to avoid SSR issues)
let monaco: typeof import('monaco-editor') | null = null;
let Editor: typeof import('@monaco-editor/react').default | null = null;

export default function EditorPane() {
  const { currentFile, fileContent, isDirty, isLoading, updateContent, saveFile } = useFileOperations();
  const { state, actions } = useEditor();

  const [editorMounted, setEditorMounted] = useState(false);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const editorRef = useRef<any>(null);

  // Dynamic import of Monaco Editor
  useEffect(() => {
    const loadMonaco = async () => {
      try {
        const [monacoEditor, editorComponent] = await Promise.all([
          import('monaco-editor'),
          import('@monaco-editor/react')
        ]);

        monaco = monacoEditor;
        Editor = editorComponent.default;
        setMonacoLoaded(true);
      } catch (error) {
        console.error('Failed to load Monaco Editor:', error);
        actions.setError('Failed to load code editor');
      }
    };

    loadMonaco();
  }, [actions]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor: any, monacoInstance: any) => {
    editorRef.current = editor;
    setEditorMounted(true);

    // Configure editor options
    editor.updateOptions({
      fontSize: state.session?.preferences.fontSize || 14,
      tabSize: state.session?.preferences.tabSize || 2,
      wordWrap: state.session?.preferences.wordWrap ? 'on' : 'off',
      minimap: {
        enabled: state.session?.preferences.showMinimap || true
      },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      folding: true,
      lineNumbers: 'on',
      rulers: [80, 120],
      bracketPairColorization: {
        enabled: true
      }
    });

    // Add keyboard shortcuts
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      saveFile();
    });

    // Focus editor when mounted
    editor.focus();
  }, [state.session?.preferences, saveFile]);

  // Handle editor value change
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      updateContent(value);
    }
  }, [updateContent]);

  // Get language for current file
  const getEditorLanguage = useCallback(() => {
    if (!currentFile) return 'plaintext';
    return getLanguageFromFilename(currentFile);
  }, [currentFile]);

  // Handle save shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentFile && isDirty) {
          saveFile();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentFile, isDirty, saveFile]);

  // Show loading state - show loading when file is being loaded
  if (isLoading && currentFile && !fileContent) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]" data-testid="editor-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007acc] mx-auto mb-4"></div>
          <p className="text-[#cccccc]">Loading file...</p>
          <p className="text-[#858585] text-sm mt-2">{currentFile.split('/').pop()}</p>
        </div>
      </div>
    );
  }
  
  // Show loading state for initial editor load
  if (isLoading && !currentFile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]" data-testid="editor-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007acc] mx-auto mb-4"></div>
          <p className="text-[#cccccc]">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Show no file selected state
  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]" data-testid="editor-no-file">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-[#cccccc] mb-2">No File Selected</h3>
          <p className="text-[#858585] mb-4">Select a file from the file tree to start editing</p>
          <div className="text-sm text-[#858585]">
            <p>Tip: Click a file to open it for editing</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if file is editable
  const fileNode = state.fileTree.find(node =>
    findFileInTree(node, currentFile)
  );

  if (fileNode && !isEditableFile(fileNode)) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]" data-testid="editor-non-editable">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold text-[#cccccc] mb-2">File Not Editable</h3>
          <p className="text-[#858585] mb-4">This file type cannot be edited in the text editor</p>
          <div className="text-sm text-[#858585]">
            <p>Supported formats: Text files, code files, configuration files</p>
          </div>
        </div>
      </div>
    );
  }

  // Show Monaco loading state
  if (!monacoLoaded || !Editor) {
    return (
      <div className="h-full flex items-center justify-center bg-[#1e1e1e]" data-testid="monaco-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007acc] mx-auto mb-4"></div>
          <p className="text-[#cccccc]">Loading code editor...</p>
        </div>
      </div>
    );
  }

  const fileName = currentFile.split('/').pop() || 'Untitled';

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]" data-testid="editor-pane">
      {/* Tab Bar (VS Code style) */}
      <div className="flex items-center bg-[#2d2d30] border-b border-[#3e3e42]">
        <div className="flex-1 flex items-center overflow-x-auto">
          <div className="flex items-center px-3 py-1.5 bg-[#1e1e1e] border-r border-[#3e3e42] text-sm text-[#cccccc] cursor-pointer hover:bg-[#2d2d30] transition-colors">
            <span className="mr-2">{getFileIcon(fileName)}</span>
            <span className="truncate max-w-[200px]">{fileName}</span>
            {isDirty && (
              <span className="ml-2 text-[#ffcc00]" title="Unsaved changes">●</span>
            )}
          </div>
        </div>
        <div className="flex items-center px-2 border-l border-[#3e3e42]">
          <button
            onClick={saveFile}
            disabled={!isDirty || isLoading}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              isDirty && !isLoading
                ? 'bg-[#0e639c] text-white hover:bg-[#1177bb]'
                : 'bg-[#3c3c3c] text-[#858585] cursor-not-allowed'
            }`}
            title="Save file (Ctrl+S)"
            data-testid="save-button"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden" data-testid="monaco-container">
        <Editor
          key={currentFile} // Force remount when file changes to ensure content loads
          height="100%"
          language={getEditorLanguage()}
          theme="vs-dark"
          value={fileContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            fontSize: state.session?.preferences.fontSize || 14,
            tabSize: state.session?.preferences.tabSize || 2,
            wordWrap: state.session?.preferences.wordWrap ? 'on' : 'off',
            minimap: {
              enabled: state.session?.preferences.showMinimap || true
            },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            folding: true,
            lineNumbers: 'on',
            rulers: [80, 120],
            bracketPairColorization: {
              enabled: true
            },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            parameterHints: {
              enabled: true
            },
            formatOnPaste: true,
            formatOnType: true,
            'semanticHighlighting.enabled': true
          }}
        />
      </div>

      {/* Footer (Editor Info) */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-[#3e3e42] bg-[#252526] text-xs text-[#858585]">
        <div className="flex items-center space-x-4">
          <span>Line {editorRef.current?.getPosition()?.lineNumber || 1}</span>
          <span>Column {editorRef.current?.getPosition()?.column || 1}</span>
          <span>{fileContent.length} characters</span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="uppercase">{getEditorLanguage()}</span>
          <span>UTF-8</span>
          {state.lastSaved && (
            <span title="Last saved">
              Saved {state.lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to find file in tree recursively
 */
function findFileInTree(node: any, targetPath: string): any {
  if (node.path === targetPath) {
    return node;
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findFileInTree(child, targetPath);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Helper function to get file icon
 */
function getFileIcon(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const iconMap: Record<string, string> = {
    'js': '📄',
    'ts': '📘',
    'jsx': '⚛️',
    'tsx': '⚛️',
    'html': '🌐',
    'css': '🎨',
    'json': '📋',
    'md': '📝',
    'py': '🐍',
    'java': '☕',
    'cpp': '⚙️',
    'php': '🐘',
    'go': '🐹',
    'rs': '🦀',
    'rb': '💎',
    'sh': '💻',
    'yml': '⚙️',
    'yaml': '⚙️',
    'xml': '📄',
    'txt': '📄'
  };
  return iconMap[ext || ''] || '📄';
}
