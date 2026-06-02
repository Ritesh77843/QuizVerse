'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Trophy, RotateCcw, LogOut } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useGameStore } from '@/stores/gameStore';
import { formatScore, getAvatarUrl } from '@/lib/utils';
import Link from 'next/link';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

export default function FinalResultPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const { player, clearPlayer } = usePlayerStore();
  const { leaderboard, clearGame } = useGameStore();

  const myEntry = leaderboard?.entries.find(e => e.nickname === player?.nickname);
  const myRank = myEntry?.rank ?? player?.rank;

  const handleExit = () => {
    clearPlayer();
    clearGame();
    router.push('/join');
  };

  const handlePlayAgain = () => {
    clearPlayer();
    clearGame();
    router.push('/join');
  };

  const isTopThree = myRank !== undefined && myRank <= 3;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
      {/* Confetti for winners */}
      {isTopThree && typeof window !== 'undefined' && (
        <Confetti width={window.innerWidth} height={window.innerHeight}
          numberOfPieces={300} recycle={false} gravity={0.15}
          colors={['#7c3aed', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e']} />
      )}

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="relative z-10 text-center max-w-sm w-full">

        {/* Game over badge */}
        <motion.div
          animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>

        <h1 className="text-4xl font-black mb-1">Game Over!</h1>
        <p className="text-zinc-400 mb-8">Here's how you did</p>

        {/* Result card */}
        <div className="glass rounded-3xl border border-zinc-800 p-8 mb-6 relative overflow-hidden">
          {isTopThree && (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-yellow-900/10 pointer-events-none" />
          )}

          {/* Rank display */}
          {myRank && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
              className="mb-4">
              <div className="text-6xl mb-2">
                {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : <Trophy className="w-16 h-16 text-violet-500 mx-auto" />}
              </div>
              <p className="text-zinc-400 text-sm">Your Final Rank</p>
              <p className="text-5xl font-black text-white">#{myRank}</p>
            </motion.div>
          )}

          <div className="border-t border-zinc-800 pt-4 mt-2">
            <p className="text-zinc-400 text-sm mb-1">Final Score</p>
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="text-4xl font-black text-white"
            >
              {formatScore(player?.score ?? myEntry?.score ?? 0)}
            </motion.p>
          </div>

          {player?.nickname && (
            <div className="mt-6 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border border-white/20">
                <img 
                  src={getAvatarUrl(player.avatarSeed || player.nickname)} 
                  alt="Avatar" 
                  className="w-full h-full p-1"
                />
              </div>
              <span className="text-white font-black text-xl">{player.nickname}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-8">
          <Link href={`/results/${pin}`}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 border border-zinc-700 hover:border-violet-500/50">
            View Full Results
          </Link>
          <button onClick={handleExit}
            className="w-full bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2">
            Exit
          </button>
        </div>
      </motion.div>
    </div>
  );
}
