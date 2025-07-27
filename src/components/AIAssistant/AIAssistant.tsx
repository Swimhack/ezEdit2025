'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAIStore, useEditorStore } from '@/store'
import { AIMessage } from '@/types'
import { Send, Bot, User, Loader2, MessageSquare, Trash2, Plus } from 'lucide-react'

interface MessageBubbleProps {
  message: AIMessage
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
          ${isUser ? 'bg-blue-600 ml-2' : 'bg-gray-600 mr-2'}
        `}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
        
        <div className={`
          rounded-lg px-4 py-2 break-words
          ${isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
          }
        `}>
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          {message.context && (
            <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-600 text-xs opacity-70">
              {message.context.file_path && (
                <div>File: {message.context.file_path}</div>
              )}
              {message.context.language && (
                <div>Language: {message.context.language}</div>
              )}
            </div>
          )}
          <div className="text-xs opacity-70 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AIAssistant() {
  const { 
    conversations, 
    activeConversation, 
    loading, 
    streaming,
    setActiveConversation,
    addConversation,
    updateConversation,
    removeConversation,
    setLoading,
    setStreaming 
  } = useAIStore()
  
  const { open_files, active_file_id } = useEditorStore()
  const [message, setMessage] = useState('')
  const [showConversations, setShowConversations] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeFile = open_files.find(f => f.id === active_file_id)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages])

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
      context: activeFile ? {
        file_path: activeFile.path,
        language: activeFile.language,
        selected_code: undefined, // TODO: Get selected code from editor
      } : undefined,
    }

    let conversation = activeConversation
    
    // Create new conversation if none exists
    if (!conversation) {
      conversation = {
        id: Date.now().toString(),
        title: message.trim().slice(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'current-user', // TODO: Get from auth
      }
      addConversation(conversation)
    }

    // Add user message
    const updatedMessages = [...conversation.messages, userMessage]
    updateConversation(conversation.id, { 
      messages: updatedMessages,
      updated_at: new Date().toISOString()
    })

    setMessage('')
    setLoading(true)

    try {
      // TODO: Implement actual AI API call
      await simulateAIResponse(conversation.id, userMessage)
    } catch (error) {
      console.error('Error sending message:', error)
      // TODO: Add error handling
    } finally {
      setLoading(false)
    }
  }

  const simulateAIResponse = async (conversationId: string, userMessage: AIMessage) => {
    setStreaming(true)
    
    // Simulate streaming response
    const responses = [
      "I can help you with that! Let me analyze your code.",
      "Based on your file, I can suggest some improvements.",
      "Here's what I think about your question:",
      "Let me break this down for you:",
      "That's a great question! Here's my suggestion:",
    ]
    
    const response = responses[Math.floor(Math.random() * responses.length)]
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const aiMessage: AIMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    }

    const conversation = conversations.find(c => c.id === conversationId)
    if (conversation) {
      const updatedMessages = [...conversation.messages, aiMessage]
      updateConversation(conversationId, { 
        messages: updatedMessages,
        updated_at: new Date().toISOString()
      })
    }
    
    setStreaming(false)
  }

  const handleNewConversation = () => {
    setActiveConversation(null)
    setShowConversations(false)
  }

  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeConversation(conversationId)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">AI Assistant</h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleNewConversation}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="New Conversation"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => setShowConversations(!showConversations)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Conversations"
            >
              <MessageSquare size={14} />
            </button>
          </div>
        </div>
        
        {activeFile && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
            Context: {activeFile.name}
          </div>
        )}
      </div>

      {/* Conversations List */}
      {showConversations && (
        <div className="border-b border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="py-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`
                    px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 group
                    ${activeConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                  onClick={() => {
                    setActiveConversation(conversation)
                    setShowConversations(false)
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 truncate">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conversation.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {conversation.messages.length} messages
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {!activeConversation || activeConversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <Bot size={48} className="mx-auto mb-4 opacity-50" />
              <h4 className="text-lg font-medium mb-2">AI Assistant</h4>
              <p className="text-sm mb-4">
                Ask questions about your code, get suggestions, or request explanations.
              </p>
              {activeFile && (
                <p className="text-xs">
                  Currently viewing: <span className="font-mono">{activeFile.name}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            {activeConversation.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {(loading || streaming) && (
              <div className="flex justify-start mb-4">
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-medium mr-2">
                    <Bot size={16} />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-1">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {streaming ? 'Thinking...' : 'Sending...'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your code, request changes, or get explanations..."
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || loading}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Press Shift+Enter for new line, Enter to send
        </div>
      </div>
    </div>
  )
}