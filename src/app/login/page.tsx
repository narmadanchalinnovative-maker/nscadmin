'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { ApiService } from '@/lib/api-service';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await ApiService.post('/admin/login', {
        email: email.trim(),
        password,
      });

      if (response.success && response.token) {
        // Save the token for ApiService to use
        localStorage.setItem('admin_token', response.token);
        
        toast.success('Login successful!');
        // Refresh the page or force a hard navigation so the new token is picked up
        window.location.href = '/admin';
      } else {
        toast.error(response.message || 'Access denied.');
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast.error('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_transparent_40%),linear-gradient(135deg,_#020617,_#0f172a_55%,_#111827)] px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div className="border-b border-white/10 px-8 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in with your email and password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-200">
              Email address
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20">
              <Mail className="h-4 w-4 text-slate-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-200">
              Password
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20">
              <Lock className="h-4 w-4 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Login to Admin Panel</span>
            )}
          </button>
        </form>

        <div className="border-t border-white/10 bg-white/5 px-8 py-5 text-sm text-slate-300">
          <p className="leading-6">
            If no admin exists, the first login attempt will create the super admin automatically!
          </p>
        </div>
      </div>
    </div>
  );
}
