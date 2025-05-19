import { Button } from '../ui/button';

export function AIDrawer() {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-lg text-white">AI Refactor</div>
        <span className="text-xs text-gray-400">⌥A</span>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#23272f] rounded p-2 mb-4 border border-gray-800">
        <div className="text-gray-300 text-sm mb-2">Chat area (AI suggestions, Q&A, etc.)</div>
        <div className="text-[#FF6584] text-xs font-mono mb-2">Diff summary will appear here...</div>
      </div>
      <Button className="w-full bg-[#2F65F9] hover:bg-blue-700 text-white font-semibold">Apply & Save</Button>
    </div>
  );
} 