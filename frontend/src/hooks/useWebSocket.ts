'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8081';

export function useWebSocket(pin: string, role: 'host' | 'player') {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useAuthStore();
  const {
    setGameState, setCurrentQuestion, setTimer,
    setLeaderboard, addPlayer,
  } = useGameStore();
  const { player, setRoundResult, updateScore } = usePlayerStore();

  useEffect(() => {
    if (!pin) return;

    const token = role === 'host' ? (accessToken ?? undefined) : undefined;

    const socket = io(WS_URL, {
      auth: token ? { token } : undefined,
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => {
      socket.emit('join-game', {
        pin,
        nickname: role === 'player' ? (player?.nickname ?? undefined) : undefined,
        isHost: role === 'host'
      });
    });

    socket.on('game-state-changed', (data) => setGameState(data));
    socket.on('new-question', (data) => {
      setCurrentQuestion(data);
      setRoundResult(0, false); // reset round result
    });
    socket.on('timer-tick', (data) => setTimer(data));
    socket.on('leaderboard-updated', (data) => setLeaderboard(data));

    if (role === 'player') {
      socket.on('answer-result', (data: { isCorrect: boolean; pointsEarned: number; newScore?: number; streak?: number; streakBonus?: number }) => {
        setRoundResult(data.pointsEarned, data.isCorrect, data.streak ?? 0, data.streakBonus ?? 0);
        if (data.newScore !== undefined) {
          updateScore(data.newScore);
        }
      });
    }

    if (role === 'host') {
      socket.on('player-joined', (data) => addPlayer(data));
      socket.on('question-ended', (data) => useGameStore.getState().setQuestionEnded(true, data.correctOptionId));
      socket.on('show-scoreboard', () => useGameStore.getState().setShowScoreboard(true));
    }

    socket.on('game-ended', (data) => {
      setGameState({ status: 'ENDED', pin } as any);
      if (data?.leaderboard) {
        setLeaderboard({ entries: data.leaderboard });
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [pin, role, player?.nickname]);

  const send = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { send, socket: socketRef };
}
