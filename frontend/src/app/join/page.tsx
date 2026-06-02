'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, GameSession } from '@/types';

export default function JoinPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const checkPin = useMutation({
    mutationFn: async (gamePin: string) => {
      const res = await api.get<ApiResponse<GameSession>>(`/games/${gamePin}`);
      return res.data.data;
    },
    onSuccess: (session) => {
      if (session.status !== 'WAITING') {
        setError('This game is not accepting new players right now.');
        return;
      }
      router.push(`/play/${pin.toUpperCase()}/nickname`);
    },
    onError: () => setError('Game not found. Check the PIN and try again.'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = pin.trim().toUpperCase();
    if (clean.length < 4) { setError('Please enter a valid game PIN'); return; }
    checkPin.mutate(clean);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
      {/* Background pulse rings */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {[1, 2, 3].map(i => (
          <motion.div key={i}
            className="absolute rounded-full border border-violet-500/10"
            style={{ width: i * 300, height: i * 300 }}
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 text-center w-full max-w-sm">

        {/* Logo */}
        <Link href="/" className="inline-flex flex-col items-center mb-12">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mb-4 shadow-2xl shadow-violet-600/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <span className="text-3xl font-black">QuizVerse</span>
        </Link>

        <h1 className="text-4xl md:text-5xl font-black mb-3">Enter Game PIN</h1>
        <p className="text-lg text-zinc-400 mb-12">Get the PIN from your game host</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Giant PIN input */}
          <div className="relative">
            <input
              id="game-pin"
              type="text"
              value={pin}
              onChange={e => setPin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder="A B C D E F"
              className="w-full bg-zinc-900/80 border-2 border-zinc-700 focus:border-violet-500 rounded-2xl px-6 py-6 text-3xl md:text-4xl font-black text-center text-white tracking-[0.3em] placeholder-zinc-700 focus:outline-none transition-all"
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button id="join-btn" type="submit" disabled={checkPin.isPending || pin.length < 4}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-6 rounded-2xl text-2xl transition-all hover:shadow-xl hover:shadow-violet-600/30 flex items-center justify-center gap-3 pulse-glow">
            {checkPin.isPending ? <Loader2 className="w-8 h-8 animate-spin" /> : <ArrowRight className="w-8 h-8" />}
            {checkPin.isPending ? 'Checking...' : 'Join'}
          </button>
        </form>

        <p className="mt-12 text-base text-zinc-600">
          Want to host?{' '}
          <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">Sign in →</Link>
        </p>
      </motion.div>
    </div>
  );
}
