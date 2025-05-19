import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/ui/navbar';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold mb-2">Sign In</h2>
          <p className="text-gray-500 mb-6">Enter your credentials to access your account</p>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium">Password</label>
                <a href="#" className="text-blue-500 text-sm hover:underline">Forgot password?</a>
              </div>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="flex items-center gap-2">
              <input id="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="remember" className="text-sm">Remember me for 30 days</label>
            </div>
            <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg mt-2">Sign in</Button>
          </form>
          <div className="text-center text-sm text-gray-500 mt-6">
            Don't have an account? <a href="/signup" className="text-blue-500 hover:underline">Sign up</a>
          </div>
        </div>
      </div>
    </div>
  );
} 