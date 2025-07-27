'use client'

import React, { useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { loader } from '@monaco-editor/react'

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    ),
  }
)

// Configure Monaco loader
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs'
  }
})

interface CodeEditorProps {
  value: string
  onChange: (value: string | undefined) => void
  language: string
  theme?: string
  className?: string
  options?: any
}

export default function CodeEditor({
  value,
  onChange,
  language,
  theme = 'vs-dark',
  className = '',
  options = {}
}: CodeEditorProps) {
  const editorRef = useRef<any>(null)

  const defaultOptions = {
    selectOnLineNumbers: true,
    matchBrackets: 'always' as const,
    automaticLayout: true,
    formatOnType: true,
    formatOnPaste: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    renderWhitespace: 'selection' as const,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    folding: true,
    foldingStrategy: 'indentation' as const,
    showFoldingControls: 'mouseover' as const,
    ...options,
  }

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor

    // Configure themes
    monaco.editor.defineTheme('ezedit-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorCursor.foreground': '#aeafad',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      },
    })

    monaco.editor.defineTheme('ezedit-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000' },
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
      },
    })

    // Set the theme
    monaco.editor.setTheme(theme === 'vs-dark' ? 'ezedit-dark' : 'ezedit-light')

    // Configure additional languages and features
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    })

    // Enable format on save
    editor.addAction({
      id: 'format-document',
      label: 'Format Document',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: () => {
        editor.getAction('editor.action.formatDocument').run()
      },
    })
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <MonacoEditor
        height="100%"
        language={language}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={defaultOptions}
        theme={theme}
      />
    </div>
  )
}

export { CodeEditor }