'use client';
import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, ArrowRight, Crown } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { usePlayerStore } from '@/stores/playerStore';
import { formatScore } from '@/lib/utils';

const rankColors = ['text-yellow-400', 'text-zinc-300', 'text-amber-600'];
const rankIcons = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const { leaderboard, gameState } = useGameStore();
  const { player } = usePlayerStore();
  const { socket } = useWebSocket(pin, 'player');

  // Go to next question when host sends it
  useEffect(() => {
    const sock = socket?.current;
    if (!sock) return;
    const handleNewQuestion = () => router.push(`/play/${pin}/question`);
    sock.on('new-question', handleNewQuestion);
    return () => { sock.off('new-question', handleNewQuestion); };
  }, [pin, router, socket]);

  useEffect(() => {
    if (gameState?.status === 'ENDED') {
      const t = setTimeout(() => router.push(`/play/${pin}/final`), 3000);
      return () => clearTimeout(t);
    }
  }, [gameState?.status]);

  const entries = leaderboard?.entries ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1e] via-[#12082c] to-[#09090b] flex flex-col items-center justify-center px-4 py-8">
      {/* Floating trophies */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {['🏆', '⭐', '🌟', '✨'].map((emoji, i) => (
          <motion.div key={i}
            className="absolute text-2xl opacity-20"
            style={{ left: `${20 + i * 22}%`, top: '10%' }}
            animate={{ y: [0, -20, 0], rotate: [-10, 10, -10] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl mb-3">🏆</motion.div>
          <h1 className="text-3xl font-black">Leaderboard</h1>
          <p className="text-zinc-400 text-sm mt-1">After Question {(gameState?.currentQuestionIndex ?? 0) + 1}</p>
        </div>

        {/* Entries */}
        <div className="space-y-3">
          <AnimatePresence>
            {entries.map((entry, i) => {
              const isMe = entry.nickname === player?.nickname;
              return (
                <motion.div key={entry.nickname}
                  initial={{ x: -60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 border
                    ${isMe ? 'bg-violet-900/30 border-violet-500/50' : 'bg-zinc-900/80 border-zinc-800'}`}
                >
                  {/* Rank */}
                  <div className={`text-2xl font-black w-8 text-center ${rankColors[i] ?? 'text-zinc-400'}`}>
                    {i < 3 ? rankIcons[i] : `#${entry.rank}`}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center font-bold shrink-0">
                    {entry.nickname[0]?.toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">
                      {entry.nickname}
                      {isMe && <span className="ml-2 text-xs text-violet-400 font-normal">(you)</span>}
                    </p>
                    {entry.pointsLastRound !== undefined && entry.pointsLastRound > 0 && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />+{formatScore(entry.pointsLastRound ?? 0)}
                      </p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="font-black text-lg">{formatScore(entry.score)}</p>
                    <p className="text-xs text-zinc-500">pts</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {entries.length === 0 && (
            <div className="text-center text-zinc-500 py-8">No scores yet...</div>
          )}
        </div>

        {gameState?.status !== 'ENDED' && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="text-center text-zinc-500 text-sm mt-8 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Next question coming up...
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
