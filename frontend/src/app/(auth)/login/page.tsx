'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Loader2, LogIn } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ApiResponse, AuthResponse } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(
        { id: data.userId, email: data.email, displayName: data.displayName, role: data.role as 'HOST' | 'ADMIN', isActive: true, createdAt: '' },
        data.accessToken,
        data.refreshToken
      );
      router.push('/host/dashboard');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Invalid email or password');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(form);
  };

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="glass rounded-3xl border border-zinc-800 p-10 md:p-12 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">QuizVerse</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-center">Welcome back</h1>
            <p className="text-zinc-400 text-base mt-3">Sign in to your host account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-base font-medium text-zinc-300 mb-2">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                placeholder="you@example.com"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-base font-medium text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="••••••••"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all pr-14"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 text-red-400 text-base">
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button id="login-btn" type="submit" disabled={loginMutation.isPending}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-all hover:shadow-lg hover:shadow-violet-600/25 flex items-center justify-center gap-3 mt-4">
              {loginMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
              {loginMutation.isPending ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <Link href="#" className="text-base text-zinc-500 hover:text-zinc-300 transition-colors block">
              Forgot password?
            </Link>
            <p className="text-base text-zinc-500">
              Don't have an account?{' '}
              <Link href="/register" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        {/* Back to game join */}
        <div className="text-center mt-8">
          <Link href="/join" className="text-base text-zinc-600 hover:text-zinc-400 transition-colors">
            Joining a game instead? →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
