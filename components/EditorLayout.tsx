'use client';

import { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'react-resizable-panels';
import { FileExplorer } from './file-explorer/FileExplorer';
import { CodeEditor } from './editor/CodeEditor';
import { AIAssistant } from './ai-assistant/AIAssistant';

export function EditorLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center px-4 bg-card">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">🧠 EzEdit</h1>
        </div>
      </header>

      {/* Three-pane layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* File Explorer - Left Pane */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <FileExplorer />
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

        {/* Code Editor - Center Pane */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <CodeEditor />
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-border hover:bg-primary/50 transition-colors" />

        {/* AI Assistant - Right Pane */}
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <AIAssistant />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
