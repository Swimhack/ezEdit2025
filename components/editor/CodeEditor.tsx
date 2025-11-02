'use client';

import { Editor } from '@monaco-editor/react';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { XIcon, SaveIcon } from 'lucide-react';
import { useFileSystemStore } from '@/lib/stores/fileSystemStore';

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: { [key: string]: string } = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    py: 'python',
    php: 'php',
    xml: 'xml',
    sql: 'sql',
    sh: 'shell',
  };
  return languageMap[ext || ''] || 'plaintext';
}

function getMockFileContent(path: string): string {
  // Mock file content for demonstration
  const contentMap: { [key: string]: string } = {
    '/public/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Website</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <h1>Welcome to EzEdit</h1>
  <p>AI-powered website editor</p>
  <script src="main.js"></script>
</body>
</html>`,
    '/public/styles.css': `body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

h1 {
  color: #333;
  text-align: center;
}`,
    '/src/main.js': `// Main application entry point
console.log('EzEdit initialized');

function init() {
  console.log('App starting...');
  // Your code here
}

init();`,
    '/src/config.json': `{
  "appName": "EzEdit",
  "version": "2.0.0",
  "apiUrl": "https://api.example.com",
  "features": {
    "ai": true,
    "ftp": true,
    "s3": true
  }
}`,
    '/src/components/Header.jsx': `import React from 'react';

export default function Header() {
  return (
    <header className="header">
      <h1>My App</h1>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>
  );
}`,
    '/README.md': `# My Project

This is a sample project edited with EzEdit.

## Features

- AI-assisted editing
- FTP/S3 integration
- Real-time preview

## Getting Started

Open any file from the file explorer to start editing.`,
  };
  
  return contentMap[path] || `// File: ${path}\n// Content loaded from server\n\nconsole.log('Edit this file');`;
}

export function CodeEditor() {
  const { selectedFile } = useFileSystemStore();
  const [content, setContent] = useState('// Welcome to EzEdit v2\n// Connect to a server and open a file to start editing');
  const [language, setLanguage] = useState('javascript');
  const [modified, setModified] = useState(false);

  useEffect(() => {
    if (selectedFile) {
      // Load file content (in production, this would fetch from API)
      const fileContent = getMockFileContent(selectedFile);
      setContent(fileContent);
      setLanguage(getLanguageFromPath(selectedFile));
      setModified(false);
    }
  }, [selectedFile]);

  const handleContentChange = (value: string | undefined) => {
    setContent(value || '');
    setModified(true);
  };

  const handleSave = async () => {
    // In production, this would save to the server
    console.log('Saving file:', selectedFile);
    setModified(false);
  };

  const fileName = selectedFile ? selectedFile.split('/').pop() : 'Welcome';

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b px-2 py-1 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {fileName}{modified && ' •'}
          </span>
        </div>
        {selectedFile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!modified}
            className="h-7 px-2 text-xs"
          >
            <SaveIcon className="h-3 w-3 mr-1" />
            Save
          </Button>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={content}
          onChange={handleContentChange}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [80],
            wordWrap: 'on',
            automaticLayout: true,
            readOnly: !selectedFile,
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="h-6 border-t flex items-center justify-between px-4 text-xs bg-muted/50">
        <span className="text-muted-foreground">
          {selectedFile || 'No file selected'}
        </span>
        <span className="text-muted-foreground capitalize">
          {language}
        </span>
      </div>
    </div>
  );
}
