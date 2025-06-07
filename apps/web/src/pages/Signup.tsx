import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/toast';

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSignup = async (values: { 
    email: string; 
    password: string; 
    name: string;
  }) => {
    setIsLoading(true);
    try {
      const { error } = await signUp(values.email, values.password, {
        name: values.name,
        signup_date: new Date().toISOString()
      });
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
        console.error('Signup error:', error);
      } else {
        toast({
          title: "Account created",
          description: "Please check your email for verification instructions",
          variant: "success",
          duration: 8000
        });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <header className="py-4 border-b border-gray-100 sticky top-0 z-40 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <Link to="/" className="flex items-center gap-1.5">
              <div className="bg-gradient-to-r from-sky-400 to-sky-500 text-white font-bold rounded-md p-1.5 text-xl shadow-sm">Ez</div>
              <span className="font-semibold text-xl tracking-tight">EzEdit.co</span>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/#features" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Features</Link>
            <Link to="/#pricing" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Pricing</Link>
            <Link to="/#docs" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Docs</Link>
          </nav>
          
          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors">Log in</Link>
            <Link to="/signup">
              <Button className="bg-sky-400 hover:bg-sky-500 text-white font-medium text-sm shadow-sm">Sign up</Button>
            </Link>
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight mb-2">Create an account</h1>
              <p className="text-slate-500">Start your 7-day free trial</p>
            </div>

            <RegisterForm onSubmit={handleSignup} isLoading={isLoading} />
            
            <div className="mt-6 text-center text-sm">
              <span className="text-slate-500">Already have an account? </span>
              <Link to="/login" className="text-sky-500 hover:text-sky-600 font-medium transition-colors">Sign in</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
