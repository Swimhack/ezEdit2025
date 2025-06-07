import { Link } from 'react-router-dom';
import { Button } from './button';

export function Navbar() {
  return (
    <nav className="w-full bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/images/ezedit-logo.png" alt="EzEdit Logo" className="w-10 h-10" />
        <span className="font-extrabold text-2xl text-white">Ez<span className="text-blue-400">Edit</span><span className="text-gray-300">.co</span></span>
      </div>
      <div className="hidden md:flex gap-8 items-center">
        <Link to="#features" className="text-gray-200 hover:text-blue-400 font-medium">Features</Link>
        <Link to="#pricing" className="text-gray-200 hover:text-blue-400 font-medium">Pricing</Link>
        <Link to="#docs" className="text-gray-200 hover:text-blue-400 font-medium">Docs</Link>
      </div>
      <div className="flex gap-2 items-center">
        <Link to="/login" className="text-gray-200 hover:text-blue-400 font-medium">Log in</Link>
        <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">Sign up</Button>
      </div>
    </nav>
  );
}
