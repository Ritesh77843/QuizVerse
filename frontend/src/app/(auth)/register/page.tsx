'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles, Loader2, UserPlus, Check } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ApiResponse, AuthResponse } from '@/types';

const passwordRules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Contains a number', test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const registerMutation = useMutation({
    mutationFn: async (data: { displayName: string; email: string; password: string }) => {
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
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
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError("Passwords don't match"); return; }
    registerMutation.mutate({ displayName: form.displayName, email: form.email, password: form.password });
  };

  return (
    <div className="min-h-screen bg-[#5A2A12] flex items-center justify-center px-4 py-12 font-sans selection:bg-yellow-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-xl rounded-[2rem] border border-white/10 p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col items-center mb-10">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-full bg-[#D9381E] flex items-center justify-center shadow-lg border border-white/10">
                <span className="font-bold text-xl tracking-tighter text-white italic transform -rotate-6">QV</span>
              </div>
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-center font-serif text-white tracking-tight">Create account</h1>
            <p className="text-white/60 text-base mt-3">Start hosting premium quizzes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wide">Display Name</label>
              <input id="displayName" type="text" value={form.displayName}
                onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                required placeholder="Your name" autoComplete="name"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all shadow-inner" />
            </div>

            <div>
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wide">Email</label>
              <input id="reg-email" type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required placeholder="you@example.com" autoComplete="email"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all shadow-inner" />
            </div>

            <div>
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required placeholder="Min. 8 characters" autoComplete="new-password"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all pr-14 shadow-inner" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              {/* Password strength hints */}
              {form.password && (
                <div className="mt-3 space-y-2">
                  {passwordRules.map((rule, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm transition-colors ${rule.test(form.password) ? 'text-yellow-400' : 'text-white/40'}`}>
                      <Check className="w-4 h-4" />
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-white/80 mb-2 uppercase tracking-wide">Confirm Password</label>
              <input id="confirm-password" type="password" value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                required placeholder="Repeat password" autoComplete="new-password"
                className={`w-full bg-black/50 border rounded-2xl px-5 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:ring-1 shadow-inner transition-all ${
                  form.confirm && form.confirm !== form.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-yellow-500 focus:ring-yellow-500'
                }`} />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/30 rounded-2xl px-5 py-4 text-red-200 text-sm font-bold">
                {error}
              </motion.div>
            )}

            <button id="register-btn" type="submit" disabled={registerMutation.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-4 rounded-2xl text-lg tracking-wide uppercase transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] flex items-center justify-center gap-3 mt-6">
              {registerMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin text-black" /> : <UserPlus className="w-6 h-6 text-black" />}
              {registerMutation.isPending ? 'Creating...' : 'Create Account'}
            </button>

            <p className="text-sm font-medium text-white/50 text-center mt-4">
              Note: Players don't need accounts.
            </p>
          </form>

          <p className="mt-8 text-center text-base text-white/60">
            Already have an account?{' '}
            <Link href="/login" className="text-yellow-400 hover:text-yellow-300 font-bold transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
