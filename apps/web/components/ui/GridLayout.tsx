import { ReactNode, useRef } from 'react';

export function GridLayout({ children }: { children: ReactNode[] }) {
  // children: [FileBrowser, EditorPane, AIDrawer]
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // Resizer logic can be added later
  return (
    <div className="pt-14 h-[calc(100vh-3.5rem)] w-full grid grid-cols-[18rem_0.5rem_1fr_0.5rem_24rem] grid-rows-1 overflow-hidden">
      {/* FileBrowser */}
      <div className="bg-[#1B1F24] text-white overflow-y-auto" ref={leftRef}>{children[0]}</div>
      {/* Left Resizer */}
      <div className="bg-gray-200 cursor-ew-resize" />
      {/* EditorPane */}
      <div className="bg-white overflow-y-auto">{children[1]}</div>
      {/* Right Resizer */}
      <div className="bg-gray-200 cursor-ew-resize" />
      {/* AIDrawer */}
      <div className="bg-[#23272f] text-white overflow-y-auto" ref={rightRef}>{children[2]}</div>
    </div>
  );
} 