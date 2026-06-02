'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { ImportJobResponse } from '@/types/ai';

import { Suspense } from 'react';

function ProcessingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const { data: job, error } = useQuery({
    queryKey: ['import-job', jobId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ImportJobResponse>>(`/ai/import/${jobId}`);
      return res.data.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.jobStatus;
      if (status === 'COMPLETED' || status === 'FAILED') return false;
      return 3000; // Poll every 3 seconds
    },
  });

  useEffect(() => {
    if (job?.jobStatus === 'COMPLETED') {
      if (job.draftId) {
        router.push(`/host/ai-import/review?draftId=${job.draftId}`);
      } else {
        router.push(`/host/ai-import/review?jobId=${jobId}`);
      }
    }
  }, [job, router, jobId]);

  if (!jobId) {
    return <div className="p-8 text-center text-red-400">Invalid Job ID. Please go back.</div>;
  }

  if (error || job?.jobStatus === 'FAILED') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
          <span className="text-2xl">❌</span>
        </div>
        <h1 className="text-2xl font-black mb-2">Import Failed</h1>
        <p className="text-zinc-400 mb-6 text-center max-w-md">
          We couldn't process your input. The AI might have failed to extract meaningful questions, or the file was unreadable.
        </p>
        <button onClick={() => router.push('/host/ai-import')}
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="relative w-24 h-24 mb-8"
      >
        <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 opacity-20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-violet-500" />
        <motion.div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-cyan-500" animate={{ rotate: -720 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
      </motion.div>

      <h1 className="text-2xl font-black mb-2">AI is analyzing your content</h1>
      <p className="text-zinc-400 text-center max-w-sm mb-8">
        This usually takes 10-30 seconds depending on the length of your material. We're extracting questions, generating options, and determining correct answers.
      </p>

      {/* Progress Steps Mock */}
      <div className="w-full max-w-md space-y-4">
        {[
          { label: 'Reading content', status: 'done' },
          { label: 'Extracting key concepts', status: 'done' },
          { label: 'Generating MCQs', status: 'active' },
          { label: 'Validating answers', status: 'pending' },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border
              ${step.status === 'done' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                step.status === 'active' ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' :
                'border-zinc-800 text-zinc-600'}`}>
              {step.status === 'done' && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              {step.status === 'active' && <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />}
            </div>
            <span className={`text-sm font-medium ${step.status === 'pending' ? 'text-zinc-600' : 'text-zinc-300'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ProcessingContent />
    </Suspense>
  );
}

