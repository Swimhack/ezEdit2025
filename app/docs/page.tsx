import Link from 'next/link'
import Logo from '../components/Logo'

export default function Docs() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="flex items-center justify-between px-6 py-4 lg:px-8 border-b">
        <div className="flex items-center">
          <Link href="/">
            <Logo variant="nav" showText={true} />
          </Link>
        </div>
        <div className="flex items-center gap-x-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
            Back to Home
          </Link>
          <Link href="/auth/signin" className="text-gray-900 hover:text-gray-600 font-medium">
            Log in
          </Link>
          <Link href="/auth/signup" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Sign up
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
        <p className="text-lg text-gray-600 mb-12">
          Learn how to use EzEdit to update your website instantly with AI
        </p>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
          <div className="prose prose-blue max-w-none">
            <p className="text-gray-600 mb-4">
              EzEdit makes it easy to update your legacy website without coding knowledge.
            </p>
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>Sign up for a free account</li>
              <li>Connect your FTP server credentials</li>
              <li>Browse your files in the visual editor</li>
              <li>Make changes using AI or manual editing</li>
              <li>Preview and publish your updates</li>
            </ol>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Features</h2>
          <div className="grid gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Editing</h3>
              <p className="text-gray-600">
                Describe what you want in plain English, and our AI will generate the code for you.
              </p>
            </div>
            <div className="border rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Direct FTP Access</h3>
              <p className="text-gray-600">
                Connect directly to your existing website via FTP. No migration required.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
