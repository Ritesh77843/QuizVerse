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
    <div className="min-h-screen animated-gradient flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative w-full max-w-md">
        <div className="glass rounded-3xl border border-zinc-800 p-10 md:p-12 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <Link href="/" className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">QuizVerse</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-center">Create your account</h1>
            <p className="text-zinc-400 text-base mt-3">Start hosting quizzes for free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-base font-medium text-zinc-300 mb-2">Display Name</label>
              <input id="displayName" type="text" value={form.displayName}
                onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                required placeholder="Your name" autoComplete="name"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all" />
            </div>

            <div>
              <label className="block text-base font-medium text-zinc-300 mb-2">Email</label>
              <input id="reg-email" type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required placeholder="you@example.com" autoComplete="email"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all" />
            </div>

            <div>
              <label className="block text-base font-medium text-zinc-300 mb-2">Password</label>
              <div className="relative">
                <input id="reg-password" type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required placeholder="Min. 8 characters" autoComplete="new-password"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all pr-14" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
              {/* Password strength hints */}
              {form.password && (
                <div className="mt-3 space-y-2">
                  {passwordRules.map((rule, i) => (
                    <div key={i} className={`flex items-center gap-2 text-sm transition-colors ${rule.test(form.password) ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      <Check className="w-4 h-4" />
                      <span>{rule.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-base font-medium text-zinc-300 mb-2">Confirm Password</label>
              <input id="confirm-password" type="password" value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                required placeholder="Repeat password" autoComplete="new-password"
                className={`w-full bg-zinc-900 border rounded-2xl px-5 py-4 text-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 transition-all ${
                  form.confirm && form.confirm !== form.password ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:border-violet-500 focus:ring-violet-500'
                }`} />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-4 text-red-400 text-base">
                {error}
              </motion.div>
            )}

            <button id="register-btn" type="submit" disabled={registerMutation.isPending}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-all hover:shadow-lg hover:shadow-violet-600/25 flex items-center justify-center gap-3 mt-4">
              {registerMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserPlus className="w-6 h-6" />}
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-sm text-zinc-500 text-center mt-4">
              Note: Player accounts are not required — players join with just a PIN.
            </p>
          </form>

          <p className="mt-8 text-center text-base text-zinc-500">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-bold transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
