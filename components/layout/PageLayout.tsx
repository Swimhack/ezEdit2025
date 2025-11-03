'use client'

import { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

interface PageLayoutProps {
  children: ReactNode
  userEmail?: string
}

export default function PageLayout({ children, userEmail }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header userEmail={userEmail} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

