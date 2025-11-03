"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo.jpg" alt="EzEdit" width={28} height={28} className="rounded" />
          <span className="font-semibold">EzEdit</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/services" className="text-muted-foreground hover:text-foreground">Services</Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
          <Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/editor">Launch Editor</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="container mx-auto flex flex-col gap-4 px-4 pb-4">
            <Link href="/services" className="text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(false)}>Services</Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            <Link href="#features" className="text-muted-foreground hover:text-foreground" onClick={() => setIsMenuOpen(false)}>Features</Link>
            <Button asChild>
              <Link href="/editor" onClick={() => setIsMenuOpen(false)}>Launch Editor</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
