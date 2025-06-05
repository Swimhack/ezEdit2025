import { Link } from 'react-router-dom';
// Inline button component until we confirm UI component paths
const Button = ({ children, asChild, size, variant, className, ...props }: any) => (
  <button 
    className={`px-4 py-2 rounded-md font-medium ${variant === 'outline' ? 'border border-blue-500 text-blue-500' : 'bg-blue-500 text-white'} ${
      size === 'lg' ? 'text-lg px-6 py-3' : ''
    } ${className || ''}`}
    {...props}
  >
    {children}
  </button>
);

// Simple check circle icon
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <path d="m9 12 2 2 4-4"></path>
  </svg>
);

// Simple navbar component
const Navbar = () => (
  <nav className="bg-white shadow-sm py-4 px-6">
    <div className="container mx-auto flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">ezEdit</Link>
      <div className="flex gap-4">
        <Link to="/login" className="text-gray-600 hover:text-blue-600">Login</Link>
        <Link to="/signup" className="text-gray-600 hover:text-blue-600">Sign Up</Link>
      </div>
    </div>
  </nav>
);

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for Legacy Website Management
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              EzEdit provides all the tools you need to maintain and update your legacy websites with modern AI technology.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              title="Secure FTP Access" 
              description="Connect securely to your legacy websites via FTP/SFTP with encrypted credentials and easy site management."
            />
            <FeatureCard 
              title="AI-Powered Editor" 
              description="Use our Monaco-based editor with AI assistance to make intelligent code changes and improvements."
            />
            <FeatureCard 
              title="Live Preview" 
              description="See your changes in real-time with our integrated preview panel before publishing to production."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string, description: string }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-4">
        <CheckCircle2 className="text-green-500 mr-2" />
        <h3 className="font-bold text-xl">{title}</h3>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
