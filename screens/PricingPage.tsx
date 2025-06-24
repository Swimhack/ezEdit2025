import React from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function PricingPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-primary-500 text-2xl font-bold">Ez</span>
              <span className="text-gray-800 text-xl">Edit.co</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-500 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-500 hover:text-gray-900">Pricing</a>
              <a href="#docs" className="text-gray-500 hover:text-gray-900">Docs</a>
            </nav>
            <div className="flex space-x-4">
              <Button variant="outline">Log in</Button>
              <Button variant="primary">Sign up</Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">Simple, Transparent Pricing</h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">Choose the plan that works best for you</p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {/* Free Trial Plan */}
            <Card className="border border-gray-200">
              <Card.header>
                <h3 className="text-2xl font-bold text-gray-900">Free Trial</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-900">$0</span>
                  <span className="ml-1 text-xl font-semibold text-gray-500">/7 days</span>
                </div>
              </Card.header>
              <Card.body>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">Connect to FTP/SFTP sites</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">View & preview files</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">Basic AI assistance</span>
                  </li>
                  <li className="flex items-start opacity-50">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="ml-3 text-base text-gray-500">Save changes to server</span>
                  </li>
                </ul>
              </Card.body>
              <Card.footer>
                <Button variant="outline" className="w-full">Start Free Trial</Button>
              </Card.footer>
            </Card>

            {/* Pro Plan */}
            <Card className="border border-primary-500 shadow-lg relative">
              <div className="absolute top-0 inset-x-0 transform -translate-y-1/2">
                <div className="inline-flex rounded-full bg-primary-500 px-4 py-1 text-sm font-semibold text-white">
                  Most Popular
                </div>
              </div>
              <Card.header>
                <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-900">$50</span>
                  <span className="ml-1 text-xl font-semibold text-gray-500">/month</span>
                </div>
              </Card.header>
              <Card.body>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">Unlimited FTP/SFTP sites</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">View & preview files</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">Advanced AI assistance</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">Save & publish changes</span>
                  </li>
                </ul>
              </Card.body>
              <Card.footer>
                <Button variant="primary" className="w-full">Get Started</Button>
              </Card.footer>
            </Card>

            {/* One-Time Site Plan */}
            <Card className="border border-gray-200">
              <Card.header>
                <h3 className="text-2xl font-bold text-gray-900">One-Time Site</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-extrabold tracking-tight text-gray-900">$500</span>
                  <span className="ml-1 text-xl font-semibold text-gray-500">one-time</span>
                </div>
              </Card.header>
              <Card.body>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">Single FTP/SFTP site</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">View & preview files</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">Advanced AI assistance</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-base text-gray-700">Save & publish changes</span>
                  </li>
                </ul>
              </Card.body>
              <Card.footer>
                <Button variant="outline" className="w-full">Purchase</Button>
              </Card.footer>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#features" className="text-base text-gray-500 hover:text-gray-900">Features</a></li>
                <li><a href="#pricing" className="text-base text-gray-500 hover:text-gray-900">Pricing</a></li>
                <li><a href="#docs" className="text-base text-gray-500 hover:text-gray-900">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Resources</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">FTP Guide</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Editor Guide</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">About Us</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Contact</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">&copy; 2025 EzEdit.co. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
