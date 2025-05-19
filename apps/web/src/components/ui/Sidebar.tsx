import type { ReactNode } from 'react';
import clsx from 'clsx';

interface SidebarProps {
  open: boolean;
  children: ReactNode;
}

export default function Sidebar({ open, children }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform',
        open ? 'translate-x-0' : '-translate-x-full',
        'sm:static sm:translate-x-0'
      )}
    >
      {children}
    </aside>
  );
} 