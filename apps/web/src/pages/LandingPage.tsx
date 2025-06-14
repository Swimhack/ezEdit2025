import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';

/**
 * LandingPage component - Main landing page for ezEdit
 * Inspired by the design from the landing page repository
 */
export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send the email to a backend service
    console.log('Submitted email:', email);
    setEmail('');
    alert('Thanks for your interest! We\'ll be in touch soon.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <Container>
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-white rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-white font-bold text-sm">Ez</span>
              </div>
              <span className="text-xl font-bold text-foreground">EzEdit.co</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </a>
              <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign up</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-muted-foreground hover:text-foreground"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100">
                <a 
                  href="#features" 
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#pricing" 
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#docs" 
                  className="block px-3 py-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Docs
                </a>
                <div className="pt-4 pb-3 border-t border-gray-100 space-y-2">
                  <Link 
                    to="/login" 
                    className="block w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link 
                    to="/signup" 
                    className="block w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full">Sign up</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Container>
      </nav>

      {/* Hero Section */}
      <section className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0A0E18] leading-tight animate-fade-in">
            Edit Legacy Websites with{' '}
            <span className="text-primary">AI-Powered</span>{' '}
            Simplicity
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-[#3B4656] max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Connect to any website via FTP/SFTP and update your code using natural language prompts. 
            Secure, fast, and incredibly simple.
          </p>

          <div className="mt-14 animate-fade-in">
            <p className="text-[#0A0E18] font-medium mb-6">
              Get early access to EzEdit
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit">
                Join Waitlist
              </Button>
            </form>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started for Free
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setIsVideoModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Play size={16} className="mr-2" />
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Simple Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 max-w-3xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">EzEdit Demo</h3>
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/J5v9FjrBMmM"
                title="EzEdit Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
