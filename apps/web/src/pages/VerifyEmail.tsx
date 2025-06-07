import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ui/theme-toggle';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { supabase } = useAuth();

  // Extract token and type from URL
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('No verification token was provided');
        setIsVerifying(false);
        return;
      }

      try {
        // Handle email verification
        if (type === 'signup' || type === 'email_change') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email',
          });

          if (error) throw error;
          
          setIsSuccess(true);
          toast({
            title: "Email verified",
            description: "Your email has been successfully verified",
            variant: "success",
          });
          
          // Redirect to dashboard after a delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } 
        // Handle invite acceptance
        else if (type === 'invite') {
          setIsSuccess(true);
          // Redirect to set password page
          setTimeout(() => {
            navigate(`/reset-password?token=${token}`);
          }, 1500);
        }
        else {
          throw new Error('Unknown verification type');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
        toast({
          title: "Verification failed",
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, type, navigate, supabase]);

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
          
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight mb-2">Email Verification</h1>
            </div>

            <div className="flex flex-col items-center justify-center py-8">
              {isVerifying && (
                <>
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-slate-600 text-lg">Verifying your email...</p>
                </>
              )}

              {!isVerifying && isSuccess && (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Email Verified!</h2>
                  <p className="text-slate-600 mb-6 text-center">
                    {type === 'invite' 
                      ? 'Your invitation has been accepted. You\'ll be redirected to set your password.' 
                      : 'Your email has been verified. You\'ll be redirected to the dashboard.'}
                  </p>
                  <Button onClick={() => navigate('/dashboard')} className="bg-sky-400 hover:bg-sky-500 text-white">
                    Go to Dashboard
                  </Button>
                </>
              )}

              {!isVerifying && error && (
                <>
                  <XCircle className="h-16 w-16 text-red-500 mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Verification Failed</h2>
                  <p className="text-slate-600 mb-6 text-center">{error}</p>
                  <div className="flex space-x-4">
                    <Button variant="outline" onClick={() => navigate('/login')} className="border-slate-200">
                      Go to Login
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/')} className="border-slate-200">
                      Go to Home
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
