import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/ui/form';
import { ThemeToggle } from '../components/ui/theme-toggle';

// Define two form schemas - one for requesting a reset and one for setting a new password
const requestResetSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RequestResetFormValues = z.infer<typeof requestResetSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { resetPassword, updatePassword } = useAuth();

  // Form for requesting a password reset
  const requestForm = useForm<RequestResetFormValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: '',
    },
  });

  // Form for setting a new password (when token is present)
  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const handleRequestReset = async (values: RequestResetFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(values.email);
      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive"
        });
        console.error('Password reset error:', error);
      } else {
        setIsSuccess(true);
        toast({
          title: "Email sent",
          description: "Check your inbox for the password reset link",
          variant: "success"
        });
      }
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (values: ResetPasswordFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await updatePassword(values.password);
      if (error) {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive"
        });
        console.error('Password update error:', error);
      } else {
        toast({
          title: "Password updated",
          description: "Your password has been successfully updated",
          variant: "success"
        });
        // Redirect to login
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error('Unexpected error during password update:', error);
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
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                {token ? 'Set new password' : 'Reset your password'}
              </h1>
              <p className="text-slate-500">
                {token ? 'Enter your new password below' : 'We\'ll send you a link to reset your password'}
              </p>
            </div>

            {token ? (
              // Show reset password form when token is present
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(handlePasswordUpdate)} className="space-y-6">
                  <FormField
                    control={resetForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">New Password</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="••••••••" 
                            type="password" 
                            {...field} 
                            className="rounded-lg border-slate-200 focus:border-sky-400 focus:ring focus:ring-sky-100 transition-all"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Confirm Password</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="••••••••" 
                            type="password" 
                            {...field} 
                            className="rounded-lg border-slate-200 focus:border-sky-400 focus:ring focus:ring-sky-100 transition-all"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-sky-400 hover:bg-sky-500 text-white shadow-sm font-medium py-2.5 rounded-lg focus:ring-4 focus:ring-sky-100 transition-all" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </form>
              </Form>
            ) : (
              // Show request reset form when no token is present
              <div>
                {isSuccess ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Check your email</h3>
                    <p className="text-slate-600 mb-6">We've sent a password reset link to your email</p>
                    <Button 
                      onClick={() => setIsSuccess(false)}
                      variant="outline"
                      className="mx-auto"
                    >
                      Try another email
                    </Button>
                  </div>
                ) : (
                  <Form {...requestForm}>
                    <form onSubmit={requestForm.handleSubmit(handleRequestReset)} className="space-y-6">
                      <FormField
                        control={requestForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-700">Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="name@example.com" 
                                type="email" 
                                {...field} 
                                className="rounded-lg border-slate-200 focus:border-sky-400 focus:ring focus:ring-sky-100 transition-all"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full bg-sky-400 hover:bg-sky-500 text-white shadow-sm font-medium py-2.5 rounded-lg focus:ring-4 focus:ring-sky-100 transition-all" 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                    </form>
                  </Form>
                )}
                
                <div className="mt-6 text-center text-sm">
                  <span className="text-slate-500">Remember your password? </span>
                  <Link to="/login" className="text-sky-500 hover:text-sky-600 font-medium transition-colors">
                    Sign in
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
