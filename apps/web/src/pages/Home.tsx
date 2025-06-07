import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Container } from '@/components/ui/container';
import { LayoutDashboard, Code, Server, Play } from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Invite requested for:', email);
    // Here you would typically send this email to your backend
    alert(`Invite will be sent to ${email}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-sky-50 to-white font-sans antialiased">
      {/* Sticky Header/Navbar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-sky-500 backdrop-blur-md py-4 shadow-md">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <div className="bg-white text-blue-600 font-bold rounded-md p-1.5 text-xl shadow-lg">Ez</div>
            <span className="font-semibold text-xl tracking-tight text-white">EzEdit.co</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/#features" className="text-white hover:text-blue-100 font-medium text-sm transition-colors hover:scale-105">Features</Link>
            <Link to="/#pricing" className="text-white hover:text-blue-100 font-medium text-sm transition-colors hover:scale-105">Pricing</Link>
            <Link to="/#docs" className="text-white hover:text-blue-100 font-medium text-sm transition-colors hover:scale-105">Docs</Link>
          </nav>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-white hover:text-blue-100 p-2 rounded-full hover:bg-white/10 transition-colors hover:shadow-md">
              <LayoutDashboard className="h-5 w-5" />
            </Link>
            <Link to="/login" className="text-white hover:text-blue-100 font-medium text-sm transition-colors hover:underline">Log in</Link>
            <Link to="/signup">
              <Button className="bg-white hover:bg-blue-50 text-blue-600 font-medium text-sm shadow-md">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-24">
        {/* Hero Section */}
        <section className="pt-24 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-100 to-sky-50 opacity-70 pointer-events-none"></div>
          <div className="absolute -top-48 -right-48 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl opacity-60 pointer-events-none animate-pulse"></div>
          <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-sky-500 rounded-full filter blur-3xl opacity-60 pointer-events-none animate-pulse"></div>
          <div className="absolute top-1/4 left-1/2 w-64 h-64 bg-blue-600 rounded-full filter blur-3xl opacity-30 pointer-events-none animate-pulse"></div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-slate-900 max-w-4xl mx-auto">
                Edit Legacy Websites with <span className="bg-gradient-to-r from-blue-700 to-sky-600 bg-clip-text text-transparent font-black shadow-text">AI-Powered</span> Simplicity
              </h1>
              <p className="text-xl text-gray-500 mt-6 max-w-2xl mx-auto">
                Connect to any website via FTP/SFTP and update your code using
                natural language prompts. Secure, fast, and incredibly simple.
              </p>
              
              <div className="mt-16 flex flex-col items-center gap-8">
                <div>
                  <h3 className="text-lg font-medium text-slate-700 mb-4">Get early access to EzEdit</h3>
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row max-w-md mx-auto gap-3 relative z-10">
                    <div className="relative flex-1 group">
                      <Input 
                        type="email" 
                        placeholder="Enter your email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded-full py-6 px-6 w-full shadow-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 transition-all bg-white/90 backdrop-blur-sm"
                      />
                      <div className="absolute top-1 left-5 text-xs font-medium text-blue-600 opacity-0 group-focus-within:opacity-100 transition-opacity">Email Address</div>
                    </div>
                    <Button type="submit" className="bg-gradient-to-r from-blue-600 to-sky-400 hover:from-blue-700 hover:to-sky-500 text-white font-semibold rounded-full shadow-lg py-6 px-8 min-w-[140px] transition-all ease-in-out duration-200 hover:shadow-xl flex items-center justify-center gap-1.5 animate-gradient">
                      <span>Get Invite</span>
                      <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </Button>
                  </form>
                </div>
                
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-sky-400 hover:from-blue-700 hover:to-sky-500 text-white font-bold shadow-lg rounded-full px-8 py-6 transition-all hover:shadow-xl hover:scale-[1.02] ease-in-out duration-200 border-2 border-white/10">
                    Get Started for Free
                  </Button>
                  <Button size="lg" variant="outline" className="border-2 border-blue-300 hover:border-blue-500 text-blue-600 rounded-full px-8 py-6 transition-all hover:bg-blue-50 hover:text-blue-700 ease-in-out duration-200 shadow-md hover:shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 bg-gradient-to-b from-blue-100 via-sky-50 to-white relative overflow-hidden">
          <div className="absolute -top-24 right-12 w-64 h-64 bg-blue-100 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">Powerful Features for <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent shadow-text">Legacy Website</span> Management</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">EzEdit provides all the tools you need to maintain and update your legacy websites with modern AI technology.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-24 max-w-5xl mx-auto">
              <FeatureCard 
                title="Secure FTP Connection" 
                description="Connect to any legacy website securely with our encrypted FTP/SFTP protocol." 
              />
              <FeatureCard 
                title="AI-Powered Editor" 
                description="Use natural language to instruct AI to make code changes for you." 
              />
              <FeatureCard 
                title="Live Preview" 
                description="See changes in real-time before publishing to your production site." 
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string, description: string }) {
  let icon = <Server className="h-6 w-6" />;
  
  if (title.includes("AI")) {
    icon = <Code className="h-6 w-6" />;
  } else if (title.includes("Preview")) {
    icon = <Play className="h-6 w-6" />;
  }
  return (
    <div className="flex flex-col items-start gap-4 p-6 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all border border-blue-200 hover:border-blue-400">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 text-white flex items-center justify-center shadow-lg animate-gradient">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-xl text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
