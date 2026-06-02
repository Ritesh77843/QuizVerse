'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, Check, ChevronLeft, ChevronRight, ArrowLeft, Loader2, GripVertical, ToggleLeft, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse, Quiz } from '@/types';
import { QUIZ_TEMPLATES, QuizTemplate } from '@/lib/templates';

type QuestionType = 'SINGLE_CHOICE' | 'TRUE_FALSE';
interface LocalOption { id: string; text: string; isCorrect: boolean; }
interface LocalQuestion {
  id: string;
  questionText: string;
  questionType: QuestionType;
  timeLimitSeconds: number;
  points: number;
  options: LocalOption[];
}

const makeQuestion = (type: QuestionType = 'SINGLE_CHOICE'): LocalQuestion => ({
  id: crypto.randomUUID(),
  questionText: '',
  questionType: type,
  timeLimitSeconds: 30,
  points: 1000,
  options: type === 'TRUE_FALSE'
    ? [{ id: crypto.randomUUID(), text: 'True', isCorrect: true }, { id: crypto.randomUUID(), text: 'False', isCorrect: false }]
    : [
      { id: crypto.randomUUID(), text: '', isCorrect: false },
      { id: crypto.randomUUID(), text: '', isCorrect: false },
      { id: crypto.randomUUID(), text: '', isCorrect: false },
      { id: crypto.randomUUID(), text: '', isCorrect: true },
    ],
});

const fromTemplate = (t: QuizTemplate): LocalQuestion[] =>
  t.questions.map(q => ({
    id: crypto.randomUUID(),
    questionText: q.questionText,
    questionType: q.questionType,
    timeLimitSeconds: q.timeLimitSeconds,
    points: q.points,
    options: q.options.map(o => ({ id: crypto.randomUUID(), text: o.text, isCorrect: o.isCorrect })),
  }));

const OPTION_COLORS = ['bg-[#E74C3C]', 'bg-[#3498DB]', 'bg-[#F39C12]', 'bg-[#27AE60]'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function CreateQuizPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [stage, setStage] = useState<'template' | 'editor'>('template');
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<LocalQuestion[]>([makeQuestion()]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const active = questions[activeIdx];

  const pickTemplate = (t: QuizTemplate) => {
    setQuizTitle(t.id === 'blank' ? '' : t.name);
    setQuestions(t.questions.length > 0 ? fromTemplate(t) : [makeQuestion()]);
    setActiveIdx(0);
    setStage('editor');
  };

  const updateActive = (patch: Partial<LocalQuestion>) =>
    setQuestions(qs => qs.map((q, i) => i === activeIdx ? { ...q, ...patch } : q));

  const updateOption = (optId: string, patch: Partial<LocalOption>) => {
    if (!active) return;
    updateActive({ options: active.options.map(o => o.id === optId ? { ...o, ...patch } : o) });
  };

  const setCorrect = (optId: string) => {
    if (!active) return;
    updateActive({ options: active.options.map(o => ({ ...o, isCorrect: o.id === optId })) });
  };

  const changeType = (type: QuestionType) => {
    if (!active) return;
    updateActive({
      questionType: type,
      options: type === 'TRUE_FALSE'
        ? [{ id: crypto.randomUUID(), text: 'True', isCorrect: true }, { id: crypto.randomUUID(), text: 'False', isCorrect: false }]
        : [
          { id: crypto.randomUUID(), text: '', isCorrect: false },
          { id: crypto.randomUUID(), text: '', isCorrect: false },
          { id: crypto.randomUUID(), text: '', isCorrect: false },
          { id: crypto.randomUUID(), text: '', isCorrect: true },
        ],
    });
  };

  const addQuestion = (type: QuestionType = 'SINGLE_CHOICE') => {
    const q = makeQuestion(type);
    setQuestions(qs => [...qs, q]);
    setActiveIdx(questions.length);
  };

  const removeQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(qs => qs.filter((_, i) => i !== idx));
    setActiveIdx(Math.max(0, idx - 1));
  };

  const handleSave = async () => {
    if (!quizTitle.trim()) { alert('Quiz title is required'); return; }
    setSaving(true);
    try {
      const quizRes = await api.post<ApiResponse<Quiz>>('/quizzes', {
        title: quizTitle,
        questions: questions.map((q, i) => ({
          questionText: q.questionText || 'Question',
          questionType: q.questionType,
          timeLimitSeconds: q.timeLimitSeconds,
          points: q.points,
          position: i + 1,
          options: q.options.map((o, oi) => ({ optionText: o.text || `Option ${oi + 1}`, isCorrect: o.isCorrect, position: oi + 1 })),
        })),
      });
      qc.invalidateQueries({ queryKey: ['my-quizzes'] });
      router.push(`/host/quizzes`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  // ── TEMPLATE PICKER ──────────────────────────────────────────────────────────
  if (stage === 'template') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-3xl">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-white mb-3">Choose a Template</h1>
            <p className="text-zinc-400">Pick a starting point or build from scratch</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUIZ_TEMPLATES.map((t, i) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pickTemplate(t)}
                className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-left hover:border-zinc-600 transition-all overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                <span className="text-4xl mb-4 block">{t.emoji}</span>
                <p className="font-bold text-white text-base mb-1">{t.name}</p>
                <p className="text-zinc-500 text-xs leading-relaxed">{t.description}</p>
                {t.questions.length > 0 && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-600 font-medium">
                    <Sparkles className="w-3 h-3" /> {t.questions.length} questions
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // ── EDITOR ───────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setStage('template')} className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
            placeholder="Untitled Quiz"
            className="bg-transparent text-xl font-bold text-white placeholder-zinc-600 focus:outline-none border-b border-transparent focus:border-violet-500 transition-all pb-0.5" />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-500">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl transition-all">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Quiz
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-950">
          <div className="p-4 flex-1 overflow-y-auto">
            <Reorder.Group axis="y" values={questions} onReorder={newOrder => {
              setQuestions(newOrder);
              setActiveIdx(newOrder.findIndex(q => q.id === active?.id));
            }} className="space-y-2">
              {questions.map((q, i) => (
                <Reorder.Item key={q.id} value={q}>
                  <button onClick={() => setActiveIdx(i)}
                    className={`group w-full text-left rounded-xl px-3 py-3 transition-all border
                      ${activeIdx === i ? 'bg-violet-900/20 border-violet-500/40 text-white' : 'border-zinc-800/60 hover:bg-zinc-800/40 text-zinc-400'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-500 mb-0.5 flex items-center gap-1">
                            Q{i + 1}
                            {q.questionType === 'TRUE_FALSE' && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded">T/F</span>}
                          </p>
                          <p className="text-sm font-medium truncate">{q.questionText || 'New question'}</p>
                        </div>
                      </div>
                      {questions.length > 1 && (
                        <button onClick={e => { e.stopPropagation(); removeQuestion(i); }}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
          <div className="p-4 border-t border-zinc-800 space-y-2">
            <button onClick={() => addQuestion('SINGLE_CHOICE')}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-700 hover:border-violet-500 text-zinc-500 hover:text-violet-400 rounded-xl py-2.5 text-sm transition-all">
              <Plus className="w-4 h-4" /> Add Question
            </button>
            <button onClick={() => addQuestion('TRUE_FALSE')}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-700 hover:border-blue-500 text-zinc-500 hover:text-blue-400 rounded-xl py-2 text-xs transition-all">
              <ToggleLeft className="w-4 h-4" /> True / False
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {active && (
              <motion.div key={active.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="max-w-2xl mx-auto">

                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-500">Q{activeIdx + 1} of {questions.length}</span>
                    <div className="flex rounded-lg border border-zinc-700 overflow-hidden ml-3">
                      <button onClick={() => changeType('SINGLE_CHOICE')}
                        className={`px-3 py-1.5 text-xs font-bold transition-all ${active.questionType !== 'TRUE_FALSE' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                        Multiple Choice
                      </button>
                      <button onClick={() => changeType('TRUE_FALSE')}
                        className={`px-3 py-1.5 text-xs font-bold transition-all ${active.questionType === 'TRUE_FALSE' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>
                        True / False
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Timer:</span>
                      <select value={active.timeLimitSeconds} onChange={e => updateActive({ timeLimitSeconds: Number(e.target.value) })}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-violet-500">
                        {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(t => <option key={t} value={t}>{t}s</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Points:</span>
                      <select value={active.points} onChange={e => updateActive({ points: Number(e.target.value) })}
                        className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-violet-500">
                        {[500, 1000, 1500, 2000].map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <textarea value={active.questionText} onChange={e => updateActive({ questionText: e.target.value })}
                  placeholder="Type your question here..." rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 text-lg font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 resize-none transition-all mb-6" />

                {active.questionType === 'TRUE_FALSE' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {active.options.map(opt => (
                      <button key={opt.id} onClick={() => setCorrect(opt.id)}
                        className={`relative rounded-2xl border-2 p-6 flex flex-col items-center gap-3 transition-all
                          ${opt.isCorrect ? 'border-emerald-500/60 bg-emerald-900/20' : 'border-zinc-800 hover:border-zinc-600 bg-zinc-900/50'}`}>
                        <span className={`text-4xl font-black ${opt.text === 'True' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {opt.text === 'True' ? '✓' : '✗'}
                        </span>
                        <span className="text-white font-bold text-lg">{opt.text}</span>
                        {opt.isCorrect && (
                          <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {active.options.map((opt, i) => (
                      <div key={opt.id} className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-all
                        ${opt.isCorrect ? 'border-emerald-500/60 bg-emerald-900/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 text-white ${OPTION_COLORS[i]}`}>
                          {OPTION_LABELS[i]}
                        </div>
                        <input value={opt.text} onChange={e => updateOption(opt.id, { text: e.target.value })}
                          placeholder={`Option ${OPTION_LABELS[i]}`}
                          className="flex-1 bg-transparent text-white placeholder-zinc-600 focus:outline-none font-medium" />
                        <button onClick={() => setCorrect(opt.id)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                            ${opt.isCorrect ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-emerald-500'}`}>
                          {opt.isCorrect && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  <button onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))} disabled={activeIdx === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  {activeIdx < questions.length - 1 ? (
                    <button onClick={() => setActiveIdx(activeIdx + 1)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white transition-all">
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => addQuestion()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-violet-500/40 text-violet-400 hover:bg-violet-900/20 transition-all">
                      <Plus className="w-4 h-4" /> Add Question
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview */}
        <div className="hidden xl:flex w-64 border-l border-zinc-800 flex-col items-center justify-center p-6 bg-zinc-950">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-4">Preview</p>
          <div className="w-44 rounded-3xl border-4 border-zinc-800 bg-[#0f0a1e] overflow-hidden shadow-2xl">
            <div className="h-3 bg-zinc-800 flex items-center justify-center">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-zinc-500">Q{activeIdx + 1}/{questions.length}</span>
                <span className="text-xs text-amber-400 font-mono font-bold">{active?.timeLimitSeconds}s</span>
              </div>
              <div className="text-xs font-bold text-white mb-3 leading-tight min-h-8">
                {active?.questionText || 'Your question here...'}
              </div>
              {active?.questionType === 'TRUE_FALSE' ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-lg px-2 py-2 bg-emerald-600 flex flex-col items-center text-xs text-white font-bold"><span>✓</span> True</div>
                  <div className="rounded-lg px-2 py-2 bg-red-600 flex flex-col items-center text-xs text-white font-bold"><span>✗</span> False</div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {active?.options.map((opt, i) => (
                    <div key={i} className={`rounded-lg px-2 py-1.5 flex items-center gap-1.5 text-xs text-white font-medium ${OPTION_COLORS[i]}`}>
                      <span className="w-4 h-4 rounded bg-black/20 flex items-center justify-center text-[10px] font-bold shrink-0">{OPTION_LABELS[i]}</span>
                      <span className="truncate">{opt.text || `Option ${OPTION_LABELS[i]}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
