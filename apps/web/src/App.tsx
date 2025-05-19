import './styles/brand.css';
import FileBrowser from './components/FileBrowser';
import { ChatDemo } from './components/ChatDemo';

const mockFiles = [
  'index.html',
  'about.html',
  'styles.css',
];

export default function App() {
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
