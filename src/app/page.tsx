import Link from 'next/link'
import { ArrowRight, Code, Zap, Shield, Globe, Bot, Save } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Ez</span>
              </div>
              <span className="font-semibold text-xl text-gray-900 dark:text-white">EzEdit.co</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Features</a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Pricing</a>
              <Link href="/docs" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Docs</Link>
              <Link href="/auth/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Login</Link>
              <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Edit Legacy Websites with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AI-Powered
              </span>{' '}
              Simplicity
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Connect to any website via FTP/SFTP and update your code using natural language prompts. 
              Secure, fast, and incredibly simple.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth/register" className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/editor" className="inline-flex items-center px-8 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Try Demo
              </Link>
            </div>

            {/* Email Signup */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-auto shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Get Early Access</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Get Invite
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to Edit Your Website
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Powerful features designed for modern web development
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Direct FTP Access</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect to any FTP/SFTP server and browse your files instantly. No software installation required.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Powerful Code Editor</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monaco Editor with syntax highlighting, auto-completion, and multi-file support.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI Assistant</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get intelligent code suggestions, error fixes, and explanations powered by advanced AI.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Save className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Auto-Save & History</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Never lose your work with automatic saving and complete version history for all edits.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Secure Connection</h3>
              <p className="text-gray-600 dark:text-gray-300">
                All connections are encrypted and credentials are stored securely with bank-level encryption.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Works Everywhere</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access from any device with a web browser. Desktop, tablet, or mobile - edit anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              No setup fees • Cancel anytime • 30-day money back guarantee
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Free</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                $0<span className="text-lg font-normal text-gray-500">/forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  1 FTP connection
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Basic code editor
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  5 AI requests/day
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Community support
                </li>
              </ul>
              <Link href="/auth/register" className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-center block">
                Start Free
              </Link>
            </div>

            {/* Single Site */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Single Site</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                $20<span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  1 FTP connection
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Advanced editor features
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Unlimited AI assistance
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Priority support
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Auto-save & history
                </li>
              </ul>
              <Link href="/auth/register" className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center block">
                Start Free Trial
              </Link>
            </div>

            {/* Unlimited */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Unlimited</h3>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                $100<span className="text-lg font-normal text-gray-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Unlimited FTP connections
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  All editor features
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Unlimited AI assistance
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Premium support
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  Team collaboration
                </li>
                <li className="flex items-center text-gray-600 dark:text-gray-300">
                  <span className="text-green-500 mr-2">✓</span>
                  API access
                </li>
              </ul>
              <Link href="/auth/register" className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center block">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Ez</span>
                </div>
                <span className="font-semibold text-xl text-gray-900 dark:text-white">EzEdit.co</span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                The easiest way to edit your website files with AI assistance.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Features</a></li>
                <li><a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Pricing</a></li>
                <li><Link href="/docs" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">About</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Blog</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              &copy; 2024 EzEdit.co. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}