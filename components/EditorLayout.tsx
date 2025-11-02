'use client';

import { useState } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { FileExplorer } from './file-explorer/FileExplorer';
import { CodeEditor } from './editor/CodeEditor';
import { AIAssistant } from './ai-assistant/AIAssistant';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';
import { Home, Settings, Moon, Sun, Save, Play } from 'lucide-react';
import { useEffect } from 'react';

export function EditorLayout() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Modern Editor Header */}
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
        {/* Left: Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center transition-smooth hover:opacity-80">
            <div className="relative h-8 w-28">
              <Image
                src="/logo.jpg"
                alt="ezEdit"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          <div className="h-6 w-px bg-border" />
          <span className="text-sm text-muted-foreground font-medium">Editor</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            <span className="hidden md:inline">Save</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            <span className="hidden md:inline">Deploy</span>
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Three-pane layout with modern styling */}
      <PanelGroup direction="horizontal" className="flex-1">
        {/* File Explorer - Left Pane */}
        <Panel defaultSize={20} minSize={15} maxSize={30}>
          <FileExplorer />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/30 transition-all duration-200 active:bg-primary" />

        {/* Code Editor - Center Pane */}
        <Panel defaultSize={50} minSize={30}>
          <CodeEditor />
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/30 transition-all duration-200 active:bg-primary" />

        {/* AI Assistant - Right Pane */}
        <Panel defaultSize={30} minSize={20} maxSize={40}>
          <AIAssistant />
        </Panel>
      </PanelGroup>
    </div>
  );
}
