import { ReactNode } from 'react';
import { Navbar } from '../ui/navbar';

export function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <main>{children}</main>
    </div>
  );
} 