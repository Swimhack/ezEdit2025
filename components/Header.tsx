'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileCode2, Settings, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 transition-smooth hover:opacity-80">
          <div className="relative h-10 w-32 md:h-12 md:w-40">
            <Image
              src="/logo.jpg"
              alt="ezEdit Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth"
          >
            Home
          </Link>
          <Link
            href="/editor"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth flex items-center gap-2"
          >
            <FileCode2 className="h-4 w-4" />
            Editor
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-smooth"
          >
            Pricing
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-9 w-9 rounded-full transition-smooth hover:bg-accent"
          >
            {isDark ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Link href="/editor">
            <Button className="rounded-full px-6 shadow-lg hover:shadow-xl transition-smooth bg-primary hover:bg-primary/90">
              Launch Editor
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
