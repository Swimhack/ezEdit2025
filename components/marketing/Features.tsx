'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SparklesIcon, UploadIcon, ServerIcon, ShieldIcon, Code2, Workflow, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export function Features() {
  const items = [
    {
      title: 'AI-Powered Editing',
      description: 'Natural language commands to refactor, explain, and optimize code with OpenAI, Claude, or Ollama.',
      icon: SparklesIcon,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Multi-Platform Support',
      description: 'Connect to FTP, SFTP, WordPress, Wix, and S3. Edit content anywhere, instantly.',
      icon: Globe,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Monaco Editor',
      description: 'Industry-leading code editor with IntelliSense, syntax highlighting, and 40+ languages.',
      icon: Code2,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Smart Workflows',
      description: 'One-click deploy with auto-backups and rollback. Ship changes with confidence.',
      icon: Workflow,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'Server Management',
      description: 'Direct FTP/SFTP access to edit files remotely with built-in file explorer.',
      icon: ServerIcon,
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      title: 'Enterprise Security',
      description: 'Encrypted credentials, secure connections, and comprehensive audit logs.',
      icon: ShieldIcon,
      gradient: 'from-teal-500 to-cyan-500',
    },
  ];

  return (
    <section id="features" className="relative py-24 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything you need to{' '}
            <span className="text-primary">code smarter</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Built for developers and editors to work faster with confidence. 
            Professional tools, simplified.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ title, description, icon: Icon, gradient }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="relative h-full overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <CardHeader className="relative">
                  <div className="flex items-start gap-4">
                    {/* Icon with gradient background */}
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <CardDescription className="text-base leading-relaxed">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
