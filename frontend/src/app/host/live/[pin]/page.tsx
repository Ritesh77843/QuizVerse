'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Users, Trophy, ChevronRight, Lock, Unlock, Zap, Download, AlertCircle } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGameStore } from '@/stores/gameStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse, GameSession } from '@/types';
import { getAvatarUrl } from '@/lib/utils';
import { ShapeIcon } from '@/components/ShapeIcon';
import Confetti from 'react-confetti';

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

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepTime = Math.max(16, Math.floor(duration / steps));
    let current = displayValue;
    const increment = (value - current) / steps;
    
    if (increment === 0) return;
    
    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= value) || (increment < 0 && current <= value)) {
        current = value;
        clearInterval(timer);
      }
      setDisplayValue(Math.round(current));
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]);

  return <>{displayValue.toLocaleString()}</>;
}

const getPlayerBg = (nickname: string) => {
  const gradients = [
    'from-pink-500 to-rose-500 shadow-pink-500/20',
    'from-purple-500 to-indigo-500 shadow-purple-500/20',
    'from-blue-500 to-cyan-500 shadow-blue-500/20',
    'from-teal-500 to-emerald-500 shadow-teal-500/20',
    'from-amber-500 to-orange-500 shadow-amber-500/20',
    'from-fuchsia-500 to-pink-500 shadow-fuchsia-500/20',
    'from-violet-500 to-purple-500 shadow-violet-500/20',
  ];
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function LiveGameDashboard() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const { send } = useWebSocket(pin, 'host');
  const { session, setSession, gameState, waitingPlayers, currentQuestion, leaderboard, timer, setGameControls, questionEnded, correctOptionId, showScoreboard, setShowScoreboard } = useGameStore();
  const [isLocked, setIsLocked] = useState(false);
  const prevLeaderboard = useRef(leaderboard);
  const { width, height } = useWindowSize();

  useEffect(() => {
    prevLeaderboard.current = leaderboard;
  }, [leaderboard]);

  useQuery({
    queryKey: ['host-game', pin],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GameSession>>(`/games/${pin}`);
      setSession(res.data.data);
      return res.data.data;
    },
    enabled: !session,
  });

  // Sync lock state from socket events
  useEffect(() => {
    if (gameState?.isLocked !== undefined) {
      setIsLocked(gameState.isLocked);
    }
  }, [gameState?.isLocked]);

  const handleStart = () => send('start-game', { pin });
  const handleNext = () => send('next-question', { pin });
  const handlePause = () => send('pause-game', { pin });
  const handleResume = () => send('resume-game', { pin });
  const handleEnd = () => {
    if (confirm('Are you sure you want to end this game early?')) {
      send('end-game', { pin });
    }
  };

  useEffect(() => {
    setGameControls({ handleNext, handlePause, handleResume, handleEnd });
    return () => setGameControls(null);
  }, [send, pin]);

  const exportCSV = () => {
    if (!leaderboard?.entries.length) return;
    const rows = [
      ['Rank', 'Nickname', 'Score'],
      ...leaderboard.entries.map((e, i) => [i + 1, e.nickname, e.score])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quizverse-results-${pin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleLockToggle = () => {
    if (isLocked) {
      send('unlock-game', { pin });
      setIsLocked(false);
    } else {
      send('lock-game', { pin });
      setIsLocked(true);
    }
  };

  useEffect(() => {
    if (gameState?.status === 'ENDED') {
      router.push(`/host/live/${pin}/podium`);
    }
  }, [gameState?.status]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showScoreboard) {
      timer = setTimeout(() => {
        handleNext();
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [showScoreboard]);

  if (!session) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-500 animate-pulse">Loading game...</div>
    </div>
  );

  const status = gameState?.status ?? session.status;
  const isWaiting = status === 'WAITING';
  const isActive = status === 'ACTIVE';
  const isPaused = status === 'PAUSED';
  const playerCount = gameState?.playerCount ?? waitingPlayers.length;

  // ─── WAITING LOBBY (Kahoot-style) ──────────────────────────────────────────
  if (isWaiting) {
    const joinUrl = `quizverse.io/join`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`http://localhost:3000/join`)}&size=120x120&bgcolor=ffffff&color=000000&margin=2`;

    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>

        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'url(/lobby-bg.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />

        {/* Animated particles */}
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

        {/* TOP BAR — Join info + QR */}
        <div className="relative z-10 flex items-stretch justify-center pt-6 px-6">
          <div className="flex items-stretch bg-white rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full">
            {/* Join URL */}
            <div className="flex flex-col items-center justify-center px-8 py-4 border-r border-gray-200 flex-1">
              <p className="text-gray-500 text-sm mb-1">Join at</p>
              <p className="text-gray-900 font-black text-xl">{joinUrl}</p>
              <p className="text-gray-400 text-xs mt-1">or scan the QR code</p>
            </div>

            {/* PIN */}
            <div className="flex flex-col items-center justify-center px-10 py-4 flex-1">
              <p className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">Game PIN:</p>
              <p className="text-5xl font-black text-gray-900 tracking-widest font-mono">
                {pin.slice(0, 3)} {pin.slice(3)}
              </p>
            </div>

            {/* QR Code */}
            <div className="flex items-center justify-center px-6 py-4 border-l border-gray-200">
              <img src={qrUrl} alt="QR Code" className="w-24 h-24 rounded-lg" />
            </div>
          </div>
        </div>

        {/* CENTER — Logo + Waiting message */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
          {/* Logo */}
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="mb-10"
          >
            <h1 className="text-6xl md:text-8xl font-black text-white drop-shadow-2xl">
              Quiz<span className="text-lime-400">Verse</span>
              <span className="text-yellow-400">!</span>
            </h1>
          </motion.div>

          {/* Player nicknames */}
          <AnimatePresence>
            {waitingPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mb-12"
              >
                {waitingPlayers.map((p, i) => (
                  <motion.div
                    key={p.nickname}
                    initial={{ scale: 0, opacity: 0, rotate: -5 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    whileHover={{ scale: 1.08, rotate: 1, zIndex: 10 }}
                    transition={{ delay: i * 0.03, type: 'spring', stiffness: 300, damping: 15 }}
                    className={`bg-gradient-to-br ${getPlayerBg(p.nickname)} border-2 border-white/30 text-white font-black px-4 py-2 rounded-2xl text-lg shadow-lg hover:shadow-2xl transition-all flex items-center gap-3`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden backdrop-blur-sm">
                      <img 
                        src={getAvatarUrl(p.avatarSeed || p.nickname)} 
                        alt="Avatar" 
                        className="w-full h-full p-1"
                      />
                    </div>
                    {p.nickname}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Waiting pill */}
          <motion.div
            className={`px-8 py-3 rounded-xl font-bold text-xl shadow-xl ${
              isLocked
                ? 'bg-red-600 text-white'
                : 'bg-emerald-600/80 backdrop-blur-sm text-white border border-emerald-400/30'
            }`}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {isLocked ? '🔒 Game Locked — No new players can join' : 'Waiting for participants...'}
          </motion.div>
        </div>

        {/* BOTTOM BAR — Controls */}
        <div className="relative z-10 flex items-center justify-between px-8 pb-8">
          {/* Player count */}
          <motion.div
            key={playerCount}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="bg-black/50 backdrop-blur-sm border border-white/20 rounded-2xl px-6 py-3 flex items-center gap-3"
          >
            <Users className="w-6 h-6 text-white" />
            <span className="text-3xl font-black text-white">{playerCount}</span>
            <span className="text-white/60 text-sm">players</span>
          </motion.div>

          {/* Lock + Start buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLockToggle}
              className={`flex items-center gap-2 font-bold px-6 py-4 rounded-2xl text-lg transition-all border-2 ${
                isLocked
                  ? 'bg-red-500/20 border-red-400/50 text-red-300 hover:bg-red-500/30'
                  : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
              }`}
            >
              {isLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              {isLocked ? 'Unlock' : 'Lock'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStart}
              className="flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-black px-10 py-4 rounded-2xl text-xl transition-all shadow-xl"
            >
              <Play className="w-6 h-6 fill-gray-900" />
              Start
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE / PAUSED GAME CONTROLS ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" 
         style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
      {/* Decorative Background Elements */}
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

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-md relative z-10 shadow-lg">
        <div>
          <h1 className="font-bold text-xl md:text-2xl text-white drop-shadow-md">{session.quizTitle}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`flex items-center gap-2 text-sm font-bold px-3 py-1 rounded-full border shadow-sm
              ${isActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                isPaused ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                'bg-white/10 text-zinc-300 border-white/20'}`}>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
              {status}
            </span>
            <span className="text-sm text-zinc-300 flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-zinc-400" /> {playerCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center bg-black/30 px-6 py-2 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner">
            <p className="text-xs text-violet-300 uppercase tracking-[0.2em] font-bold mb-1">Game PIN</p>
            <p className="text-4xl md:text-5xl font-black font-mono tracking-widest text-white drop-shadow-lg">{pin}</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
        </div>
      </div>

      {showScoreboard ? (
        <div className="flex-1 flex flex-col items-center overflow-hidden relative">
          <Confetti width={width} height={height} recycle={false} numberOfPieces={400} gravity={0.15} />
          {/* Top Bar Layer */}
          <div className="w-full flex items-center justify-between p-6 relative z-10">
            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm border border-white/10 px-4 py-2 rounded-2xl text-white font-bold shadow-lg">
              <Users className="w-6 h-6" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-xl">{playerCount}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">Players</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center mt-4 absolute left-1/2 -translate-x-1/2">
              <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg mb-2">Scoreboard</h1>
              <div className="flex items-center gap-2 text-lime-400 font-semibold text-lg">
                <span className="w-4 h-4 bg-lime-400/20 rounded-full flex items-center justify-center border border-lime-400/50">🌿</span>
                Top players this round!
                <span className="w-4 h-4 bg-lime-400/20 rounded-full flex items-center justify-center border border-lime-400/50">🌿</span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm border border-white/10 px-5 py-3 rounded-full text-white font-semibold shadow-lg">
              Question {currentQuestion ? `${currentQuestion.index + 1} / ${currentQuestion.total}` : ''}
              <div className="w-6 h-6 border-[3px] border-lime-400 rounded-full border-t-transparent animate-spin ml-2" />
            </div>
          </div>

          {/* Leaderboard List */}
          <div className="w-full max-w-4xl flex flex-col items-center flex-1 overflow-hidden relative z-10 px-6 mt-16">
            <style dangerouslySetInnerHTML={{__html: `
              .hide-scrollbar::-webkit-scrollbar { display: none; }
              .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
            <div className="w-full flex-1 overflow-y-auto flex flex-col gap-3 pb-32 px-2 pt-8 hide-scrollbar">
              <AnimatePresence>
                {leaderboard?.entries.map((entry, i) => {
                  const isTop = i === 0;
                  const prevIndex = prevLeaderboard.current?.entries.findIndex(e => e.nickname === entry.nickname);
                  const rankChange = prevIndex !== undefined && prevIndex !== -1 ? prevIndex - i : 0;
                  const movedUp = rankChange > 0 && !isTop;
                  
                  let excitementMessage = null;
                  if (isTop && rankChange > 0) {
                    excitementMessage = "🏆 New Leader!";
                  } else if (rankChange >= 3) {
                    excitementMessage = `🚀 Jumped ${rankChange} Places!`;
                  } else if (rankChange === 2) {
                    excitementMessage = "🔥 Heating Up!";
                  }

                  return (
                    <motion.div key={entry.nickname}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.1 }}
                      className={`relative flex items-center gap-6 p-3 rounded-2xl shadow-lg border-b-4 transition-colors duration-1000 ${
                        isTop ? 'bg-gradient-to-r from-lime-500 to-green-600 border-green-700 shadow-[0_0_20px_rgba(132,204,22,0.4)] z-10 ring-2 ring-lime-300' 
                        : movedUp ? 'bg-emerald-800 border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400 z-[5]' 
                        : 'bg-emerald-900/80 backdrop-blur-sm border-emerald-950/50'
                      }`}
                    >
                      {excitementMessage && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.5 }}
                          animate={{ opacity: [0, 1, 1, 0], y: [10, -30, -30, -40], scale: [0.5, 1.1, 1, 0.8] }}
                          transition={{ delay: 1.0 + i * 0.1, duration: 2.5, times: [0, 0.2, 0.8, 1] }}
                          className="absolute right-1/4 top-0 bg-white text-emerald-900 font-black px-4 py-1 rounded-full shadow-2xl border-2 border-emerald-200 z-30 pointer-events-none"
                        >
                          {excitementMessage}
                        </motion.div>
                      )}

                      {isTop && (
                        <div className="absolute -top-6 -left-4 text-5xl rotate-[-20deg] drop-shadow-lg z-20">👑</div>
                      )}
                      
                      <div className="flex items-center justify-center w-12 h-12 rounded-full shrink-0 relative">
                        {i === 0 ? <span className="text-4xl drop-shadow-md relative z-10">🥇</span> : 
                         i === 1 ? <span className="text-4xl drop-shadow-md relative z-10">🥈</span> : 
                         i === 2 ? <span className="text-4xl drop-shadow-md relative z-10">🥉</span> : 
                         <div className="w-10 h-10 rounded-full border-2 border-emerald-700 flex items-center justify-center text-white font-bold text-xl bg-emerald-900/50 relative z-10">{i + 1}</div>}
                      </div>

                      <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white/20 bg-black/20 shadow-inner">
                        <img src={getAvatarUrl(entry.avatarSeed || entry.nickname)} alt={entry.nickname} className="w-full h-full p-1" />
                      </div>
                      
                      <p className="font-black text-2xl flex-1 text-white drop-shadow-md truncate">{entry.nickname}</p>
                      
                      <div className="flex items-center gap-5 pr-4">
                        <span className="font-black text-3xl text-white drop-shadow-md">
                          <AnimatedCounter value={entry.score} />
                        </span>
                        <div className="w-12 flex justify-end">
                          {rankChange > 0 && <span className="font-black text-xl text-lime-400 drop-shadow-md flex items-center gap-1">▲ {rankChange}</span>}
                          {rankChange < 0 && <span className="font-black text-xl text-red-400 drop-shadow-md flex items-center gap-1">▼ {Math.abs(rankChange)}</span>}
                          {rankChange === 0 && <span className="w-8 h-6" />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {(!leaderboard || leaderboard.entries.length === 0) && (
                <p className="text-center text-xl text-emerald-200 py-8 font-bold">Scores will appear here</p>
              )}
            </div>
          </div>

          {/* Bottom Controls Bar */}
          <div className="absolute bottom-6 left-0 right-0 flex items-end justify-between px-8 z-20 pointer-events-none">
            {/* Left Tools */}
            <div className="flex items-center gap-3 pointer-events-auto">
              <button className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              </button>
              <button className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>
              <button onClick={toggleFullScreen} className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
              </button>
            </div>

            {/* Center PIN */}
            <div className="flex flex-col items-center bg-black/50 backdrop-blur-md px-8 py-3 rounded-3xl border border-white/10 shadow-2xl pointer-events-auto">
              <div className="flex items-center gap-2 text-emerald-200 mb-1">
                <Lock className="w-4 h-4" />
                <span className="font-semibold text-sm">Join at <span className="text-white">quizverse.live</span></span>
              </div>
              <div className="text-emerald-100/70 text-sm font-semibold">
                Game PIN: <span className="text-white text-2xl font-black tracking-wider ml-1">{pin}</span>
              </div>
            </div>

            {/* Right Next Button */}
            <div className="pointer-events-auto">
              <button onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="bg-gradient-to-b from-lime-400 to-lime-600 hover:from-lime-300 hover:to-lime-500 text-green-950 font-black px-8 py-4 rounded-xl flex items-center gap-3 text-xl shadow-lg border-b-4 border-lime-700 transition-all hover:-translate-y-1 active:translate-y-0 active:border-b-0">
                Next <ChevronRight className="w-6 h-6" strokeWidth={4} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 flex gap-6 overflow-hidden relative z-10">
          {/* Left Col: Current Question */}
          <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
            {!currentQuestion ? (
              <p className="text-zinc-300 font-medium text-2xl animate-pulse">Click Next Question to continue</p>
            ) : (
              <div className="w-full max-w-3xl flex-1 flex flex-col justify-center z-10">
                <div className="flex items-center justify-between w-full mb-8">
                  <span className="text-sm font-bold text-violet-200 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-inner">
                    Question {currentQuestion.index + 1} of {currentQuestion.total}
                  </span>
                  <div className="flex items-center gap-3 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-inner">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-3xl md:text-4xl font-black text-amber-400 font-mono">{timer?.remaining ?? currentQuestion.timeLimitSeconds}</span>
                    <span className="text-zinc-400 text-lg">sec</span>
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-12 leading-tight text-white drop-shadow-lg">{currentQuestion.questionText}</h2>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {currentQuestion.options.map((opt, i) => {
                    const isCorrect = correctOptionId === opt.id;
                    const styleClass = questionEnded && !isCorrect ? 'opacity-30 scale-[0.98]' : '';
                    const ringClass = questionEnded && isCorrect ? 'ring-4 ring-white scale-[1.03] z-10' : '';
                    return (
                      <div key={opt.id} className={`p-6 rounded-2xl flex items-center gap-4 text-left shadow-xl transition-all duration-300
                          ${['bg-[#E74C3C]', 'bg-[#3498DB]', 'bg-[#F39C12]', 'bg-[#27AE60]'][i]}
                          ${['border-b-[6px] border-[#C0392B]', 'border-b-[6px] border-[#2980B9]', 'border-b-[6px] border-[#D68910]', 'border-b-[6px] border-[#1E8449]'][i]}
                          ${styleClass} ${ringClass}`}>
                        <div className="w-12 h-12 flex items-center justify-center text-white opacity-90 shrink-0 bg-black/20 rounded-xl shadow-inner">
                          <ShapeIcon shape={['triangle', 'diamond', 'circle', 'square'][i]} className="w-8 h-8" />
                        </div>
                        <span className="font-bold text-2xl text-white drop-shadow-md">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Center Game Controls */}
            {(isActive || isPaused) && (
              <div className="mt-6 flex items-center justify-center gap-4 z-10 relative">
                {isActive && !questionEnded && (
                  <>
                    <button onClick={() => send('end-question-timer', { pin })}
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold px-6 py-3 rounded-xl flex items-center gap-2 text-sm transition-all border border-blue-400/30 backdrop-blur-sm shadow-lg hover:shadow-blue-500/20">
                      <Zap className="w-4 h-4" /> Skip Time
                    </button>
                    <button onClick={handlePause}
                      className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-6 py-3 rounded-xl flex items-center gap-2 text-sm transition-all border border-amber-400/30 backdrop-blur-sm shadow-lg hover:shadow-amber-500/20">
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  </>
                )}
                {isActive && questionEnded && (
                  <button onClick={() => setShowScoreboard(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black px-10 py-4 rounded-2xl flex items-center gap-2 text-lg transition-all shadow-xl shadow-emerald-500/30 border border-emerald-400/50 hover:scale-105 active:scale-95">
                    Scoreboard <ChevronRight className="w-6 h-6" strokeWidth={3} />
                  </button>
                )}
                {isPaused && (
                  <button onClick={handleResume}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold px-8 py-3 rounded-xl flex items-center gap-2 text-lg transition-all border border-emerald-400/30 backdrop-blur-sm shadow-lg">
                    <Play className="w-5 h-5 fill-emerald-300" /> Resume
                  </button>
                )}
                <button onClick={handleEnd}
                  className="bg-white/5 hover:bg-red-500/20 text-zinc-300 hover:text-red-300 font-semibold px-6 py-3 rounded-xl flex items-center gap-2 text-sm transition-all border border-white/10 hover:border-red-400/30 backdrop-blur-sm shadow-lg">
                  <Square className="w-4 h-4" /> End Game
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Leaderboard */}
        <div className="w-80 flex flex-col gap-6">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center gap-3 bg-black/20">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <h3 className="font-black text-white text-lg tracking-wide">Leaderboard</h3>
              <span className="ml-auto text-xs font-semibold text-violet-200 bg-white/10 px-2 py-1 rounded-md">{playerCount} players</span>
              {leaderboard?.entries.length ? (
                <button onClick={exportCSV} title="Export CSV"
                  className="ml-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors shadow-sm">
                  <Download className="w-4 h-4" />
                </button>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence>
                {leaderboard?.entries.map((entry, i) => (
                  <motion.div key={entry.nickname}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-default">
                    <span className="w-8 text-center font-black text-zinc-400 text-lg">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/20 overflow-hidden shrink-0 border border-white/20 shadow-inner">
                      <img
                        src={getAvatarUrl(entry.avatarSeed || entry.nickname)}
                        alt={entry.nickname}
                        className="w-full h-full p-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{entry.nickname}</p>
                    </div>
                    <div className="bg-black/30 px-3 py-1 rounded-lg border border-white/5">
                      <span className="font-black text-sm text-violet-300 drop-shadow-sm">{entry.score.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {(!leaderboard || leaderboard.entries.length === 0) && (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <Trophy className="w-12 h-12 text-zinc-400 mb-3" />
                  <p className="text-center text-sm font-medium text-zinc-300">Scores will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
