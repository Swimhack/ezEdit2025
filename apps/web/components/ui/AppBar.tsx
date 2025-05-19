import { Button } from './button';
import MobileMenuButton from './MobileMenuButton';

export function AppBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="w-full h-14 flex items-center justify-between px-6 bg-[#1B1F24] border-b border-gray-800 fixed top-0 left-0 z-40">
      <div className="flex items-center gap-4">
        <MobileMenuButton onClick={onMenuClick} />
        <img src="/ezedit-logo.png" alt="EzEdit Logo" className="w-8 h-8" />
        <span className="font-extrabold text-xl text-white">Ez<span className="text-[#2F65F9]">Edit</span></span>
        <select className="ml-6 bg-[#23272f] text-white rounded px-3 py-1 text-sm border border-gray-700 focus:outline-none">
          <option>Eastgateministries.com</option>
          <option>DemoSite.com</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <Button className="bg-[#2F65F9] hover:bg-blue-700 text-white font-semibold px-4 py-2">Save</Button>
        <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">JD</div>
      </div>
    </header>
  );
} 