import { ReactNode, useState } from 'react';
import { AppBar } from '../ui/AppBar';
import { GridLayout } from '../ui/GridLayout';
import { Sidebar } from '../ui/Sidebar';

export function DashboardLayout({ children }: { children: ReactNode[] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const childrenArray = Array.isArray(children) ? children : [children];

  const transformedChildren: ReactNode[] = [
    <Sidebar open={sidebarOpen} key="sidebar">{childrenArray[0]}</Sidebar>,
    ...childrenArray.slice(1),
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FA] text-gray-900 flex flex-col">
      <AppBar onMenuClick={() => setSidebarOpen(prev => !prev)} />
      <GridLayout>{transformedChildren}</GridLayout>
    </div>
  );
} 