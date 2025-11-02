'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MockEditor } from '@/components/marketing/MockEditor';
import { Sparkles, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-50/50 dark:from-primary/10 dark:via-background dark:to-blue-950/20" />
      
      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
            >
              <Sparkles className="h-4 w-4" />
              AI-Powered Editor
            </motion.div>

            {/* Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Edit Anywhere,
              <br />
              <span className="text-primary">Deploy Instantly</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground leading-relaxed">
              Professional code editor with FTP, WordPress, and Wix integration. 
              Edit remotely with natural language AI assistance.
            </p>

            {/* Features list */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Lightning-fast Monaco Editor</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium">Secure FTP/SFTP connections</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              <Link href="/editor">
                <Button 
                  size="lg" 
                  className="rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                >
                  Launch Editor
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="rounded-full px-8 py-6 text-base font-semibold border-2"
                >
                  Explore Features
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <MockEditor />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
