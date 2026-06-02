'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, FileEdit, Trash2, Play, Globe, Lock, Loader2, BookOpen, MoreVertical, HelpCircle } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse, PageResponse, Quiz } from '@/types';
import { useAuthStore } from '@/stores/authStore';

// Gradient palettes for quiz cards without cover images
const CARD_GRADIENTS = [
  'from-violet-600 to-purple-800',
  'from-blue-500 to-cyan-700',
  'from-orange-500 to-red-700',
  'from-emerald-500 to-teal-700',
  'from-pink-500 to-rose-700',
  'from-amber-500 to-yellow-700',
];

const CARD_PATTERNS = ['◆', '●', '▲', '■', '★', '⬟'];

function QuizCard({ quiz, onDelete, onPublish, onPlay, onRename, onDuplicate }: {
  quiz: Quiz;
  onDelete: () => void;
  onPublish: () => void;
  onPlay: () => void;
  onRename: () => void;
  onDuplicate: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const idx = quiz.title.charCodeAt(0) % CARD_GRADIENTS.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-[#143d27]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-sm hover:shadow-xl hover:border-white/20 transition-all cursor-pointer group flex flex-col relative ${menuOpen ? 'z-50' : 'z-10'}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-2xl shrink-0"
        onClick={onPlay}>
        {quiz.coverImageUrl ? (
          <img src={quiz.coverImageUrl} alt={quiz.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${CARD_GRADIENTS[idx]} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
            <span className="text-white/30 text-7xl font-black select-none">{CARD_PATTERNS[idx]}</span>
          </div>
        )}

        {/* Question count badge */}
        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
          {quiz.questionCount ?? 0} questions
        </div>

        {/* Status badge */}
        {quiz.status === 'PUBLISHED' && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Globe className="w-3 h-3" /> Live
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-4 shadow-xl"
          >
            <Play className="w-6 h-6 text-[#ED5565] fill-[#ED5565]" />
          </motion.div>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base text-white truncate leading-tight" title={quiz.title}>{quiz.title}</h3>
            <p className="text-emerald-100/70 text-xs mt-0.5 truncate">{quiz.hostDisplayName || 'You'}</p>
          </div>

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-emerald-100/70 hover:text-white transition-colors shrink-0"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-56 bg-[#143d27]/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 py-1.5"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button onClick={(e) => { e.stopPropagation(); onPlay(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-100/90 hover:bg-white/10 hover:text-white transition-colors">
                    <div className="w-4 flex justify-center"><Globe className="w-4 h-4" /></div> Host live
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); alert('Coming soon!'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-100/90 hover:bg-white/10 hover:text-white transition-colors">
                    <div className="w-4 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg></div> Assign
                  </button>
                  <Link href={`/practice/${quiz.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-100/90 hover:bg-white/10 hover:text-white transition-colors">
                    <div className="w-4 flex justify-center"><Play className="w-4 h-4" /></div> Practice solo
                  </Link>
                  
                  <div className="h-px bg-white/10 my-1" />
                  
                  <Link href={`/host/quizzes/${quiz.id}/edit`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-100/90 hover:bg-white/10 hover:text-white transition-colors">
                    <div className="w-4 flex justify-center"><FileEdit className="w-4 h-4" /></div> Edit
                  </Link>
                  <button onClick={(e) => { e.stopPropagation(); onRename(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-100/90 hover:bg-white/10 hover:text-white transition-colors">
                    <div className="w-4 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg></div> Change title
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDuplicate(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-100/90 hover:bg-white/10 hover:text-white transition-colors">
                    <div className="w-4 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></div> Duplicate
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); alert('Coming soon!'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-100/90 hover:bg-white/10 hover:text-white transition-colors">
                    <div className="w-4 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></div> Add to favorites
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onPublish(); setMenuOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-emerald-100/90 hover:bg-white/10 hover:text-white transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-4 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div> Visibility
                    </div>
                    <span className="text-xs text-emerald-300 font-bold capitalize">{quiz.status.toLowerCase()}</span>
                  </button>

                  <div className="h-px bg-white/10 my-1" />

                  <button onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/20 transition-colors">
                    <div className="w-4 flex justify-center"><Trash2 className="w-4 h-4" /></div> Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function QuizzesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['my-quizzes', user?.id, page],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PageResponse<Quiz>>>(`/quizzes?page=${page}&size=24&sort=createdAt,desc`);
      return res.data.data;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quizzes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-quizzes'] }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'publish' | 'unpublish' }) =>
      api.patch(`/quizzes/${id}/${action}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-quizzes'] }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.put(`/quizzes/${id}`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-quizzes'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      // 1. Fetch full quiz details with questions
      const res = await api.get<ApiResponse<any>>(`/quizzes/${id}`);
      const fullQuiz = res.data.data;
      // 2. Create new quiz using existing payload structure
      const createRes = await api.post<ApiResponse<Quiz>>(`/quizzes`, {
        title: `${fullQuiz.title} (Copy)`,
        description: fullQuiz.description,
        questions: fullQuiz.questions,
      });
      return createRes.data.data;
    },
    onSuccess: (newQuiz) => {
      qc.invalidateQueries({ queryKey: ['my-quizzes'] });
    },
    onError: (err) => alert('Failed to duplicate quiz.')
  });

  const handleRename = (quiz: Quiz) => {
    const newTitle = prompt('Enter new title for this quiz:', quiz.title);
    if (newTitle && newTitle.trim() !== '' && newTitle !== quiz.title) {
      renameMutation.mutate({ id: quiz.id, title: newTitle.trim() });
    }
  };

  const filtered = (data?.content ?? []).filter(q =>
    q.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-white">My Library</h1>
          <p className="text-emerald-100/70 text-sm mt-1 font-medium">{data?.totalElements ?? 0} quizzes</p>
        </div>
        <Link href="/host/quizzes/create"
          className="flex items-center gap-2 bg-[#ED5565] hover:bg-[#F14C4F] text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-red-500/25 text-sm">
          <Plus className="w-4 h-4" /> Create
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100/50" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search quizzes..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-emerald-100/40 focus:outline-none focus:border-yellow-400 focus:bg-white/10 transition-all max-w-xs font-medium"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-emerald-100/60">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40 text-yellow-400" />
          <p className="font-bold text-lg text-white">No quizzes found</p>
          <p className="text-sm mt-1 mb-6 font-medium">Create your first quiz or import with AI</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/host/quizzes/create"
              className="bg-[#ED5565] hover:bg-[#F14C4F] text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-lg">
              Create Quiz
            </Link>
            <Link href="/host/ai-import"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all">
              AI Import
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {/* Create new card */}
          <Link href="/host/quizzes/create">
            <motion.div
              whileHover={{ y: -4 }}
              className="border-2 border-dashed border-white/20 bg-white/5 rounded-2xl overflow-hidden hover:border-yellow-400/50 hover:bg-white/10 transition-all group cursor-pointer h-full flex flex-col items-center justify-center min-h-[220px]"
            >
              <div className="flex flex-col items-center gap-3 text-emerald-100/50 group-hover:text-yellow-400 transition-colors">
                <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-yellow-400/20 flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold">New quiz</p>
              </div>
            </motion.div>
          </Link>

          {filtered.map((quiz, i) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onDelete={() => { if (confirm(`Delete "${quiz.title}"?`)) deleteMutation.mutate(quiz.id); }}
              onPublish={() => publishMutation.mutate({ id: quiz.id, action: quiz.status === 'PUBLISHED' ? 'unpublish' : 'publish' })}
              onPlay={() => router.push(`/host/quizzes/${quiz.id}/play`)}
              onRename={() => handleRename(quiz)}
              onDuplicate={() => duplicateMutation.mutate(quiz.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 text-sm font-bold transition-all">
            ← Prev
          </button>
          <span className="text-emerald-100/60 font-medium text-sm">Page {page + 1} of {data?.totalPages}</span>
          <button disabled={page + 1 >= (data?.totalPages ?? 1)} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 text-sm font-bold transition-all">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
