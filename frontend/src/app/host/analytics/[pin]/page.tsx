'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Target, Trophy, Clock, BarChart3, Download } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse, SessionSummary } from '@/types';
import { formatScore } from '@/lib/utils';
import { format } from 'date-fns';

export default function AnalyticsPage() {
  const { pin } = useParams<{ pin: string }>();

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['analytics', pin],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SessionSummary>>(`/analytics/${pin}`);
      return res.data.data;
    },
  });

  if (isLoading) return <div className="p-8 text-zinc-500">Loading analytics...</div>;
  if (error || !summary) return <div className="p-8 text-red-400">Failed to load analytics data.</div>;

  const totalQuestions = summary.questionStats.length;
  const overallAccuracy = totalQuestions > 0 
    ? summary.questionStats.reduce((acc, q) => acc + q.accuracyPercent, 0) / totalQuestions 
    : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <Link href="/host/dashboard" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">{summary.quizTitle}</h1>
          <p className="text-zinc-400 flex items-center gap-2">
            Game PIN: <span className="font-mono text-violet-400 font-bold">{summary.pin}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            {format(new Date(summary.startedAt), 'MMM d, yyyy • h:mm a')}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-zinc-400 text-sm font-medium">Total Players</span>
          </div>
          <p className="text-3xl font-black">{summary.totalPlayers}</p>
        </div>
        
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-zinc-400 text-sm font-medium">Avg Accuracy</span>
          </div>
          <p className="text-3xl font-black">{overallAccuracy.toFixed(1)}%</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-zinc-400 text-sm font-medium">Average Score</span>
          </div>
          <p className="text-3xl font-black">{formatScore(summary.averageScore)}</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-yellow-400" />
            </div>
            <span className="text-zinc-400 text-sm font-medium">Top Score</span>
          </div>
          <p className="text-3xl font-black text-yellow-400">{formatScore(summary.topScore)}</p>
        </div>
      </div>

      {/* Per-Question Analytics */}
      <h2 className="text-xl font-bold mb-4">Question Breakdown</h2>
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800">
              <th className="text-left px-6 py-4 w-12">#</th>
              <th className="text-left px-6 py-4">Question</th>
              <th className="text-right px-6 py-4">Answers</th>
              <th className="text-right px-6 py-4">Accuracy</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {summary.questionStats.map((q, i) => (
              <tr key={q.questionId} className="hover:bg-zinc-800/20 transition-colors">
                <td className="px-6 py-4 text-zinc-500 font-medium">{i + 1}</td>
                <td className="px-6 py-4 font-medium max-w-sm truncate">{q.questionText}</td>
                <td className="px-6 py-4 text-right text-zinc-400">{q.totalAnswers}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <span className={`font-bold ${q.accuracyPercent > 70 ? 'text-emerald-400' : q.accuracyPercent > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {q.accuracyPercent.toFixed(1)}%
                    </span>
                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${q.accuracyPercent > 70 ? 'bg-emerald-500' : q.accuracyPercent > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${q.accuracyPercent}%` }} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
