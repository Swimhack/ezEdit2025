'use client';

import { Editor } from '@monaco-editor/react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { XIcon, SaveIcon } from 'lucide-react';

export function CodeEditor() {
  const [content, setContent] = useState('// Welcome to EzEdit v2\n// Connect to a server and open a file to start editing');

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Tabs Header */}
      <div className="flex items-center border-b px-2 py-1 bg-muted/30">
        <Tabs defaultValue="welcome" className="flex-1">
          <TabsList className="h-8">
            <TabsTrigger value="welcome" className="text-xs">
              Welcome
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="vs-dark"
          value={content}
          onChange={(value) => setContent(value || '')}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [80],
            wordWrap: 'on',
            automaticLayout: true,
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="h-6 border-t flex items-center justify-between px-4 text-xs bg-muted/50">
        <span className="text-muted-foreground">Ready</span>
        <span className="text-muted-foreground">JavaScript</span>
      </div>
    </div>
  );
}
