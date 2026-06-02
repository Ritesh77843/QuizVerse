'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { ImportJobResponse } from '@/types/ai';

export default function TextImportPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const importMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post<ApiResponse<ImportJobResponse>>('/ai/import/text', { textContent: content });
      return res.data.data;
    },
    onSuccess: (data) => {
      router.push(`/host/ai-import/processing?jobId=${data.jobId}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to start import job');
    },
  });

  const handleSubmit = () => {
    if (text.trim().length === 0) {
      setError('Please enter some text for AI results.');
      return;
    }
    setError('');
    importMutation.mutate(text);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/host/ai-import" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Import Options
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>
          <h1 className="text-3xl font-black">Paste Text</h1>
        </div>
        <p className="text-zinc-400">Copy and paste your study material, notes, or raw questions.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 mb-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your content here... (e.g., The mitochondrion is a double-membrane-bound organelle found in most eukaryotic organisms. It generates most of the cell's supply of ATP...)"
          className="w-full h-96 bg-zinc-900 rounded-xl p-6 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
        />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={importMutation.isPending || text.trim().length === 0}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
        >
          {importMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {importMutation.isPending ? 'Analyzing...' : 'Generate Quiz'}
        </button>
      </div>
    </div>
  );
}
