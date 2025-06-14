import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Send, ArrowRight, Code, Shield, Zap, Menu, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Invite requested for:', email);
    // Here you would typically send this email to your backend
    alert(`Invite will be sent to ${email}`);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Sticky Header/Navbar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm py-4 border-b border-border">
        <Container>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 text-white font-bold rounded-md p-1.5 text-lg">
                Ez
              </div>
              <span className="font-semibold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700">
                EzEdit.co
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                Pricing
              </a>
              <a href="#docs" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                Docs
              </a>
            </nav>
            
            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent/10 transition-colors">
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                </svg>
              </Link>
              <Link to="/login" className="text-muted-foreground hover:text-foreground font-medium text-sm transition-colors">
                Log in
              </Link>
              <Link to="/signup">
                <Button variant="primary" className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-medium text-sm">
                  Sign up
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-muted-foreground hover:text-foreground">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden pt-4 pb-6 border-t border-border mt-4 space-y-4">
              <a 
                href="#features" 
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#pricing" 
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a 
                href="#docs" 
                className="block py-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Docs
              </a>
              <div className="pt-4 border-t border-border space-y-3">
                <Link 
                  to="/login" 
                  className="block w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full justify-center">
                    Log in
                  </Button>
                </Link>
                <Link 
                  to="/signup" 
                  className="block w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="primary" className="w-full bg-gradient-to-r from-primary-500 to-primary-700 justify-center">
                    Sign up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Container>
      </header>

      <main className="space-y-24">
        {/* Hero Section */}
        <section className="pt-16 lg:pt-24 pb-16 relative overflow-hidden">
          {/* Background gradient elements */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl opacity-70 animate-pulse"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl opacity-70 animate-pulse delay-700"></div>
          
          <Container>
            <div className="text-center max-w-4xl mx-auto relative z-10">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 border-primary-500/30 bg-primary-500/5 text-primary-700 font-medium rounded-full animate-fade-in">
                Now in Public Beta
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground max-w-4xl mx-auto animate-fade-in">
                Edit Legacy Websites with{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-700">AI-Powered</span>{' '}
                Simplicity
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed animate-fade-in">
                Connect to any website via FTP/SFTP and update your code using
                natural language prompts. Secure, fast, and incredibly simple.
              </p>
              
              <div className="mt-12 sm:mt-16 animate-fade-in">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Get early access to EzEdit</h2>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row w-full max-w-md mx-auto gap-3">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                    <Button 
                      type="submit"
                      variant="primary" 
                      className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-medium flex items-center gap-2"
                    >
                      <span>Get Invite</span>
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                  <Link to="/signup">
                    <Button 
                      size="lg"
                      variant="primary" 
                      className="bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-medium px-8 py-2 w-full sm:w-auto"
                    >
                      Get Started for Free
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border border-border hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground px-8 py-2 w-full sm:w-auto"
                    onClick={() => setIsVideoModalOpen(true)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>
          </Container>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-16 lg:py-24 bg-muted/30">
          <Container>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 px-3 py-1 border-accent-500/30 bg-accent-500/5 text-accent-600 font-medium rounded-full">
                Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Everything you need to edit legacy websites
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                EzEdit provides a modern interface for managing and updating legacy websites through FTP,
                with AI assistance to make changes quickly and safely.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Code className="h-6 w-6 text-primary-500" />}
                title="AI-Powered Editing"
                description="Use natural language to describe changes and let our AI generate the code for you. Perfect for non-technical users."
              />
              <FeatureCard 
                icon={<Shield className="h-6 w-6 text-primary-500" />}
                title="Secure FTP Connection"
                description="Connect securely to any FTP/SFTP server with encrypted credentials and passive mode support."
              />
              <FeatureCard 
                icon={<Zap className="h-6 w-6 text-primary-500" />}
                title="Instant Preview"
                description="See your changes in real-time with our built-in preview pane. No need to publish until you're ready."
              />
            </div>
            
            <div className="mt-12 text-center">
              <Link to="/signup">
                <Button variant="primary" className="bg-gradient-to-r from-accent-500 to-accent-700 hover:from-accent-600 hover:to-accent-800 text-white">
                  Explore All Features <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Container>
        </section>
      </main>
      
      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsVideoModalOpen(false)}>
          <div className="bg-background rounded-lg p-4 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">EzEdit Demo</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsVideoModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </Button>
            </div>
            <div className="aspect-video bg-muted flex items-center justify-center rounded-md overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
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

// Feature card component
function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border border-border bg-background hover:border-primary/30 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="rounded-full bg-primary/10 p-3 w-fit mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Feature card component removed as it's not needed for the landing page shown in the screenshot
