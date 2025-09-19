/**
 * Monaco Editor TypeScript type definitions
 * Provides type safety for Monaco Editor integration
 */

import type { editor } from 'monaco-editor';

export type MonacoEditor = editor.IStandaloneCodeEditor;
export type MonacoEditorOptions = editor.IStandaloneEditorConstructionOptions;
export type MonacoTheme = editor.IStandaloneThemeData;
export type MonacoLanguage = string;

export interface EditorInstance {
  editor: MonacoEditor | null;
  language: MonacoLanguage;
  theme: string;
  value: string;
  isReadOnly: boolean;
}

export interface EditorConfig {
  theme?: string;
  fontSize?: number;
  tabSize?: number;
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap?: {
    enabled: boolean;
  };
  scrollBeyondLastLine?: boolean;
  automaticLayout?: boolean;
  lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  renderWhitespace?: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
  readOnly?: boolean;
}

export interface FileType {
  extension: string;
  language: MonacoLanguage;
  icon?: string;
}

export const FILE_LANGUAGES: Record<string, MonacoLanguage> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.json': 'json',
  '.html': 'html',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.xml': 'xml',
  '.md': 'markdown',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.sql': 'sql',
  '.php': 'php',
  '.py': 'python',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.cs': 'csharp',
  '.go': 'go',
  '.rs': 'rust',
  '.rb': 'ruby',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.sh': 'shell',
  '.bash': 'shell',
  '.ps1': 'powershell',
  '.dockerfile': 'dockerfile',
  '.dockerignore': 'plaintext',
  '.gitignore': 'plaintext',
  '.env': 'plaintext',
  '.txt': 'plaintext'
};

export function getLanguageFromFilename(filename: string): MonacoLanguage {
  const ext = filename.substring(filename.lastIndexOf('.'));
  return FILE_LANGUAGES[ext.toLowerCase()] || 'plaintext';
}