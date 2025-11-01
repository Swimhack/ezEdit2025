'use client';

import { Button } from '@/components/ui/button';
import { FolderIcon, FileIcon, ChevronRightIcon, ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';

export function FileExplorer() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  return (
    <div className="h-full flex flex-col bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">File Explorer</h2>
      </div>

      {/* Connection Section */}
      <div className="p-4 border-b">
        <Button variant="outline" className="w-full" size="sm">
          Connect to FTP/S3
        </Button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-2">
        <div className="text-sm text-muted-foreground text-center py-8">
          Connect to a server to browse files
        </div>
      </div>
    </div>
  );
}
