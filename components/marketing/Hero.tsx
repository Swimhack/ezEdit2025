'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MockEditor } from '@/components/marketing/MockEditor';
import { Sparkles, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20">
      <div className="container relative mx-auto px-4 py-16 md:py-24">
        {/* Centered content layout */}
        <div className="mx-auto max-w-5xl text-center space-y-8">
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
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            The Premier Platform for
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Web Design & Hosting
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
          >
            Design, host, update, and optimize your websites—all in one powerful platform. 
            Professional tools with AI assistance to manage your entire web presence.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link href="/editor">
              <Button 
                size="lg" 
                className="px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get started
              </Button>
            </Link>
            <Link href="#features">
              <Button 
                size="lg" 
                variant="outline"
                className="px-8 py-6 text-base font-semibold border-2"
              >
                Talk to sales
              </Button>
            </Link>
          </motion.div>

          {/* Feature badges */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-6 justify-center items-center text-sm text-muted-foreground pt-4"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Lightning-fast editor</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-powered</span>
            </div>
          </motion.div>
        </div>

        {/* Large editor mockup below */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 mx-auto max-w-6xl"
        >
          <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50">
            {/* Browser chrome */}
            <div className="bg-muted/50 border-b border-border/50 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 text-center">
                <div className="inline-block bg-background rounded px-3 py-1 text-xs text-muted-foreground">
                  ezedit.co/editor
                </div>
              </div>
            </div>
            {/* Editor mockup */}
            <MockEditor />
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-6">Trusted by developers and agencies worldwide</p>
            <div className="flex flex-wrap gap-8 justify-center items-center opacity-50 grayscale">
              {/* Add logo placeholders or remove */}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
