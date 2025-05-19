import { useState } from 'react';

export function EditorPane() {
  const [tab, setTab] = useState<'preview' | 'html'>('preview');

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'preview' ? 'text-[#2F65F9] border-b-2 border-[#2F65F9]' : 'text-gray-500'}`}
          onClick={() => setTab('preview')}
        >
          Preview
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === 'html' ? 'text-[#2F65F9] border-b-2 border-[#2F65F9]' : 'text-gray-500'}`}
          onClick={() => setTab('html')}
        >
          HTML
        </button>
      </div>
      {/* Top: Monaco Editor (placeholder) */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 border-b border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-lg">
          Monaco Editor Placeholder
        </div>
        {/* Bottom: TinyMCE Preview (tabbed) */}
        <div className="flex-1 min-h-0 bg-white flex items-center justify-center text-gray-400 text-lg">
          {tab === 'preview' ? 'TinyMCE Preview Placeholder' : 'HTML Source Placeholder'}
        </div>
      </div>
    </div>
  );
} 