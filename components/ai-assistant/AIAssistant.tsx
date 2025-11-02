'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { SendIcon, SparklesIcon } from 'lucide-react';

export function AIAssistant() {
  const [message, setMessage] = useState('');
  const [provider, setProvider] = useState('openai');

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" />
            AI Assistant
          </h2>
        </div>

        {/* AI Provider Selection */}
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select AI Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI GPT-5</SelectItem>
            <SelectItem value="anthropic">Claude Code</SelectItem>
            <SelectItem value="ollama">Ollama 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Card className="p-3 bg-muted/50">
          <p className="text-sm">
            👋 Hello! I’m your AI assistant. I can help you with:
          </p>
          <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
            <li>💬 Explaining code</li>
            <li>🪄 Refactoring and improvements</li>
            <li>🔍 SEO optimization</li>
            <li>⚙️ Debugging and fixes</li>
            <li>🚀 Deploying changes</li>
          </ul>
        </Card>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask me anything about your code..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[80px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // Handle send
              }
            }}
          />
        </div>
        <Button className="w-full mt-2" size="sm">
          <SendIcon className="w-4 h-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );
}
