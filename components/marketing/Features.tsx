'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SparklesIcon, UploadIcon, ServerIcon, ShieldIcon, Code2, Workflow, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export function Features() {
  const items = [
    {
      title: 'Professional Web Design',
      description: 'Industry-leading Monaco editor with IntelliSense, 40+ languages, and real-time preview for stunning websites.',
      icon: Code2,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Integrated Hosting',
      description: 'Seamless hosting integration with one-click deployment. Connect to any platform—FTP, SFTP, WordPress, Wix.',
      icon: ServerIcon,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Instant Updates',
      description: 'Push updates instantly with auto-backups and rollback. Keep your sites fresh with zero downtime.',
      icon: Workflow,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'SEO Optimization',
      description: 'Built-in SEO tools and AI-powered optimization to boost your search rankings and drive traffic. (Coming Soon)',
      icon: SparklesIcon,
      gradient: 'from-orange-500 to-red-500',
      badge: 'Coming Soon',
    },
    {
      title: 'Multi-Platform Support',
      description: 'Work across all major platforms. WordPress, Wix, custom servers—manage everything in one place.',
      icon: Globe,
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      title: 'Enterprise Security',
      description: 'Bank-level security with encrypted credentials, secure connections, and comprehensive audit logs.',
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
            Your Complete{' '}
            <span className="text-primary">Web Platform</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Design, host, update, and optimize—all in one place. 
            The premier solution for modern web management.
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
