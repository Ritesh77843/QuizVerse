'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, SessionSummary } from '@/types';
import { Trophy, ChevronRight } from 'lucide-react';
import Confetti from 'react-confetti';
import { getAvatarUrl } from '@/lib/utils';

function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const updateSize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
}

export default function PodiumPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['analytics', pin],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SessionSummary>>(`/analytics/${pin}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (summary?.leaderboard?.length) {
      setTimeout(() => setShowConfetti(true), 2500); // Wait for animations to hit 1st place
    }
  }, [summary]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-emerald-500 animate-pulse font-bold">Calculating Winners...</div>
      </div>
    );
  }

  const leaderboard = summary?.leaderboard || [];
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  // Helper component for podium block
  const PodiumSpot = ({ player, position, heightCls, colorCls, delay, label }: any) => {
    if (!player) return <div className={`w-32 md:w-48 ${heightCls} opacity-0`} />;
    
    return (
      <motion.div
        className="flex flex-col items-center justify-end"
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay, type: 'spring', bounce: 0.4 }}
      >
        <motion.div 
          className="relative mb-4 flex flex-col items-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: delay + 0.3, type: 'spring' }}
        >
          {/* Avatar */}
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/10 backdrop-blur-md shadow-2xl border-4 border-white/20 flex items-center justify-center overflow-hidden z-10 mb-2">
            <img 
              src={getAvatarUrl(player.avatarSeed || player.nickname)} 
              alt={player.nickname} 
              className="w-full h-full object-cover p-2"
            />
          </div>
          {/* Nickname & Score */}
          <div className="text-center">
            <h3 className="text-xl md:text-3xl font-black text-white drop-shadow-md truncate max-w-[12rem]">{player.nickname}</h3>
            <p className="text-white/80 font-bold text-sm md:text-lg">{player.score.toLocaleString()} pts</p>
          </div>
        </motion.div>

        {/* Podium Block */}
        <div className={`w-28 md:w-40 rounded-t-xl shadow-2xl flex flex-col items-center justify-start pt-4 relative overflow-hidden ${heightCls} ${colorCls}`}>
          {/* Glassmorphism reflection */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          <span className="text-4xl md:text-6xl font-black text-white/90 drop-shadow-md z-10">
            {position}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
      
      {/* Background Confetti Pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        {[...Array(20)].map((_, i) => (
          <motion.div key={i}
            className={`absolute w-3 h-3 ${['bg-green-400', 'bg-yellow-400', 'bg-emerald-500', 'bg-orange-400'][i % 4]}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              rotate: Math.random() * 360,
              opacity: Math.random() * 0.8 + 0.2
            }}
            animate={{ y: [0, -20, 0], x: [0, Math.random() * 20 - 10, 0] }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }}
          />
        ))}
      </div>

      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />}

      {/* Header */}
      <div className="pt-8 px-8 flex items-center justify-between z-20">
        <h1 className="text-3xl md:text-5xl font-black text-yellow-400 drop-shadow-lg flex items-center gap-4">
          <Trophy className="w-10 h-10 md:w-12 md:h-12 text-yellow-400" />
          Podium
        </h1>
        <button 
          onClick={() => router.push(`/host/analytics/${pin}`)}
          className="bg-yellow-400 hover:bg-yellow-300 text-[#143d27] font-black px-6 py-3 rounded-xl shadow-xl hover:scale-105 transition-all flex items-center gap-2"
        >
          View Analytics <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Main Podium Area */}
      <div className="flex-1 flex items-end justify-center pb-10 px-4 z-10 gap-2 md:gap-6">
        {/* 2nd Place */}
        <PodiumSpot 
          player={second} 
          position="2" 
          heightCls="h-40 md:h-56" 
          colorCls="bg-blue-500" 
          delay={1.0} 
        />
        
        {/* 1st Place */}
        <PodiumSpot 
          player={first} 
          position="1" 
          heightCls="h-56 md:h-72" 
          colorCls="bg-yellow-500" 
          delay={2.0} 
        />
        
        {/* 3rd Place */}
        <PodiumSpot 
          player={third} 
          position="3" 
          heightCls="h-32 md:h-44" 
          colorCls="bg-emerald-500" 
          delay={0.2} 
        />
      </div>

      {/* Runners Up */}
      {leaderboard.length > 3 && (
        <motion.div 
          className="absolute bottom-8 left-8 right-8 flex flex-col items-center z-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5, duration: 1 }}
        >
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-4 w-full max-w-4xl flex items-center gap-6 overflow-x-auto">
            <span className="font-bold text-white/60 shrink-0">Runners Up:</span>
            {leaderboard.slice(3, 8).map((p, i) => (
              <div key={p.nickname} className="flex items-center gap-2 shrink-0 bg-white/5 px-4 py-2 rounded-xl">
                <span className="text-white/40 font-black">#{i + 4}</span>
                <span className="font-bold text-white">{p.nickname}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
