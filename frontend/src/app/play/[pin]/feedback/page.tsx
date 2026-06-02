'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, Zap, Flame } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatScore } from '@/lib/utils';

export default function FeedbackPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const { player, pointsLastRound, isCorrectLastRound, streak, streakBonus } = usePlayerStore();
  const { gameState, currentQuestion } = useGameStore();
  const { socket } = useWebSocket(pin, 'player');

  useEffect(() => {
    const sock = socket?.current;
    if (!sock) return;
    const handleNewQuestion = () => { router.push(`/play/${pin}/question`); };
    sock.on('new-question', handleNewQuestion);
    return () => { sock.off('new-question', handleNewQuestion); };
  }, [pin, router, socket]);

  useEffect(() => {
    if (gameState?.status === 'ENDED') router.push(`/play/${pin}/final`);
  }, [gameState?.status]);

  const isCorrect = isCorrectLastRound ?? false;
  const correctOption = currentQuestion?.options?.find(o => (o as any).isCorrect);
  const correctOptionText = correctOption?.text ?? null;
  const isOnFire = streak >= 3;

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 transition-colors duration-700
      ${isCorrect ? 'bg-gradient-to-b from-emerald-950 to-[#0a1a0a]' : 'bg-gradient-to-b from-red-950 to-[#1a0a0a]'}`}>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="text-center max-w-sm w-full"
      >
        {/* Streak Fire Badge */}
        <AnimatePresence>
          {isOnFire && isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <motion.div
                animate={{ rotate: [-8, 8, -8], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 px-4 py-2 rounded-full"
              >
                <Flame className="w-5 h-5 text-orange-400 fill-orange-400" />
                <span className="text-orange-300 font-black text-lg">{streak} streak!</span>
                {streakBonus > 0 && (
                  <span className="text-yellow-300 font-bold text-sm bg-yellow-400/20 px-2 py-0.5 rounded-full">
                    +{streakBonus} bonus
                  </span>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-6">
          {isCorrect
            ? <CheckCircle className="w-24 h-24 text-emerald-400 mx-auto" strokeWidth={1.5} />
            : <XCircle className="w-24 h-24 text-red-400 mx-auto" strokeWidth={1.5} />
          }
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className={`text-4xl font-black mb-2 ${isCorrect ? 'text-emerald-300' : 'text-red-300'}`}
        >
          {isCorrect ? 'Correct! 🎉' : 'Wrong!'}
        </motion.h1>

        {isCorrect && pointsLastRound > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-3xl font-black text-yellow-300">+{formatScore(pointsLastRound)}</span>
            <span className="text-zinc-400 text-lg">points</span>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass rounded-2xl border border-zinc-800 p-6 space-y-3 text-left mb-8">
          {player && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Total Score</span>
              <span className="font-black text-xl">{formatScore(player.score)}</span>
            </div>
          )}
          {player?.rank && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Current Rank</span>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="font-black text-xl">#{player.rank}</span>
              </div>
            </div>
          )}
          {streak > 0 && isCorrect && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Answer Streak</span>
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="font-black text-xl text-orange-300">{streak}</span>
              </div>
            </div>
          )}
          {!isCorrect && correctOptionText && (
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-zinc-400 text-xs mb-1">Correct answer</p>
              <p className="text-emerald-400 font-semibold text-sm">{correctOptionText}</p>
            </div>
          )}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="text-zinc-500 text-sm flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          Waiting for next question...
        </motion.p>
      </motion.div>
    </div>
  );
}
