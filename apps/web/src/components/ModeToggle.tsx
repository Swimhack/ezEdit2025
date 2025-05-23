import React from 'react';
import { HardDrive, Server } from 'lucide-react';

export type EditorMode = 'local' | 'ftp';

interface ModeToggleProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  disabled?: boolean;
}

export default function ModeToggle({ 
  mode, 
  onModeChange,
  disabled = false 
}: ModeToggleProps) {
  return (
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <button
        type="button"
        disabled={disabled}
        className={`px-4 py-2 text-sm font-medium rounded-l-lg flex items-center
          ${mode === 'local' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => onModeChange('local')}
      >
        <HardDrive className="w-4 h-4 mr-2" />
        Local
      </button>
      <button
        type="button"
        disabled={disabled}
        className={`px-4 py-2 text-sm font-medium rounded-r-lg flex items-center
          ${mode === 'ftp' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => onModeChange('ftp')}
      >
        <Server className="w-4 h-4 mr-2" />
        FTP
      </button>
    </div>
  );
}
