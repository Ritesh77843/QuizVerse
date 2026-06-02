'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { AlertTriangle, Lock } from 'lucide-react';
import { getAvatarUrl } from '@/lib/utils';

// Fun waiting messages that cycle
const WAITING_MESSAGES = [
  "Get ready to play! 🎯",
  "Warm up those brain cells! 🧠",
  "The quiz is about to begin! ⚡",
  "Sharp answers = more points! 🏆",
  "Stay focused, champ! 💪",
];

function MiniBubbleGame() {
  const [score, setScore] = useState(0);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);

  useEffect(() => {
    const colors = ['bg-violet-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-pink-500', 'bg-yellow-500'];
    const interval = setInterval(() => {
      setBubbles(curr => {
        if (curr.length > 8) return curr;
        const newBubble = {
          id: Date.now() + Math.random(),
          x: Math.random() * 80 + 10, // 10% to 90% width
          y: 100, // start at bottom
          color: colors[Math.floor(Math.random() * colors.length)]
        };
        return [...curr, newBubble];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const popBubble = (id: number) => {
    setBubbles(curr => curr.filter(b => b.id !== id));
    setScore(s => s + 1);
  };

  return (
    <div className="w-full relative h-40 mb-8 border border-white/10 bg-black/20 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center">
      <div className="absolute top-2 right-3 z-10 text-white/50 text-xs font-bold font-mono">
        SCORE: {score}
      </div>
      <p className="text-white/30 text-xs font-bold uppercase tracking-wider absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        Tap Bubbles to Pop!
      </p>
      
      <AnimatePresence>
        {bubbles.map(bubble => (
          <motion.div
            key={bubble.id}
            initial={{ y: 150, opacity: 0, scale: 0 }}
            animate={{ y: -50, opacity: 1, scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 4, ease: "linear" }}
            onAnimationComplete={() => popBubble(bubble.id)} // remove when it reaches top
            onClick={() => popBubble(bubble.id)}
            className={`absolute w-10 h-10 rounded-full cursor-pointer shadow-lg backdrop-blur-sm bg-opacity-80 flex items-center justify-center ${bubble.color}`}
            style={{ left: `${bubble.x}%` }}
          >
            <div className="w-3 h-3 bg-white/40 rounded-full absolute top-2 left-2 blur-[1px]" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function WaitingRoomPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const { player, clearPlayer } = usePlayerStore();
  const { gameState } = useGameStore();
  const { socket } = useWebSocket(pin, 'player');
  const [kicked, setKicked] = useState(false);
  const [kickMessage, setKickMessage] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Cycle fun messages
  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % WAITING_MESSAGES.length), 3000);
    return () => clearInterval(t);
  }, []);

  // Handle duplicate device kick
  useEffect(() => {
    const sock = socket?.current;
    if (!sock) return;
    const handleForceDisconnect = (data: { reason: string; message: string }) => {
      setKicked(true);
      setKickMessage(data.message || 'You have been disconnected because another device joined with your nickname.');
      clearPlayer();
      setTimeout(() => router.replace('/join'), 3500);
    };
    sock.on('force-disconnect', handleForceDisconnect);
    return () => { sock.off('force-disconnect', handleForceDisconnect); };
  }, [socket, router, clearPlayer]);

  // Track lock state
  useEffect(() => {
    if (gameState?.isLocked !== undefined) setIsLocked(!!gameState.isLocked);
  }, [gameState?.isLocked]);

  // Redirect when game starts
  useEffect(() => {
    if (!kicked && gameState?.status === 'ACTIVE') {
      router.push(`/play/${pin}/question`);
    }
  }, [gameState?.status, kicked]);

  // ── KICKED SCREEN ──────────────────────────────────────────────────
  if (kicked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }} className="text-center max-w-sm w-full">
          <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 0.4, repeat: 3 }}
            className="w-20 h-20 bg-red-500/20 border-2 border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </motion.div>
          <h1 className="text-2xl font-black text-red-300 mb-3">Session Replaced</h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{kickMessage}</p>
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            Redirecting to join page...
          </div>
        </motion.div>
      </div>
    );
  }

  const avatarColor = player
    ? `hsl(${(player.nickname.charCodeAt(0) * 47) % 360}, 70%, 55%)`
    : '#7c3aed';

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>

      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: 200 + i * 60,
              height: 200 + i * 60,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              background: i % 2 === 0 ? '#7c3aed' : '#06b6d4',
              filter: 'blur(60px)',
            }}
            animate={{ scale: [1, 1.2, 1], x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center w-full px-6 max-w-sm">
        {/* Game PIN display */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-4 mb-8 text-center">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1 font-semibold">Game PIN</p>
          <p className="text-4xl font-black font-mono text-white tracking-widest">
            {String(pin).slice(0, 3)} {String(pin).slice(3)}
          </p>
        </div>

        {/* Avatar */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-2xl mb-4 border-4 border-white/20 bg-white/10 overflow-hidden backdrop-blur-md"
        >
          {player?.nickname ? (
            <img 
              src={getAvatarUrl(player.avatarSeed || player.nickname)} 
              alt="Avatar" 
              className="w-full h-full object-cover p-2"
            />
          ) : (
            <span className="text-4xl font-black text-white">?</span>
          )}
        </motion.div>

        {/* Nickname */}
        <h1 className="text-2xl font-black text-white mb-1">{player?.nickname}</h1>
        <p className="text-white/50 text-sm mb-6">You're in! 🎉</p>

        {/* Mini Game */}
        <MiniBubbleGame />

        {/* Cycling fun message */}
        <AnimatePresence mode="wait">
          <motion.div key={msgIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-center mb-8"
          >
            <p className="text-white/70 text-base font-semibold">{WAITING_MESSAGES[msgIdx]}</p>
          </motion.div>
        </AnimatePresence>

        {/* Lock notice */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold px-5 py-3 rounded-xl mb-6"
          >
            <Lock className="w-4 h-4" />
            Game is locked — no new players allowed
          </motion.div>
        )}

        {/* Waiting dots */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-white/40 text-sm">Waiting for host to start</p>
          <div className="flex items-center gap-2">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div key={i}
                className="w-2.5 h-2.5 rounded-full bg-violet-400"
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
