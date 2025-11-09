/**
 * Editor Page - Three-pane FTP editor with file tree, Monaco editor, and preview
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EditorProvider } from '@/lib/editor-state';
import ThreePaneEditor from '@/components/editor/ThreePaneEditor';
import Logo from '@/app/components/Logo';

interface Website {
  id: string;
  name: string;
  url: string;
  type: string;
  host: string;
  username: string;
  port: string;
  path: string;
}

export default function EditorPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [website, setWebsite] = useState<Website | null>(null);
  const [error, setError] = useState('');

  const router = useRouter();
  const params = useParams();
  const websiteId = params.websiteId as string;

  // Authentication and website loading
  useEffect(() => {
    const loadEditor = async () => {
      try {
        // TEMPORARY: Bypass authentication for testing
        const BYPASS_AUTH = true;
        
        if (BYPASS_AUTH) {
          console.log('⚠️ Authentication bypassed for editor testing');
          // Create mock user for testing
          const mockUser = {
            id: 'test-user-123',
            email: 'james@ekaty.com',
            role: 'superadmin',
            isSuperAdmin: true,
            paywallBypass: true,
            subscriptionTier: 'enterprise'
          };
          setUser(mockUser);
        } else {
          // Check authentication
          const authResponse = await fetch('/api/auth/me');
          if (!authResponse.ok) {
            router.push('/auth/signin');
            return;
          }

          const authData = await authResponse.json();
          setUser(authData.user);
        }

        // Load website configuration
        const websiteResponse = await fetch(`/api/websites/${websiteId}`);
        if (!websiteResponse.ok) {
          const errorData = await websiteResponse.json().catch(() => ({ error: 'Website not found' }));
          throw new Error(errorData.error || 'Website not found or access denied');
        }

        const websiteData = await websiteResponse.json();
        setWebsite(websiteData.website);

        setLoading(false);
      } catch (error) {
        console.error('Failed to load editor:', error);
        setError(error instanceof Error ? error.message : 'Failed to load editor');
        setLoading(false);
      }
    };

    if (websiteId) {
      loadEditor();
    }
  }, [websiteId, router]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading Editor</h2>
          <p className="text-gray-600">Connecting to your website...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Editor</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Website not found
  if (!website) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Website Not Found</h2>
          <p className="text-gray-600 mb-6">The website you're trying to edit could not be found.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Navigation Bar - Dark theme to match editor */}
      <nav className="bg-[#252526] shadow-sm border-b border-[#3e3e42] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-[#007acc]">EzEdit</span>
          </div>
          <span className="text-[#858585]">|</span>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold text-[#cccccc]">
              {website.name}
            </h1>
            <span className="text-[#858585]">|</span>
            <span className="text-sm text-[#858585]">{website.host}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-[#cccccc]">
            Welcome, {user?.email}
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[#cccccc] hover:text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-[#37373d] transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={handleSignOut}
            className="bg-[#3c3c3c] text-[#cccccc] px-3 py-1 rounded-md text-sm font-medium hover:bg-[#4a4a4a] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Three-Pane Editor */}
      <div className="flex-1 overflow-hidden">
        <EditorProvider>
          <ThreePaneEditor
            connectionId={websiteId}
            connectionConfig={{
              host: website.host,
              port: parseInt(website.port) || 21,
              username: website.username,
              protocol: website.type.toLowerCase() as 'ftp' | 'ftps' | 'sftp',
              timeout: 30000,
              passive: true
            }}
            className="h-full"
          />
        </EditorProvider>
      </div>
    </div>
  );
}