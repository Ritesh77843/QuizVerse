'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, Sparkles, UploadCloud, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { ApiResponse } from '@/types';
import { ImportJobResponse } from '@/types/ai';

export default function PdfImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('');
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      if (selected.size > 10 * 1024 * 1024) { // 10MB
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selected);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const importMutation = useMutation({
    mutationFn: async (uploadFile: File) => {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await api.post<ApiResponse<ImportJobResponse>>('/ai/import/pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      router.push(`/host/ai-import/processing?jobId=${data.jobId}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to upload PDF');
    },
  });

  const handleSubmit = () => {
    if (!file) return;
    importMutation.mutate(file);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/host/ai-import" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Import Options
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="text-3xl font-black">Upload PDF</h1>
        </div>
        <p className="text-zinc-400">Upload notes, presentations, or textbook chapters to generate a quiz.</p>
      </div>

      {!file ? (
        <div {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900'}
          `}>
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="text-lg font-semibold mb-2">Drag & drop your PDF here</p>
          <p className="text-sm text-zinc-500 mb-6">or click to browse from your computer</p>
          <div className="inline-block bg-zinc-800 px-4 py-2 rounded-lg text-xs font-medium text-zinc-400">
            Max file size: 10MB
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <FileText className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-white">{file.name}</p>
              <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button onClick={() => setFile(null)} disabled={importMutation.isPending}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {file && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={importMutation.isPending}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
          >
            {importMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {importMutation.isPending ? 'Processing PDF...' : 'Generate Quiz'}
          </button>
        </div>
      )}
    </div>
  );
}
