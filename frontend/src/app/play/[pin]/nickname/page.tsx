'use client';
import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { usePlayerStore } from '@/stores/playerStore';
import { ApiResponse, GameSession, Player } from '@/types';

const AVATAR_STYLES = ['bottts', 'fun-emoji', 'adventurer', 'big-smile', 'avataaars'];
const AVATAR_COUNT = 12;

function generateSeeds(nickname: string): string[] {
  const seeds: string[] = [];
  for (let i = 0; i < AVATAR_COUNT; i++) {
    seeds.push(`${nickname || 'player'}-${i}-${Date.now().toString(36)}`);
  }
  return seeds;
}

export default function NicknamePage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const { setPlayer } = usePlayerStore();
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'nickname' | 'avatar'>('nickname');
  const [selectedSeed, setSelectedSeed] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('bottts');
  const [seeds, setSeeds] = useState<string[]>(generateSeeds(''));

  const { data: session } = useQuery({
    queryKey: ['session', pin],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GameSession>>(`/games/${pin}`);
      return res.data.data;
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (data: { nickname: string; avatarSeed: string }) => {
      const res = await api.post<ApiResponse<Player>>(`/games/${pin}/join`, {
        nickname: data.nickname,
        avatarSeed: `${avatarStyle}:${data.avatarSeed}`,
      });
      return res.data.data;
    },
    onSuccess: (player) => {
      setPlayer(player, pin);
      router.push(`/play/${pin}/waiting`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Could not join. Try a different nickname.');
      setStep('nickname');
    },
  });

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nickname.trim();
    if (clean.length < 2) { setError('Nickname must be at least 2 characters'); return; }
    setError('');
    setSeeds(generateSeeds(clean));
    setSelectedSeed(`${clean}-0-${Date.now().toString(36)}`);
    setStep('avatar');
  };

  const handleJoin = () => {
    if (!selectedSeed) return;
    joinMutation.mutate({ nickname: nickname.trim(), avatarSeed: selectedSeed });
  };

  const shuffleAvatars = () => {
    setSeeds(generateSeeds(nickname.trim()));
  };

  const getAvatarUrl = (seed: string) =>
    `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;

  // ── AVATAR PICKER ──────────────────────────────────────────────────────────
  if (step === 'avatar') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md text-center">

          {/* Selected avatar preview */}
          <motion.div
            key={selectedSeed}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600/30 to-cyan-500/30 border-2 border-white/20 flex items-center justify-center mx-auto mb-4 shadow-2xl overflow-hidden"
          >
            <img src={getAvatarUrl(selectedSeed)} alt="Avatar" className="w-full h-full p-2" />
          </motion.div>

          <h1 className="text-2xl font-black mb-1">{nickname.trim()}</h1>
          <p className="text-zinc-400 text-sm mb-6">Pick your avatar</p>

          {/* Style selector */}
          <div className="flex items-center justify-center gap-2 mb-5 flex-wrap">
            {AVATAR_STYLES.map(s => (
              <button key={s} onClick={() => setAvatarStyle(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                  ${avatarStyle === s ? 'bg-violet-600 border-violet-500 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}`}>
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Avatar grid */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {seeds.map((seed, i) => (
              <motion.button
                key={`${avatarStyle}-${seed}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedSeed(seed)}
                className={`aspect-square rounded-2xl border-2 overflow-hidden transition-all p-1.5
                  ${selectedSeed === seed
                    ? 'border-violet-500 bg-violet-900/30 ring-2 ring-violet-500/50 scale-105'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600'}`}
              >
                <img src={getAvatarUrl(seed)} alt={`Avatar ${i}`} className="w-full h-full" />
              </motion.button>
            ))}
          </div>

          {/* Shuffle */}
          <button onClick={shuffleAvatars}
            className="flex items-center gap-2 text-zinc-500 hover:text-violet-400 text-sm font-medium mx-auto mb-6 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Shuffle avatars
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('nickname')}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl transition-all">
              Back
            </button>
            <button onClick={handleJoin} disabled={joinMutation.isPending || !selectedSeed}
              className="flex-[2] bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-lg transition-all flex items-center justify-center gap-2">
              {joinMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              Join Game
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── NICKNAME INPUT ─────────────────────────────────────────────────────────
  const preview = nickname.trim() || 'You';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm text-center">

        {session && (
          <div className="mb-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl px-6 py-4">
            <p className="text-zinc-400 text-sm">Joining game</p>
            <p className="font-bold text-lg">{session.quizTitle}</p>
            <p className="text-zinc-500 text-sm mt-1">PIN: <span className="font-mono text-violet-400">{pin}</span></p>
          </div>
        )}

        <motion.div
          animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-violet-600/30">
          <span className="text-3xl font-black">{preview[0]?.toUpperCase() || '?'}</span>
        </motion.div>

        <h1 className="text-2xl font-black mb-1">Choose your nickname</h1>
        <p className="text-zinc-400 text-sm mb-8">This is how you'll appear on the leaderboard</p>

        <form onSubmit={handleNicknameSubmit} className="space-y-4">
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value.slice(0, 50))}
            placeholder="Enter nickname..."
            className="w-full bg-zinc-900/80 border-2 border-zinc-700 focus:border-violet-500 rounded-2xl px-6 py-5 text-2xl font-bold text-center text-white placeholder-zinc-700 focus:outline-none transition-all"
            autoFocus autoComplete="off" spellCheck={false}
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button id="continue-btn" type="submit" disabled={nickname.trim().length < 2}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl text-xl transition-all hover:shadow-xl hover:shadow-violet-600/30 flex items-center justify-center gap-3">
            <ArrowRight className="w-6 h-6" />
            Choose Avatar
          </button>
        </form>
      </motion.div>
    </div>
  );
}
