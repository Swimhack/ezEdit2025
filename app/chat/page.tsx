'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/app/components/Logo'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: string
}

export default function Chat() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        // TEMPORARY: Bypass authentication for testing
        const BYPASS_AUTH = true
        
        if (BYPASS_AUTH) {
          const mockUser = {
            id: 'test-user-123',
            email: 'james@ekaty.com',
            role: 'superadmin',
            isSuperAdmin: true,
            paywallBypass: true,
            subscriptionTier: 'enterprise',
            plan: 'ENTERPRISE'
          }
          setUser(mockUser)
          setLoading(false)

          // Add welcome message
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            type: 'ai',
            content: 'Hello! I\'m your AI assistant for website editing. I can help you with HTML, CSS, JavaScript, and general web development questions. What would you like to work on today?',
            timestamp: new Date().toISOString()
          }
          setMessages([welcomeMessage])
          return
        }

        // Normal authentication flow - DISABLED FOR NOW
        // const response = await fetch('/api/auth/me')
        // if (!response.ok) {
        //   router.push('/auth/signin')
        //   return
        // }
        // const data = await response.json()
        // setUser(data.user)
        // setLoading(false)

        // Add welcome message
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: 'Hello! I\'m your AI assistant for website editing. I can help you with HTML, CSS, JavaScript, and general web development questions. What would you like to work on today?',
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMessage])
      } catch (error) {
        // Never redirect - just use mock user
        console.log('Error loading user, using mock user:', error)
        const mockUser = {
          id: 'test-user-123',
          email: 'james@ekaty.com',
          role: 'superadmin',
          isSuperAdmin: true,
          paywallBypass: true,
          subscriptionTier: 'enterprise',
          plan: 'ENTERPRISE'
        }
        setUser(mockUser)
        setLoading(false)

        // Add welcome message
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          type: 'ai',
          content: 'Hello! I\'m your AI assistant for website editing. I can help you with HTML, CSS, JavaScript, and general web development questions. What would you like to work on today?',
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMessage])
      }
    }
    getUser()
  }, [router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage })
      })

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.response || 'Sorry, I couldn\'t process that request.',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/')
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Logo variant="nav" showText={true} />
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/websites')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Websites
              </button>
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <button
                onClick={handleSignOut}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
          <p className="text-gray-600 mt-1">Get help with your website editing and development</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-white px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              } rounded-lg px-4 py-2`}>
                <div className="text-sm leading-relaxed">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500 ml-2">AI is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="bg-white border-t px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about web development..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}