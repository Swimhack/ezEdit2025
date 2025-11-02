import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo.jpg" alt="EzEdit" width={28} height={28} className="rounded" />
          <span className="font-semibold">EzEdit</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
          <Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link>
          <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground">How it works</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/editor">Launch Editor</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
