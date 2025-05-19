import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Globe, Settings, Monitor, Menu, X, ChevronDown, User, Bell } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center">
          <button 
            className="md:hidden mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center mr-10">
            <Link to="/dashboard" className="flex items-center">
              {/* Use both SVG and PNG with fallback */}
              <img 
                src="/images/ezedit-logo.svg" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/ezedit-logo.png';
                }}
                alt="EzEdit Logo" 
                className="h-8 w-auto mr-2" 
              />
              <span className="font-semibold text-lg">
                <span className="font-bold">Ez<span className="text-[#29A8FF]">Edit</span></span>
                <span className="text-[#29A8FF]">.co</span>
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-gray-600 hover:text-[#29A8FF] transition-colors duration-200 font-medium">Features</a>
            <a href="#" className="text-gray-600 hover:text-[#29A8FF] transition-colors duration-200 font-medium">Pricing</a>
            <a href="#" className="text-gray-600 hover:text-[#29A8FF] transition-colors duration-200 font-medium">Docs</a>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-600 hover:text-[#29A8FF] rounded-full hover:bg-gray-100 transition-colors">
            <span className="sr-only">Toggle theme</span>
            <Monitor className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-600 hover:text-[#29A8FF] rounded-full hover:bg-gray-100 transition-colors relative">
            <span className="sr-only">Notifications</span>
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
          <div className="relative ml-3 group">
            <div>
              <button className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29A8FF] bg-amber-100 text-amber-800 px-3 py-1">
                <span className="font-medium mr-1">Admin</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block">
              <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Your Profile
              </Link>
              <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Settings
              </Link>
              <Link to="/logout" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar - Mobile */}
        <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <nav className="px-4 space-y-1">
                <Link 
                  to="/dashboard" 
                  className={`flex items-center p-3 rounded-lg ${isActive('/dashboard') ? 'text-[#29A8FF] bg-[#E6F6FF]' : 'text-gray-600 hover:bg-[#E6F6FF] hover:text-[#29A8FF]'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Home className="w-5 h-5 mr-3" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <Link 
                  to="/sites" 
                  className={`flex items-center p-3 rounded-lg ${isActive('/sites') ? 'text-[#29A8FF] bg-[#E6F6FF]' : 'text-gray-600 hover:bg-[#E6F6FF] hover:text-[#29A8FF]'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Globe className="w-5 h-5 mr-3" />
                  <span className="font-medium">My Sites</span>
                </Link>
                <Link 
                  to="/settings" 
                  className={`flex items-center p-3 rounded-lg ${isActive('/settings') ? 'text-[#29A8FF] bg-[#E6F6FF]' : 'text-gray-600 hover:bg-[#E6F6FF] hover:text-[#29A8FF]'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  <span className="font-medium">Settings</span>
                </Link>
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button className="flex-shrink-0 group block w-full flex items-center text-gray-600 hover:text-[#29A8FF]">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium">Free Trial</p>
                    <p className="text-xs text-gray-500">7 days remaining</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4 mb-5">
                  <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
                </div>
                <nav className="mt-5 flex-1 px-4 space-y-1">
                  <Link 
                    to="/dashboard" 
                    className={`flex items-center p-3 rounded-lg ${isActive('/dashboard') ? 'text-[#29A8FF] bg-[#E6F6FF]' : 'text-gray-600 hover:bg-[#E6F6FF] hover:text-[#29A8FF]'}`}
                  >
                    <Home className="w-5 h-5 mr-3" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  <Link 
                    to="/sites" 
                    className={`flex items-center p-3 rounded-lg ${isActive('/sites') ? 'text-[#29A8FF] bg-[#E6F6FF]' : 'text-gray-600 hover:bg-[#E6F6FF] hover:text-[#29A8FF]'}`}
                  >
                    <Globe className="w-5 h-5 mr-3" />
                    <span className="font-medium">My Sites</span>
                  </Link>
                  <Link 
                    to="/settings" 
                    className={`flex items-center p-3 rounded-lg ${isActive('/settings') ? 'text-[#29A8FF] bg-[#E6F6FF]' : 'text-gray-600 hover:bg-[#E6F6FF] hover:text-[#29A8FF]'}`}
                  >
                    <Settings className="w-5 h-5 mr-3" />
                    <span className="font-medium">Settings</span>
                  </Link>
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <div>
                      <User className="inline-block h-9 w-9 rounded-full text-gray-400 bg-gray-100 p-2" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">Free Trial</p>
                      <p className="text-xs font-medium text-gray-500">7 days remaining</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto focus:outline-none bg-gray-50">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
