'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw, ArrowLeft, Loader2, Zap, Clock } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse, Quiz } from '@/types';
import { ANSWER_COLORS, formatScore } from '@/lib/utils';

interface PracticeOption { id: string; text: string; isCorrect: boolean; colorCode?: string; }
interface PracticeQuestion {
  id: string;
  questionText: string;
  questionType: string;
  timeLimitSeconds: number;
  points: number;
  options: PracticeOption[];
}

export default function PracticePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [idx, setIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<{ correct: boolean; points: number }[]>([]);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['practice-quiz', id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Quiz>>(`/quizzes/${id}`);
      const qRes = await api.get<ApiResponse<PracticeQuestion[]>>(`/quizzes/${id}/questions`);
      return { quiz: res.data.data, questions: qRes.data.data as PracticeQuestion[] };
    },
  });

  const questions = data?.questions ?? [];
  const current = questions[idx];

  // Start timer when question loads
  useEffect(() => {
    if (!current || revealed) return;
    setTimeLeft(current.timeLimitSeconds);
    setTimerActive(true);
  }, [idx, current]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || revealed) return;
    const t = setTimeout(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          setTimerActive(false);
          setRevealed(true);
          setResults(r => [...r, { correct: false, points: 0 }]);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [timerActive, timeLeft, revealed]);

  const handleAnswer = useCallback((optId: string) => {
    if (revealed || !current) return;
    setTimerActive(false);
    setSelectedId(optId);
    setRevealed(true);

    const opt = current.options.find(o => o.id === optId);
    const isCorrect = opt?.isCorrect ?? false;
    let pts = 0;
    if (isCorrect) {
      const fraction = timeLeft / current.timeLimitSeconds;
      pts = Math.round(current.points * (0.5 + 0.5 * fraction));
      setScore(s => s + pts);
    }
    setResults(r => [...r, { correct: isCorrect, points: pts }]);
  }, [revealed, current, timeLeft]);

  const handleNext = () => {
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setSelectedId(null);
      setRevealed(false);
    }
  };

  const handleRestart = () => {
    setIdx(0);
    setSelectedId(null);
    setRevealed(false);
    setScore(0);
    setResults([]);
    setDone(false);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
    </div>
  );

  if (!data || questions.length === 0) return (
    <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center text-zinc-400">
      Quiz not found or has no questions.
    </div>
  );

  const correctCount = results.filter(r => r.correct).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  // ── DONE SCREEN ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0f0a1e] to-[#09090b] flex flex-col items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md w-full">
          <div className="text-6xl mb-4">{accuracy >= 80 ? '🏆' : accuracy >= 50 ? '🎯' : '📚'}</div>
          <h1 className="text-4xl font-black text-white mb-2">Practice Complete!</h1>
          <p className="text-zinc-400 mb-8">{data.quiz.title}</p>

          <div className="glass rounded-3xl border border-zinc-800 p-8 mb-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-black text-white">{formatScore(score)}</p>
              <p className="text-xs text-zinc-500 mt-1">Score</p>
            </div>
            <div className="text-center border-x border-zinc-800">
              <p className="text-3xl font-black text-emerald-400">{accuracy}%</p>
              <p className="text-xs text-zinc-500 mt-1">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-white">{correctCount}/{questions.length}</p>
              <p className="text-xs text-zinc-500 mt-1">Correct</p>
            </div>
          </div>

          {/* Per-question review */}
          <div className="glass rounded-2xl border border-zinc-800 p-4 mb-6 space-y-2 text-left max-h-64 overflow-y-auto">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-start gap-3 py-1.5">
                {results[i]?.correct
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  : <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{q.questionText}</p>
                  <p className="text-xs text-zinc-500">
                    {results[i]?.correct
                      ? `+${formatScore(results[i].points)} pts`
                      : `Correct: ${q.options.find(o => o.isCorrect)?.text}`
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={handleRestart}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-2xl transition-all">
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <button onClick={() => router.push('/host/quizzes')}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-2xl transition-all">
              My Library
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!current) return null;

  const progress = timeLeft > 0 ? (timeLeft / current.timeLimitSeconds) * 100 : 0;
  const timerColor = timeLeft > 10 ? '#7c3aed' : timeLeft > 5 ? '#F39C12' : '#E74C3C';
  const isTF = current.questionType === 'TRUE_FALSE';

  return (
    <div className="min-h-screen bg-[#0f0a1e] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-xs text-zinc-500 font-medium">{data.quiz.title}</p>
          <p className="text-sm font-bold text-white">Q{idx + 1} / {questions.length}</p>
        </div>
        <div className="flex items-center gap-1.5 text-yellow-400">
          <Zap className="w-4 h-4" />
          <span className="font-black">{formatScore(score)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 mb-1">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-300"
            style={{ width: `${((idx) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-sm text-zinc-500">{results.filter(r => r.correct).length} correct</span>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" style={{ color: timerColor }} />
          <span className="font-black text-lg" style={{ color: timerColor }}>{timeLeft}s</span>
        </div>
      </div>
      <div className="h-1 bg-zinc-800 mx-4 rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: timerColor }} />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.h1 key={current.id}
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="text-3xl md:text-4xl font-black text-white text-center mb-8 leading-snug px-2">
            {current.questionText}
          </motion.h1>
        </AnimatePresence>

        {/* Options */}
        {isTF ? (
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto w-full">
            {current.options.slice(0, 2).map((opt, i) => {
              const isSelected = selectedId === opt.id;
              const isCorrect = opt.isCorrect;
              const isTrue = opt.text === 'True';
              return (
                <motion.button key={opt.id}
                  whileTap={!revealed ? { scale: 0.95 } : {}}
                  disabled={revealed}
                  onClick={() => handleAnswer(opt.id)}
                  className={`rounded-3xl p-8 flex flex-col items-center gap-3 font-black text-white transition-all duration-400
                    ${revealed
                      ? isCorrect ? 'bg-emerald-500 ring-4 ring-emerald-300' : isSelected && !isCorrect ? 'bg-red-600 ring-4 ring-red-300' : `${isTrue ? 'bg-emerald-800' : 'bg-red-900'} opacity-40`
                      : `${isTrue ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-700 hover:bg-red-600'}`
                    }`}>
                  <span className="text-5xl">{revealed && isCorrect ? <CheckCircle2 className="w-12 h-12" /> : revealed && isSelected && !isCorrect ? <XCircle className="w-12 h-12" /> : (isTrue ? '✓' : '✗')}</span>
                  <span className="text-xl">{opt.text}</span>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto w-full">
            {current.options.slice(0, 4).map((opt, i) => {
              const color = ANSWER_COLORS[i];
              const isSelected = selectedId === opt.id;
              const isCorrect = opt.isCorrect;
              return (
                <motion.button key={opt.id}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
                  whileTap={!revealed ? { scale: 0.95 } : {}}
                  disabled={revealed}
                  onClick={() => handleAnswer(opt.id)}
                  className={`rounded-2xl p-4 flex items-center gap-3 text-left min-h-[80px] transition-all duration-400 font-bold text-white
                    ${revealed
                      ? isCorrect ? 'bg-emerald-500 ring-4 ring-emerald-300 scale-[1.02]' : isSelected ? 'bg-red-600 ring-4 ring-red-300' : `${color.bg} opacity-30`
                      : `${color.bg} ${color.hover}`
                    }`}>
                  <span className="w-9 h-9 rounded-xl bg-black/25 flex items-center justify-center font-black text-base shrink-0">
                    {revealed && isCorrect ? <CheckCircle2 className="w-5 h-5" /> : revealed && isSelected && !isCorrect ? <XCircle className="w-5 h-5" /> : color.label}
                  </span>
                  <span className="text-base leading-tight">{opt.text}</span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Reveal feedback */}
        <AnimatePresence>
          {revealed && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-center max-w-md mx-auto w-full">
              {selectedId ? (
                current.options.find(o => o.id === selectedId)?.isCorrect ? (
                  <p className="text-emerald-400 font-black text-xl mb-4">✓ Correct! +{formatScore(results[results.length - 1]?.points ?? 0)} pts</p>
                ) : (
                  <div className="mb-4">
                    <p className="text-red-400 font-black text-xl mb-1">✗ Wrong!</p>
                    <p className="text-zinc-400 text-sm">Correct: <span className="text-emerald-400 font-bold">{current.options.find(o => o.isCorrect)?.text}</span></p>
                  </div>
                )
              ) : (
                <div className="mb-4">
                  <p className="text-zinc-400 font-black text-xl mb-1">⏱ Time's up!</p>
                  <p className="text-zinc-500 text-sm">Correct: <span className="text-emerald-400 font-bold">{current.options.find(o => o.isCorrect)?.text}</span></p>
                </div>
              )}
              <button onClick={handleNext}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3 rounded-2xl transition-all mx-auto shadow-lg shadow-violet-600/25">
                {idx + 1 >= questions.length ? <><Trophy className="w-4 h-4" /> See Results</> : <>Next <ChevronRight className="w-4 h-4" /></>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
