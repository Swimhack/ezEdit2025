'use client';

import { motion } from 'framer-motion';

export function MockEditor() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full aspect-video overflow-hidden rounded-2xl border-2 shadow-2xl shadow-primary/10 bg-gradient-to-br from-card to-background"
    >
      {/* Window chrome */}
      <div className="absolute top-0 left-0 right-0 h-12 border-b bg-card/80 backdrop-blur-md flex items-center gap-2.5 px-4">
        <div className="flex gap-2">
          <span className="size-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors cursor-pointer" />
          <span className="size-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer" />
          <span className="size-3 rounded-full bg-emerald-400 hover:bg-emerald-500 transition-colors cursor-pointer" />
        </div>
        <div className="ml-4 h-7 w-48 rounded-md bg-muted/50 flex items-center px-3">
          <div className="h-2 w-2 rounded-full bg-primary mr-2 animate-pulse" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
      </div>

      <div className="absolute inset-4 top-16 grid grid-cols-[1fr_2fr_1.2fr] gap-2">
        {/* File Explorer */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border-2 border-primary/10 bg-card/50 backdrop-blur-sm p-4 space-y-2.5 shadow-lg"
        >
          <div className="h-7 w-28 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10" />
          {[75, 65, 85, 80, 65, 60].map((width, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="h-3.5 rounded bg-muted/70"
              style={{ width: `${width}%` }}
            />
          ))}
        </motion.div>

        {/* Code Editor */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-xl border-2 border-primary/10 bg-card/50 backdrop-blur-sm p-4 shadow-lg"
        >
          <div className="h-7 w-44 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.03 }}
                className="h-3.5 rounded bg-gradient-to-r from-muted via-primary/5 to-muted/70"
                style={{ 
                  width: `${55 + ((i * 17) % 35)}%`,
                  marginLeft: i % 3 === 0 ? '0' : '1.5rem'
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* AI Assistant */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-xl border-2 border-primary/10 bg-card/50 backdrop-blur-sm p-4 space-y-3 shadow-lg"
        >
          <div className="h-7 w-36 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10" />
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
            className="h-20 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
          />
          <div className="h-12 rounded-lg bg-muted/50" />
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-9 w-2/3 rounded-lg bg-gradient-to-r from-primary/30 to-primary/20 shadow-md shadow-primary/10"
          />
        </motion.div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/5 via-transparent to-primary/10 pointer-events-none" />
    </motion.div>
  );
}
