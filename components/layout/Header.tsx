'use client'

import { useState } from 'react'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
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

          {/* User Section & Mobile Menu Button */}
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
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-3">
              {!isAdminPage && (
                <>
                  <Link 
                    href="/#features" 
                    className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link>
                  <Link 
                    href="/#pricing" 
                    className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              )}
              {isAdminPage && (
                <>
                  <Link 
                    href="/admin" 
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === '/admin' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Overview
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    User Dashboard
                  </Link>
                </>
              )}
              {userEmail && (
                <div className="flex items-center gap-2 text-sm text-gray-600 px-3 py-2 border-t border-gray-200 mt-2 pt-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-xs">
                      {userEmail.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{userEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

