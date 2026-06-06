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
    <div className="min-h-screen bg-[#5A2A12] flex items-center justify-center px-4 font-sans selection:bg-yellow-500/30">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-yellow-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-full bg-[#D9381E] flex items-center justify-center shadow-lg border border-white/10">
                <span className="font-bold text-xl tracking-tighter text-white italic transform -rotate-6">QV</span>
              </div>
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-center font-serif text-white tracking-tight">Welcome back</h1>
            <p className="text-white/60 text-base mt-3">Sign in to your premium account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wide">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                placeholder="you@example.com"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all shadow-inner"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all pr-14 shadow-inner"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/30 rounded-2xl px-5 py-4 text-red-200 text-sm font-bold">
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button id="login-btn" type="submit" disabled={loginMutation.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl text-lg tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] flex items-center justify-center gap-3 mt-6">
              {loginMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : <LogIn className="w-6 h-6 text-black" />}
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <Link href="#" className="text-sm font-medium text-white/50 hover:text-white transition-colors block">
              Forgot password?
            </Link>
            <p className="text-base text-white/60">
              Don't have an account?{' '}
              <Link href="/register" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">
                Sign up free
              </Link>
            </p>
          </div>
        </div>

        {/* Back to game join */}
        <div className="text-center mt-8">
          <Link href="/join" className="text-sm font-bold tracking-wide uppercase text-white/50 hover:text-white transition-colors">
            Joining a game instead? →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
