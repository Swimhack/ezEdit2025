import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';

// Define the form validation schema using zod
const loginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => void;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSubmit = (values: LoginFormValues) => {
    onSubmit(values);
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Password</FormLabel>
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
            <div className="flex items-center space-x-2 mb-4">
              <input type="checkbox" id="remember" className="rounded border-slate-300 text-sky-400 focus:ring-sky-200 transition-all" />
              <label htmlFor="remember" className="text-sm text-slate-500">Remember me for 30 days</label>
              <div className="flex-1 text-right">
                <a href="/forgot-password" className="text-sm text-sky-500 hover:text-sky-600 transition-colors">Forgot password?</a>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-sky-400 hover:bg-sky-500 text-white shadow-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 focus:ring-4 focus:ring-sky-100 transition-all" 
              isLoading={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
              Sign in
            </Button>
          </form>
      </Form>
      
      <div className="mt-6 text-center text-sm">
        <span className="text-slate-500">Don't have an account? </span>
        <a href="/signup" className="text-sky-500 hover:text-sky-600 font-medium transition-colors">
          Sign up
        </a>
      </div>
    </div>
  );
}
