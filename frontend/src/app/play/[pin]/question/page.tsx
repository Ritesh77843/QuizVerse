'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerStore } from '@/stores/playerStore';
import { ANSWER_COLORS } from '@/lib/utils';
import { ShapeIcon } from '@/components/ShapeIcon';

export default function QuestionPage() {
  const { pin } = useParams<{ pin: string }>();
  const router = useRouter();
  const { currentQuestion, timer, hasAnswered, selectedOptionId, setSelectedOption } = useGameStore();
  const { player, clearPlayer } = usePlayerStore();
  const { send, socket } = useWebSocket(pin, 'player');
  const [timeLeft, setTimeLeft] = useState(0);
  const [kicked, setKicked] = useState(false);
  const [kickMessage, setKickMessage] = useState('');

  // Reveal phase state
  const [revealedCorrectId, setRevealedCorrectId] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);

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

  // Listen for question-ended → reveal correct answer to ALL players simultaneously
  useEffect(() => {
    const sock = socket?.current;
    if (!sock) return;
    const handleQuestionEnded = (data: { correctOptionId: string | null }) => {
      setRevealedCorrectId(data.correctOptionId);
      setIsRevealing(true);
      // After 2.5s of seeing the reveal, go to feedback
      setTimeout(() => router.push(`/play/${pin}/feedback`), 2500);
    };
    sock.on('question-ended', handleQuestionEnded);
    return () => { sock.off('question-ended', handleQuestionEnded); };
  }, [socket, pin, router]);

  // Sync timer from server
  useEffect(() => {
    if (timer?.remaining !== undefined) setTimeLeft(timer.remaining);
  }, [timer]);

  // Local countdown fallback (visual only)
  useEffect(() => {
    if (timeLeft <= 0 || hasAnswered || isRevealing) return;
    const t = setTimeout(() => setTimeLeft(p => Math.max(0, p - 1)), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, hasAnswered, isRevealing]);

  const handleAnswer = (optionId: string) => {
    if (hasAnswered || isRevealing || !currentQuestion || !player) return;
    setSelectedOption(optionId);
    send('submit-answer', {
      pin,
      questionId: currentQuestion.questionId,
      optionId,
      playerId: player.id,
      timeToAnswerMs: (currentQuestion.timeLimitSeconds - timeLeft) * 1000,
    });
  };

  // Kicked by duplicate device
  if (kicked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="text-center max-w-sm w-full"
        >
          <motion.div
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 0.4, repeat: 3 }}
            className="w-20 h-20 bg-red-500/20 border-2 border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-6"
          >
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

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
        <div className="text-zinc-400 text-lg animate-pulse">Loading question...</div>
      </div>
    );
  }

  const progress = currentQuestion.timeLimitSeconds > 0 ? (timeLeft / currentQuestion.timeLimitSeconds) * 100 : 0;
  const timerColor = isRevealing ? '#52525b' : timeLeft > 10 ? '#7c3aed' : timeLeft > 5 ? '#F39C12' : '#E74C3C';

  const getOptionStyle = (optId: string) => {
    if (!isRevealing) {
      // Not revealed yet — normal selected/unselected styles
      const isSelected = selectedOptionId === optId;
      return {
        selected: isSelected,
        dimmed: hasAnswered && !isSelected,
        correct: false,
        wrong: false,
      };
    }
    // Reveal phase
    const isCorrect = optId === revealedCorrectId;
    const isSelected = selectedOptionId === optId;
    return {
      selected: false,
      dimmed: !isCorrect && !isSelected,
      correct: isCorrect,
      wrong: isSelected && !isCorrect,
    };
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #052e16 0%, #064e3b 100%)' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="text-base text-zinc-400 font-semibold">
          Question <span className="text-white text-lg">{currentQuestion.index + 1}</span>/{currentQuestion.total}
        </div>
        {/* Timer */}
        <div className="flex items-center gap-2">
          <div className="relative w-14 h-14">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#27272a" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke={timerColor} strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black" style={{ color: timerColor }}>{timeLeft}</span>
            </div>
          </div>
        </div>
        <div className="text-base text-zinc-400">
          <span className="text-yellow-400 font-bold text-lg">{currentQuestion.points}</span> pts
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 bg-zinc-800 mx-4 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: timerColor }} />
      </div>

      {/* Options */}
      <div className="flex-1 flex flex-col px-2 py-4 h-full">

        {/* Answer buttons — layout depends on question type */}
        {currentQuestion.questionType === 'TRUE_FALSE' ? (
          <div className="grid grid-cols-2 gap-6 max-w-7xl mx-auto w-full px-4 h-[40vh] md:h-[50vh] my-auto">
            {currentQuestion.options.slice(0, 2).map((opt, i) => {
              const style = getOptionStyle(opt.id);
              const isTrue = opt.text === 'True';
              return (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileTap={!hasAnswered && !isRevealing ? { scale: 0.95 } : {}}
                  disabled={hasAnswered || isRevealing}
                  onClick={() => handleAnswer(opt.id)}
                  className={`relative rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-white font-black
                    disabled:cursor-not-allowed transition-all duration-500 h-full
                    ${style.correct
                      ? 'bg-emerald-500 ring-4 ring-emerald-300 scale-[1.03]'
                      : style.wrong
                      ? 'bg-red-600 ring-4 ring-red-300'
                      : style.dimmed
                      ? `${isTrue ? 'bg-emerald-700' : 'bg-red-800'} opacity-30`
                      : style.selected
                      ? `${isTrue ? 'bg-emerald-600' : 'bg-red-700'} ring-4 ring-white/60`
                      : `${isTrue ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-700 hover:bg-red-600'}`
                    }`}
                >
                  <span className="text-6xl">
                    {style.correct ? <CheckCircle2 className="w-14 h-14" /> : style.wrong ? <XCircle className="w-14 h-14" /> : (isTrue ? '✓' : '✗')}
                  </span>
                  <span className="text-2xl">{opt.text}</span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-6 w-full max-w-7xl mx-auto px-4 h-[40vh] md:h-[50vh] my-auto">
            {currentQuestion.options.slice(0, 4).map((opt, i) => {
              const color = ANSWER_COLORS[i];
              const style = getOptionStyle(opt.id);

              return (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  whileTap={!hasAnswered && !isRevealing ? { scale: 0.95 } : {}}
                  disabled={hasAnswered || isRevealing}
                  onClick={() => handleAnswer(opt.id)}
                  className={`relative flex items-center justify-center h-full
                    disabled:cursor-not-allowed transition-all duration-300 shadow-md border-b-8 border-black/20 rounded-xl md:rounded-2xl
                    ${style.correct
                      ? 'bg-emerald-500 scale-[1.02]'
                      : style.wrong
                      ? 'bg-red-600'
                      : style.dimmed
                      ? `${color.bg} opacity-30`
                      : style.selected
                      ? `${color.bg} ring-8 ring-white/60 scale-[0.97]`
                      : `${color.bg} ${!hasAnswered && !isRevealing ? color.hover : ''}`
                    }`}
                >
                  {style.correct ? (
                    <CheckCircle2 className="w-24 h-24 md:w-32 md:h-32 text-white drop-shadow-md" />
                  ) : style.wrong ? (
                    <XCircle className="w-24 h-24 md:w-32 md:h-32 text-white drop-shadow-md" />
                  ) : (
                    <ShapeIcon shape={color.shape} className="w-24 h-24 md:w-32 md:h-32 text-white opacity-90 drop-shadow-md" />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}


        {/* Status message */}
        <AnimatePresence>
          {isRevealing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center"
            >
              {selectedOptionId === revealedCorrectId ? (
                <p className="text-emerald-400 font-bold text-lg">✓ Correct! Well done!</p>
              ) : selectedOptionId ? (
                <p className="text-red-400 font-bold text-lg">✗ Wrong answer</p>
              ) : (
                <p className="text-zinc-400 font-bold text-lg">⏱ Time's up!</p>
              )}
            </motion.div>
          )}
          {!isRevealing && hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center text-zinc-400 text-sm flex items-center justify-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              Answer locked in — waiting for time to end...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
