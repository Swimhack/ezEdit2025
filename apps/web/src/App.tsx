import './styles/brand.css';
import FileBrowser from './components/FileBrowser';
import { ChatDemo } from './components/ChatDemo';
import { useEffect } from 'react';

const mockFiles = [
  'index.html',
  'about.html',
  'styles.css',
];

export default function App() {
  // Debug logging to help diagnose blank screen issues
  useEffect(() => {
    console.log('🟢 App component mounted successfully');
    console.log('Environment:', import.meta.env.MODE);
    console.log('Debug enabled:', import.meta.env.VITE_ENABLE_DEBUG);
    
    // Add visible debug element if debug is enabled
    if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      const debugEl = document.createElement('div');
      debugEl.style.position = 'fixed';
      debugEl.style.top = '10px';
      debugEl.style.right = '10px';
      debugEl.style.zIndex = '9999';
      debugEl.style.background = 'rgba(0,0,0,0.7)';
      debugEl.style.color = 'white';
      debugEl.style.padding = '5px 10px';
      debugEl.style.borderRadius = '4px';
      debugEl.style.fontFamily = 'monospace';
      debugEl.textContent = `ezEdit Loaded ✅ - ${new Date().toLocaleTimeString()}`;
      document.body.appendChild(debugEl);
    }
  }, []);
  
  const handleFileSelect = (filename: string) => {
    // For now, just log the selected file
    console.log('Selected file:', filename);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ezedit-bg)', color: 'var(--ezedit-white)' }}>
      <header style={{ padding: '1rem', background: 'var(--ezedit-blue)' }}>
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: '2rem', letterSpacing: '0.05em' }}>EzEdit</h1>
      </header>
      <main style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
        <aside style={{ width: 250, background: 'var(--ezedit-dark-blue)', borderRadius: 8, padding: 16 }}>
          <FileBrowser files={mockFiles} onSelect={handleFileSelect} />
        </aside>
        <section style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Monaco Editor placeholder */}
          <div style={{ background: '#222', borderRadius: 8, minHeight: 300, padding: 16 }}>Monaco Editor</div>
          {/* TinyMCE Preview placeholder */}
          <div style={{ background: '#333', borderRadius: 8, minHeight: 200, padding: 16 }}>TinyMCE Preview</div>
        </section>
        <aside style={{ width: 350, background: 'var(--ezedit-dark-blue)', borderRadius: 8, padding: 16 }}>
          <ChatDemo />
        </aside>
      </main>
    </div>
  );
}
