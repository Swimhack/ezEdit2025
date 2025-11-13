'use client'

import { useState } from 'react'

interface ConnectionWizardProps {
  onComplete: (websiteData: any) => void
  onCancel: () => void
}

type Step = 'platform' | 'credentials' | 'test' | 'confirm'

type Platform = 'wordpress' | 'cpanel' | 'ftp' | 'custom'

export default function ConnectionWizard({ onComplete, onCancel }: ConnectionWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('platform')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  
  const [websiteData, setWebsiteData] = useState({
    name: '',
    url: '',
    type: 'SFTP',
    host: '',
    username: '',
    password: '',
    port: '22',
    path: '/'
  })

  const platforms = [
    {
      id: 'wordpress' as Platform,
      name: 'WordPress',
      description: 'I have a WordPress website',
      icon: '🌐',
      defaultType: 'SFTP',
      defaultPort: '22',
      defaultPath: '/public_html/wp-content',
      helpText: 'Most WordPress sites use SFTP (secure). Check your hosting provider for SFTP credentials. Look for "SSH/SFTP Access" in your hosting control panel.'
    },
    {
      id: 'cpanel' as Platform,
      name: 'cPanel Hosting',
      description: 'I use cPanel, Bluehost, HostGator, etc.',
      icon: '🏢',
      defaultType: 'SFTP',
      defaultPort: '22',
      defaultPath: '/public_html',
      helpText: 'cPanel supports SFTP for secure file transfers. Find your SFTP credentials in cPanel under "SSH Access" or "FTP Accounts". Use the same username/password as your cPanel login or create a new FTP account.'
    },
    {
      id: 'ftp' as Platform,
      name: 'FTP/SFTP',
      description: 'I have FTP or SFTP credentials',
      icon: '📁',
      defaultType: 'SFTP',
      defaultPort: '22',
      defaultPath: '/',
      helpText: 'SFTP (Secure FTP) is recommended over regular FTP. Use the connection details provided by your hosting provider. If SFTP is not available, you can change to FTP below.'
    },
    {
      id: 'custom' as Platform,
      name: 'Custom Setup',
      description: 'Advanced configuration',
      icon: '⚙️',
      defaultType: 'SFTP',
      defaultPort: '22',
      defaultPath: '/',
      helpText: 'Full control over all connection settings. Choose the protocol and configure all parameters manually.'
    }
  ]

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform)
    const platformConfig = platforms.find(p => p.id === platform)
    if (platformConfig) {
      setWebsiteData({
        ...websiteData,
        type: platformConfig.defaultType,
        port: platformConfig.defaultPort,
        path: platformConfig.defaultPath
      })
    }
    setCurrentStep('credentials')
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/websites/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: websiteData.host,
          port: websiteData.port,
          username: websiteData.username,
          password: websiteData.password,
          type: websiteData.type,
          path: websiteData.path
        })
      })

      const data = await response.json()
      setTestResult(data)
      
      if (data.success) {
        setCurrentStep('confirm')
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Test failed',
        error: {
          code: 'NETWORK_ERROR',
          message: 'Could not reach the server',
          suggestion: 'Check your internet connection and try again'
        }
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleComplete = () => {
    onComplete(websiteData)
  }

  const renderStepIndicator = () => {
    const steps = [
      { id: 'platform', label: 'Platform', number: 1 },
      { id: 'credentials', label: 'Credentials', number: 2 },
      { id: 'test', label: 'Test', number: 3 },
      { id: 'confirm', label: 'Confirm', number: 4 }
    ]

    const currentIndex = steps.findIndex(s => s.id === currentStep)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              index <= currentIndex 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index < currentIndex ? '✓' : step.number}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-1 mx-2 ${
                index < currentIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Connect Your Website</h2>
            <p className="text-gray-600">Follow these simple steps to connect your website</p>
          </div>

          {renderStepIndicator()}

          {/* Step 1: Platform Selection */}
          {currentStep === 'platform' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Choose Your Platform</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => handlePlatformSelect(platform.id)}
                    className="text-left p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="text-4xl mb-3">{platform.icon}</div>
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600">
                      {platform.name}
                    </h4>
                    <p className="text-sm text-gray-600">{platform.description}</p>
                  </button>
                ))}
              </div>
              <div className="mt-6 text-center">
                <button
                  onClick={onCancel}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Credentials */}
          {currentStep === 'credentials' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Step 2: Enter Connection Details</h3>
                <button
                  onClick={() => setCurrentStep('platform')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  ← Change Platform
                </button>
              </div>

              {/* Help Text */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Where to find these details:</h4>
                    <p className="text-sm text-blue-800">
                      {platforms.find(p => p.id === selectedPlatform)?.helpText}
                    </p>
                  </div>
                </div>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={websiteData.name}
                    onChange={(e) => setWebsiteData({...websiteData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="My Awesome Website"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={websiteData.url}
                    onChange={(e) => setWebsiteData({...websiteData, url: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Connection Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={websiteData.type}
                      onChange={(e) => setWebsiteData({
                        ...websiteData, 
                        type: e.target.value,
                        port: e.target.value === 'SFTP' ? '22' : e.target.value === 'FTPS' ? '990' : '21'
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="FTP">FTP (Standard)</option>
                      <option value="SFTP">SFTP (Secure)</option>
                      <option value="FTPS">FTPS (SSL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={websiteData.port}
                      onChange={(e) => setWebsiteData({...websiteData, port: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host/Server <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={websiteData.host}
                    onChange={(e) => setWebsiteData({...websiteData, host: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ftp.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={websiteData.username}
                    onChange={(e) => setWebsiteData({...websiteData, username: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={websiteData.password}
                      onChange={(e) => setWebsiteData({...websiteData, password: e.target.value})}
                      className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remote Path (Optional)
                  </label>
                  <input
                    type="text"
                    value={websiteData.path}
                    onChange={(e) => setWebsiteData({...websiteData, path: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="/public_html"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave as "/" if unsure</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep('test')
                      handleTestConnection()
                    }}
                    disabled={!websiteData.host || !websiteData.username || !websiteData.password}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue to Test →
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Test Connection */}
          {currentStep === 'test' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Step 3: Testing Connection</h3>

              {testingConnection && (
                <div className="text-center py-12">
                  <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Testing your connection...</h4>
                  <p className="text-gray-600">This may take a few seconds</p>
                </div>
              )}

              {!testingConnection && testResult && !testResult.success && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <svg className="h-8 w-8 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 text-lg mb-2">{testResult.message}</h4>
                      {testResult.error && (
                        <div className="text-sm text-red-800 space-y-2">
                          <p className="font-medium">{testResult.error.message}</p>
                          <p className="whitespace-pre-line">{testResult.error.suggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setCurrentStep('credentials')}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700"
                    >
                      ← Fix Credentials
                    </button>
                    <button
                      onClick={handleTestConnection}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Confirm */}
          {currentStep === 'confirm' && testResult && testResult.success && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Step 4: Confirm & Save</h3>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                  <svg className="h-8 w-8 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-green-900 text-lg mb-2">✓ Connection Successful!</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p>✓ Connected to {websiteData.host}</p>
                      <p>✓ Found {testResult.details?.fileCount} files/folders</p>
                      {testResult.details?.detectedPlatform && (
                        <p>✓ Detected: {testResult.details.detectedPlatform}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Connection Summary</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Website Name:</dt>
                    <dd className="font-medium text-gray-900">{websiteData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">URL:</dt>
                    <dd className="font-medium text-gray-900">{websiteData.url}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Connection Type:</dt>
                    <dd className="font-medium text-gray-900">{websiteData.type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Host:</dt>
                    <dd className="font-medium text-gray-900">{websiteData.host}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Username:</dt>
                    <dd className="font-medium text-gray-900">{websiteData.username}</dd>
                  </div>
                </dl>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleComplete}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Save Website ✓
                </button>
                <button
                  onClick={() => setCurrentStep('credentials')}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Edit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
