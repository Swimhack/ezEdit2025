'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

interface AdminLayoutProps {
  children: ReactNode
  userEmail?: string
}

export default function AdminLayout({ children, userEmail }: AdminLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header userEmail={userEmail} showAdminBadge={true} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}




