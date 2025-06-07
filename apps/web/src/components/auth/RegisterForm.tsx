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
const registerFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => void;
  isLoading?: boolean;
}

export function RegisterForm({ onSubmit, isLoading = false }: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = (values: RegisterFormValues) => {
    onSubmit(values);
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Full Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Email</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="example@example.com" 
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
            <FormField
              control={form.control}
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
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="terms" className="rounded border-slate-300 text-sky-400 focus:ring-sky-200 transition-all" />
              <label htmlFor="terms" className="text-sm text-slate-500">
                I agree to the <a href="/terms" className="text-sky-500 hover:text-sky-600 transition-colors">terms of service</a> and <a href="/privacy" className="text-sky-500 hover:text-sky-600 transition-colors">privacy policy</a>
              </label>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-sky-400 hover:bg-sky-500 text-white shadow-sm font-medium py-2.5 rounded-lg focus:ring-4 focus:ring-sky-100 transition-all" 
              isLoading={isLoading}
            >
              Start Free Trial
            </Button>
        </form>
      </Form>
      
      <div className="mt-6 text-center text-sm">
        <span className="text-slate-500">Already have an account? </span>
        <a href="/login" className="text-sky-500 hover:text-sky-600 font-medium transition-colors">
          Sign in
        </a>
      </div>
    </div>
  );
}
