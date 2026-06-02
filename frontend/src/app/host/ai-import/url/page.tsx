'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Link2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { ImportJobResponse } from '@/types/ai';

export default function UrlImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const importMutation = useMutation({
    mutationFn: async (targetUrl: string) => {
      const res = await api.post<ApiResponse<ImportJobResponse>>('/ai/import/url', { targetUrl });
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
    try {
      new URL(url); // basic validation
    } catch {
      setError('Please enter a valid URL (e.g., https://example.com/article)');
      return;
    }
    setError('');
    importMutation.mutate(url);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/host/ai-import" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Import Options
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black">Import from URL</h1>
        </div>
        <p className="text-zinc-400">Enter the URL of an article or webpage to extract quiz questions from its content.</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">Webpage URL</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://en.wikipedia.org/wiki/Mitochondrion"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
        />

        <div className="mt-4 flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> We will scrape the text content of the provided URL. Make sure the page is publicly accessible and does not require a login.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={importMutation.isPending || !url.trim()}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
        >
          {importMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {importMutation.isPending ? 'Scraping & Analyzing...' : 'Generate Quiz'}
        </button>
      </div>
    </div>
  );
}
