'use client';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Share2, Check, Download } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { ApiResponse, SessionSummary } from '@/types';
import { formatScore, getAvatarUrl } from '@/lib/utils';

export default function PublicResultsPage() {
  const { pin } = useParams<{ pin: string }>();
  const [copied, setCopied] = useState(false);

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['public-results', pin],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SessionSummary>>(`/analytics/${pin}`);
      return res.data.data;
    },
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportCSV = () => {
    if (!summary?.leaderboard?.length) return;
    const rows = [
      ['Rank', 'Nickname', 'Score'],
      ...summary.leaderboard.map((e: any, i: number) => [i + 1, e.nickname, e.score])
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

  if (isLoading) return (
    <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center">
      <div className="text-zinc-400 animate-pulse">Loading results...</div>
    </div>
  );

  if (error || !summary) return (
    <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="text-2xl font-black text-white mb-2">Results Not Found</h1>
        <p className="text-zinc-400">This game may not exist or hasn't finished yet.</p>
      </div>
    </div>
  );

  const leaderboard = summary.leaderboard || [];
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const medals = ['🥇', '🥈', '🥉'];
  const podiumColors = [
    'from-yellow-500/20 to-yellow-900/10 border-yellow-500/30',
    'from-blue-500/20 to-blue-900/10 border-blue-500/30',
    'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0a1e] to-[#09090b] px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h1 className="text-3xl font-black text-white mb-1">Game Results</h1>
          <p className="text-zinc-400 text-sm">PIN: <span className="font-mono text-violet-400">{pin}</span></p>
          {summary.quizTitle && <p className="text-zinc-500 text-sm mt-1">{summary.quizTitle}</p>}
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button onClick={handleShare}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all border
              ${copied
                ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-violet-500/50 hover:text-white'}`}>
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Link Copied!' : 'Share Results'}
          </button>
          {leaderboard.length > 0 && (
            <button onClick={exportCSV}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-bold text-sm border bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-violet-500/50 hover:text-white transition-all">
              <Download className="w-4 h-4" /> CSV
            </button>
          )}
        </div>

        {/* Top 3 */}
        {top3.length > 0 && (
          <div className="space-y-3 mb-4">
            {top3.map((player: any, i: number) => (
              <motion.div
                key={player.nickname}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border bg-gradient-to-r ${podiumColors[i]}`}
              >
                <span className="text-3xl">{medals[i]}</span>
                <div className="w-12 h-12 rounded-xl bg-white/10 overflow-hidden shrink-0">
                  <img
                    src={getAvatarUrl(player.avatarSeed || player.nickname)}
                    alt={player.nickname}
                    className="w-full h-full p-1"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white text-lg truncate">{player.nickname}</p>
                </div>
                <span className="font-black text-xl text-white">{formatScore(player.score)}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Rest of leaderboard */}
        {rest.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
            {rest.map((player: any, i: number) => (
              <motion.div
                key={player.nickname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-zinc-800/50' : ''}`}
              >
                <span className="w-7 text-center text-zinc-500 font-black text-sm">#{i + 4}</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600/30 to-cyan-500/30 overflow-hidden shrink-0">
                  <img
                    src={getAvatarUrl(player.avatarSeed || player.nickname)}
                    alt={player.nickname}
                    className="w-full h-full p-0.5"
                  />
                </div>
                <span className="flex-1 font-semibold text-sm text-white truncate">{player.nickname}</span>
                <span className="font-bold text-sm text-violet-400">{formatScore(player.score)}</span>
              </motion.div>
            ))}
          </div>
        )}

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-zinc-500">No results yet.</div>
        )}

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-zinc-600 text-xs">Powered by QuizVerse</p>
        </div>
      </div>
    </div>
  );
}
