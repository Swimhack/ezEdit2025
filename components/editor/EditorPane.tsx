/**
 * EditorPane - Center pane component for Monaco Editor code editing
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

    // Add file content change listener
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      updateContent(value);
    });

    // Focus editor when mounted
    editor.focus();
  }, [state.session?.preferences, saveFile, updateContent]);

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

  // Get editor theme based on preferences
  const getEditorTheme = useCallback(() => {
    const theme = state.session?.preferences.theme || 'dark';
    switch (theme) {
      case 'light':
        return 'light';
      case 'dark':
        return 'vs-dark';
      case 'auto':
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'light';
      default:
        return 'vs-dark';
    }
  }, [state.session?.preferences.theme]);

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

  // Show loading state
  if (isLoading && !currentFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50" data-testid="editor-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  // Show no file selected state
  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50" data-testid="editor-no-file">
        <div className="text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No File Selected</h3>
          <p className="text-gray-600 mb-4">Select a file from the file tree to start editing</p>
          <div className="text-sm text-gray-500">
            <p>Tip: Double-click a file to open it for editing</p>
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
      <div className="h-full flex items-center justify-center bg-gray-50" data-testid="editor-non-editable">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">File Not Editable</h3>
          <p className="text-gray-600 mb-4">This file type cannot be edited in the text editor</p>
          <div className="text-sm text-gray-500">
            <p>Supported formats: Text files, code files, configuration files</p>
          </div>
        </div>
      </div>
    );
  }

  // Show Monaco loading state
  if (!monacoLoaded || !Editor) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50" data-testid="monaco-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading code editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white" data-testid="editor-pane">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <h3 className="font-semibold text-gray-900 truncate" title={currentFile}>
            {currentFile.split('/').pop()}
          </h3>
          {isDirty && (
            <span className="text-orange-600 text-sm" title="Unsaved changes">
              ● Modified
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-500">
            {getEditorLanguage().toUpperCase()}
          </div>

          <button
            onClick={saveFile}
            disabled={!isDirty || isLoading}
            className={`px-3 py-1 text-xs rounded ${
              isDirty && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
          height="100%"
          language={getEditorLanguage()}
          theme={getEditorTheme()}
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
            formatOnType: true
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Line {editorRef.current?.getPosition()?.lineNumber || 1}</span>
          <span>Column {editorRef.current?.getPosition()?.column || 1}</span>
          <span>{fileContent.length} characters</span>
        </div>

        <div className="flex items-center space-x-4">
          <span>{getEditorLanguage()}</span>
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
 * Editor status indicator component
 */
interface EditorStatusProps {
  isDirty: boolean;
  isLoading: boolean;
  lastSaved: Date | null;
}

export function EditorStatus({ isDirty, isLoading, lastSaved }: EditorStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-blue-600">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600" />
        <span className="text-xs">Saving...</span>
      </div>
    );
  }

  if (isDirty) {
    return (
      <div className="flex items-center space-x-2 text-orange-600">
        <span className="text-xs">●</span>
        <span className="text-xs">Unsaved changes</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <span className="text-xs">✓</span>
        <span className="text-xs">Saved {lastSaved.toLocaleTimeString()}</span>
      </div>
    );
  }

  return null;
}