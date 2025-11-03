'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/app/components/Logo'

interface HeaderProps {
  userEmail?: string
  showAdminBadge?: boolean
}

export default function Header({ userEmail, showAdminBadge = false }: HeaderProps) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={isAdminPage ? '/admin' : '/'} className="flex items-center hover:opacity-80 transition-opacity">
              <Logo variant="nav" showText={true} />
            </Link>
            {isAdminPage && (
              <span className="ml-4 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full border border-blue-200">
                Admin
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {!isAdminPage && (
              <>
                <Link href="/#features" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Features
                </Link>
                <Link href="/#pricing" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Pricing
                </Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Dashboard
                </Link>
              </>
            )}
            {isAdminPage && (
              <>
                <Link href="/admin" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}>
                  Overview
                </Link>
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  User Dashboard
                </Link>
              </>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {userEmail && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xs">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{userEmail}</span>
              </div>
            )}
            {showAdminBadge && (
              <span className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-full border border-blue-200">
                Admin
              </span>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

