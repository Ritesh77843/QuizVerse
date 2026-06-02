'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { ApiResponse, GameSession } from '@/types';

export default function LaunchGamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const launchMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<GameSession>>('/games', { quizId: id });
      return res.data.data;
    },
    onSuccess: (data) => {
      router.push(`/host/live/${data.pin}`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to start game');
      router.push('/host/dashboard');
    },
  });

  useEffect(() => {
    if (id) {
      launchMutation.mutate();
    }
  }, [id]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-violet-500 mb-4" />
      <h1 className="text-2xl font-black mb-2">Launching Game...</h1>
      <p className="text-zinc-400">Preparing the lobby and generating your game PIN</p>
    </div>
  );
}
