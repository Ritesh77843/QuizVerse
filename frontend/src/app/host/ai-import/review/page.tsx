'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Trash2, Save, Loader2, Cpu, Sparkles, Plus, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';
import { Suspense } from 'react';

interface AiQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  confidence: number;
}

const BLANK_QUESTION: AiQuestion = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  confidence: 100,
};

function QuestionCard({
  q, i, onRemove, onChange,
}: {
  q: AiQuestion;
  i: number;
  onRemove: () => void;
  onChange: (updated: AiQuestion) => void;
}) {
  const [editing, setEditing] = useState(q.question === '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 relative group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
            {i + 1}
          </div>
          {editing ? (
            <textarea
              autoFocus
              value={q.question}
              onChange={e => onChange({ ...q, question: e.target.value })}
              placeholder="Enter question text..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-violet-500 resize-none min-h-[60px]"
            />
          ) : (
            <h3 className="text-base font-bold flex-1">{q.question}</h3>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setEditing(e => !e)}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
            title={editing ? 'Collapse' : 'Edit'}
          >
            {editing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all"
            title="Remove question"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="grid sm:grid-cols-2 gap-3 ml-12">
        {q.options.map((opt, oIdx) => (
          <div
            key={oIdx}
            onClick={() => { if (!editing) onChange({ ...q, correctAnswer: oIdx }); }}
            className={`px-4 py-3 rounded-xl border flex items-center gap-3 text-sm font-medium transition-all
              ${oIdx === q.correctAnswer
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-600 cursor-pointer'
              }`}
          >
            {oIdx === q.correctAnswer && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
            {editing ? (
              <input
                value={opt}
                onChange={e => {
                  const newOpts = [...q.options];
                  newOpts[oIdx] = e.target.value;
                  onChange({ ...q, options: newOpts });
                }}
                onClick={e => e.stopPropagation()}
                placeholder={`Option ${oIdx + 1}${oIdx === q.correctAnswer ? ' (correct)' : ''}`}
                className="flex-1 bg-transparent focus:outline-none text-sm placeholder-zinc-600"
              />
            ) : (
              <span>{opt || <span className="text-zinc-600 italic">Empty option</span>}</span>
            )}
          </div>
        ))}
      </div>
      {editing && (
        <p className="text-xs text-zinc-500 mt-3 ml-12">
          Click an option above to mark it as correct. Edit text in the fields.
        </p>
      )}
    </motion.div>
  );
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');
  const jobId = searchParams.get('jobId');
  const qc = useQueryClient();

  const [questions, setQuestions] = useState<AiQuestion[]>([]);
  const [jobTitle, setJobTitle] = useState('AI Generated Quiz');
  const [saveError, setSaveError] = useState('');

  const { data: jobData, isLoading: jobLoading } = useQuery({
    queryKey: ['import-job', jobId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>(`/ai/import/${jobId}`);
      return res.data.data;
    },
    enabled: !!jobId && !draftId,
  });

  const { data: draftData, isLoading: draftLoading } = useQuery({
    queryKey: ['draft', draftId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any>>(`/ai/drafts/${draftId}`);
      return res.data.data;
    },
    enabled: !!draftId,
  });

  useEffect(() => {
    if (jobData?.parsedQuestions && questions.length === 0) {
      try {
        const parsed = typeof jobData.parsedQuestions === 'string'
          ? JSON.parse(jobData.parsedQuestions)
          : jobData.parsedQuestions;
        setQuestions(parsed);
        if (jobData.title) setJobTitle(jobData.title);
      } catch (e) {
        console.error('Failed to parse questions', e);
      }
    }
    if (draftData?.questions && questions.length === 0) {
      setQuestions(draftData.questions);
      if (draftData.title) setJobTitle(draftData.title);
    }
  }, [jobData, draftData]);

  const isLoading = jobLoading || draftLoading;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const validQuestions = questions.filter(q => q.question.trim() && q.options.some(o => o.trim()));
      if (validQuestions.length === 0) throw new Error('No valid questions to save.');
      const res = await api.post<ApiResponse<any>>('/quizzes', {
        title: jobTitle || 'AI Generated Quiz',
        questions: validQuestions.map(q => ({
          questionText: q.question,
          options: q.options.map((text, i) => ({ text, optionText: text, isCorrect: i === q.correctAnswer })),
          timeLimit: 30,
          points: 100,
        })),
      });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-quizzes'] });
      router.push('/host/quizzes');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save quiz. Please try again.';
      setSaveError(msg);
      console.error('Save quiz error:', err?.response?.data || err);
    },
  });

  const addBlankQuestion = () => {
    setQuestions(qs => [...qs, { ...BLANK_QUESTION, options: ['', '', '', ''] }]);
    // Scroll to bottom after adding
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  // A question is "valid" if it has text and at least some options
  const validCount = questions.filter(q => q.question.trim() && q.options.some(o => o.trim())).length;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto pb-40">
      {/* Error banner */}
      {saveError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Failed to save quiz</p>
            <p className="text-red-400/80 text-xs mt-0.5">{saveError}</p>
          </div>
          <button onClick={() => setSaveError('')} className="ml-auto text-red-400/60 hover:text-red-400 text-xs">✕</button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-violet-400" />
            <h1 className="text-3xl font-black">Review AI Draft</h1>
          </div>
          <p className="text-zinc-400 mb-3">
            <span className="text-white font-semibold">{validCount}</span> question{validCount !== 1 ? 's' : ''} — remove, edit, or add more below.
          </p>
          <input
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm w-full sm:w-96 focus:outline-none focus:border-violet-500 transition-colors"
            placeholder="Quiz title..."
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => router.push('/host/ai-import')}
            className="px-5 py-2.5 rounded-xl font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-700">
            Discard
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || validCount === 0}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-600/20"
          >
            {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save as Quiz
          </button>
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-6">
        <AnimatePresence>
          {questions.map((q, i) => (
            <QuestionCard
              key={i}
              q={q}
              i={i}
              onRemove={() => setQuestions(qs => qs.filter((_, idx) => idx !== i))}
              onChange={(updated) => setQuestions(qs => qs.map((old, idx) => idx === i ? updated : old))}
            />
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {questions.length === 0 && (
          <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
            <Sparkles className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500 font-medium">No questions yet.</p>
            <p className="text-zinc-600 text-sm mt-1">Add questions manually or go back and try a larger text.</p>
          </div>
        )}

        {/* Add Question button */}
        <motion.button
          onClick={addBlankQuestion}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-violet-500/50 hover:bg-violet-500/5 text-zinc-400 hover:text-violet-400 transition-all flex items-center justify-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Question Manually
        </motion.button>
      </div>

      {/* Sticky save bar */}
      {validCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800 flex justify-between items-center z-50">
          <p className="text-sm text-zinc-400">
            <span className="text-white font-bold">{validCount}</span> questions ready to save
          </p>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-violet-600/20"
          >
            {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saveMutation.isPending ? 'Saving...' : 'Save as Quiz'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReviewDraftPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>}>
      <ReviewContent />
    </Suspense>
  );
}
