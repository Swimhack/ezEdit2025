'use client';

import { motion } from 'framer-motion';
import { Folder, FileCode, Sparkles } from 'lucide-react';

export function MockEditor() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full aspect-video overflow-hidden bg-[#1e1e1e] dark:bg-[#1e1e1e]"
    >
      {/* Top bar */}
      <div className="h-9 bg-[#2d2d2d] border-b border-[#1e1e1e] flex items-center px-3 gap-4 text-xs text-gray-400">
        <span className="text-white">index.tsx</span>
        <span>styles.css</span>
        <span>components/Hero.tsx</span>
      </div>

      <div className="flex h-[calc(100%-2.25rem)]">
        {/* File Explorer */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-48 bg-[#252526] border-r border-[#1e1e1e] p-2 overflow-hidden"
        >
          <div className="text-xs font-semibold text-gray-400 mb-2 px-2">FILES</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 px-2 py-1 text-gray-300 hover:bg-[#2a2d2e] rounded cursor-pointer">
              <Folder className="w-3 h-3 text-yellow-500" />
              <span>src</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 ml-4 text-gray-300 hover:bg-[#2a2d2e] rounded cursor-pointer">
              <FileCode className="w-3 h-3 text-blue-400" />
              <span>index.tsx</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 ml-4 text-gray-300 hover:bg-[#2a2d2e] rounded cursor-pointer">
              <FileCode className="w-3 h-3 text-pink-400" />
              <span>styles.css</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 text-gray-300 hover:bg-[#2a2d2e] rounded cursor-pointer">
              <Folder className="w-3 h-3 text-yellow-500" />
              <span>components</span>
            </div>
          </div>
        </motion.div>

        {/* Code Editor */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex-1 bg-[#1e1e1e] p-4 font-mono text-sm overflow-hidden"
        >
          <div className="space-y-1 text-[13px] leading-relaxed">
            <div><span className="text-gray-500">1</span>  <span className="text-purple-400">import</span> <span className="text-gray-300">React</span> <span className="text-purple-400">from</span> <span className="text-orange-300">'react'</span><span className="text-gray-500">;</span></div>
            <div><span className="text-gray-500">2</span>  <span className="text-purple-400">import</span> <span className="text-gray-300">{`{ Hero }`}</span> <span className="text-purple-400">from</span> <span className="text-orange-300">'./components'</span><span className="text-gray-500">;</span></div>
            <div><span className="text-gray-500">3</span></div>
            <div><span className="text-gray-500">4</span>  <span className="text-purple-400">export</span> <span className="text-purple-400">default</span> <span className="text-blue-400">function</span> <span className="text-yellow-300">App</span><span className="text-gray-300">()</span> <span className="text-gray-300">{`{`}</span></div>
            <div><span className="text-gray-500">5</span>    <span className="text-purple-400">return</span> <span className="text-gray-300">(</span></div>
            <div><span className="text-gray-500">6</span>      <span className="text-gray-500 ml-4">&lt;</span><span className="text-green-400">div</span> <span className="text-blue-300">className</span>=<span className="text-orange-300">"container"</span><span className="text-gray-500">&gt;</span></div>
            <div><span className="text-gray-500">7</span>        <span className="text-gray-500 ml-8">&lt;</span><span className="text-green-400">Hero</span> <span className="text-blue-300">title</span>=<span className="text-orange-300">"Welcome"</span> <span className="text-gray-500">/&gt;</span></div>
            <div className="bg-blue-500/10 border-l-2 border-blue-500"><span className="text-gray-500">8</span>        <span className="text-gray-500 ml-8">&lt;</span><span className="text-green-400">section</span> <span className="text-blue-300">id</span>=<span className="text-orange-300">"features"</span><span className="text-gray-500">&gt;</span></div>
            <div><span className="text-gray-500">9</span>          <span className="text-gray-500 ml-12">&lt;</span><span className="text-green-400">h2</span><span className="text-gray-500">&gt;</span>Amazing Features<span className="text-gray-500">&lt;/</span><span className="text-green-400">h2</span><span className="text-gray-500">&gt;</span></div>
            <div><span className="text-gray-500">10</span>        <span className="text-gray-500 ml-8">&lt;/</span><span className="text-green-400">section</span><span className="text-gray-500">&gt;</span></div>
            <div><span className="text-gray-500">11</span>      <span className="text-gray-500 ml-4">&lt;/</span><span className="text-green-400">div</span><span className="text-gray-500">&gt;</span></div>
            <div><span className="text-gray-500">12</span>    <span className="text-gray-300">)</span><span className="text-gray-500">;</span></div>
            <div><span className="text-gray-500">13</span>  <span className="text-gray-300">{`}`}</span></div>
          </div>
        </motion.div>

        {/* AI Assistant Panel */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="w-72 bg-[#252526] border-l border-[#1e1e1e] p-3 overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-gray-300">AI ASSISTANT</span>
          </div>
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3"
          >
            <div className="text-xs text-gray-300 mb-2">💡 Suggestion</div>
            <div className="text-xs text-gray-400">Add responsive breakpoints to improve mobile layout</div>
          </motion.div>
          <div className="bg-[#2d2d2d] rounded-lg p-2 text-xs text-gray-400">
            <div className="mb-2">Ask AI to help:</div>
            <div className="space-y-1">
              <div className="hover:bg-[#1e1e1e] p-1 rounded cursor-pointer">• Optimize SEO</div>
              <div className="hover:bg-[#1e1e1e] p-1 rounded cursor-pointer">• Fix bugs</div>
              <div className="hover:bg-[#1e1e1e] p-1 rounded cursor-pointer">• Refactor code</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
