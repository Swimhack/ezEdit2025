import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Send } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Invite requested for:', email);
    // Here you would typically send this email to your backend
    alert(`Invite will be sent to ${email}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* Sticky Header/Navbar */}
      <header className="sticky top-0 z-40 bg-white py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <div className="bg-blue-500 text-white font-bold rounded p-1 text-lg">Ez</div>
            <span className="font-semibold text-xl tracking-tight text-blue-500">EzEdit.co</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/#features" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Features</Link>
            <Link to="/#pricing" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Pricing</Link>
            <Link to="/#docs" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Docs</Link>
          </nav>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 p-2">
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
            </Link>
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors">Log in</Link>
            <Link to="/signup">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-16">
        {/* Hero Section */}
        <section className="pt-16 pb-16 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-slate-900 max-w-4xl mx-auto">
                Edit Legacy Websites with <span className="text-blue-500">AI-<br/>Powered</span> Simplicity
              </h1>
              <p className="text-xl text-gray-500 mt-6 max-w-2xl mx-auto">
                Connect to any website via FTP/SFTP and update your code using
                natural language prompts. Secure, fast, and incredibly simple.
              </p>
              
              <div className="mt-16 flex flex-col items-center gap-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-4">Get early access to EzEdit</h2>
                  <form onSubmit={handleEmailSubmit} className="flex w-full max-w-md mx-auto">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-r-none border-r-0 focus-visible:ring-blue-500 focus-visible:border-blue-500"
                    />
                    <Button type="submit" className="rounded-l-none bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center gap-2">
                      <span>Get Invite</span>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-8 py-2">
                    Get Started for Free
                  </Button>
                  <Button size="lg" variant="outline" className="border border-gray-300 hover:border-gray-400 text-gray-600 px-8 py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section - Removed for simplicity to match the screenshot */}
      </main>
    </div>
  );
}

// Feature card component removed as it's not needed for the landing page shown in the screenshot
