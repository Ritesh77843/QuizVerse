'use client';
import { useQuery } from '@tanstack/react-query';
import { Search, Globe, Play, Copy, MoreVertical, Layers, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import api from '@/lib/api';
import { ApiResponse, PageResponse, Quiz } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function ExplorePage() {
  const [search, setSearch] = useState('');

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['public-quizzes'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PageResponse<Quiz>>>('/quizzes/public');
      return res.data.data.content;
    },
  });

  const filtered = quizzes?.filter(q => 
    q.title.toLowerCase().includes(search.toLowerCase()) || 
    q.description?.toLowerCase().includes(search.toLowerCase()) ||
    q.hostDisplayName?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-white mb-4 flex items-center gap-3">
          <Globe className="w-10 h-10 text-yellow-400" />
          Explore Public Quizzes
        </h1>
        <p className="text-zinc-400 text-lg">
          Discover, practice, and host quizzes created by the community.
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 relative max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-zinc-500" />
        </div>
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, topic, or author..." 
          className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-violet-500 rounded-2xl py-4 pl-12 pr-6 text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6 h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((quiz) => (
            <div key={quiz.id} className="group flex flex-col bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden hover:border-violet-500/50 hover:bg-zinc-900 transition-all shadow-lg hover:shadow-violet-500/10">
              
              {/* Cover area */}
              <div className="h-32 bg-gradient-to-br from-violet-600/20 to-cyan-500/20 relative p-6 flex flex-col justify-end">
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 border border-white/10">
                  <Layers className="w-3.5 h-3.5" />
                  {quiz.questionCount || 0} Qs
                </div>
                <h3 className="font-bold text-xl text-white truncate drop-shadow-md">{quiz.title}</h3>
              </div>

              {/* Body */}
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-zinc-400 text-sm line-clamp-2 mb-4 min-h-[40px]">
                  {quiz.description || "No description provided."}
                </p>
                
                <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-800 pt-4 mb-4">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-5 h-5 rounded-full bg-violet-600/30 flex items-center justify-center text-violet-400">
                      {(quiz as any).hostDisplayName?.[0]?.toUpperCase() || '?'}
                    </span>
                    {(quiz as any).hostDisplayName || 'Anonymous'}
                  </span>
                  <span>{formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true })}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link href={`/host/quizzes/${quiz.id}/play`}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                    <Play className="w-4 h-4" /> Host
                  </Link>
                  <Link href={`/practice/${quiz.id}`}
                    className="flex-1 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                    Practice
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/30 border border-zinc-800 rounded-3xl max-w-2xl mx-auto">
          <SearchX className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No quizzes found</h3>
          <p className="text-zinc-500">We couldn't find any public quizzes matching "{search}".</p>
        </div>
      )}
    </div>
  );
}
