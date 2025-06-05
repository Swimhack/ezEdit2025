import React from 'react';
import { ThreePaneEditor } from './ThreePaneEditor';
import { MonacoPane, MonacoDiffPane } from './MonacoPane';
import { ThreePaneEditorProps, EditorTheme } from './types';

/**
 * Three-pane editor factory for creating preconfigured editor instances
 * Follows ShadCN/Atomic design principles with Tailwind styling
 */
export const createThreePaneEditor = () => {
  /**
   * Create a standard three-pane editor with default configuration
   */
  const Standard = (props: ThreePaneEditorProps) => (
    <ThreePaneEditor
      {...props}
      theme={{ base: 'vs' }}
      originalOptions={{
        lineNumbers: true,
        minimap: false,
        readOnly: true
      }}
      editOptions={{
        lineNumbers: true,
        minimap: true,
        readOnly: false
      }}
    />
  );

  /**
   * Create a dark mode three-pane editor
   */
  const Dark = (props: ThreePaneEditorProps) => (
    <ThreePaneEditor
      {...props}
      theme={{ base: 'vs-dark' }}
      originalOptions={{
        lineNumbers: true,
        minimap: false,
        readOnly: true
      }}
      editOptions={{
        lineNumbers: true,
        minimap: true,
        readOnly: false
      }}
    />
  );

  /**
   * Create a compact three-pane editor with minimized UI
   */
  const Compact = (props: ThreePaneEditorProps) => (
    <ThreePaneEditor
      {...props}
      theme={{ base: 'vs' }}
      originalOptions={{
        lineNumbers: false,
        minimap: false,
        readOnly: true
      }}
      editOptions={{
        lineNumbers: true,
        minimap: false,
        readOnly: false
      }}
    />
  );

  /**
   * Create a read-only three-pane editor for viewing only
   */
  const ReadOnly = (props: ThreePaneEditorProps) => (
    <ThreePaneEditor
      {...props}
      theme={{ base: 'vs' }}
      originalOptions={{
        lineNumbers: true,
        minimap: false,
        readOnly: true
      }}
      editOptions={{
        lineNumbers: true,
        minimap: false,
        readOnly: true
      }}
    />
  );

  /**
   * Create a three-pane editor with AI focused configuration
   * Shows the chat assist panel by default
   */
  const AIFocused = (props: ThreePaneEditorProps) => (
    <ThreePaneEditor
      {...props}
      chatAssistOpen={true}
      theme={{ base: 'vs' }}
      originalOptions={{
        lineNumbers: true,
        minimap: false,
        readOnly: true
      }}
      editOptions={{
        lineNumbers: true,
        minimap: true,
        readOnly: false
      }}
    />
  );

  /**
   * Create a custom three-pane editor with specified theme
   */
  const createThemedEditor = (theme: EditorTheme) => 
    (props: ThreePaneEditorProps) => (
      <ThreePaneEditor
        {...props}
        theme={theme}
      />
    );

  return {
    Standard,
    Dark,
    Compact,
    ReadOnly,
    AIFocused,
    createThemedEditor,
    MonacoPane,
    MonacoDiffPane
  };
};

// Export a default factory instance for convenience
export const ThreePaneEditorFactory = createThreePaneEditor();
