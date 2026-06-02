import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Player } from '@/types';

interface PlayerStore {
  player: Player | null;
  pin: string | null;
  pointsLastRound: number;
  streakBonus: number;
  streak: number;
  isCorrectLastRound: boolean | null;

  setPlayer: (player: Player, pin: string) => void;
  setRoundResult: (points: number, isCorrect: boolean, streak?: number, streakBonus?: number) => void;
  updateScore: (score: number) => void;
  clearPlayer: () => void;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      player: null,
      pin: null,
      pointsLastRound: 0,
      streakBonus: 0,
      streak: 0,
      isCorrectLastRound: null,

      setPlayer: (player, pin) => set({ player, pin }),
      setRoundResult: (points, isCorrect, streak = 0, streakBonus = 0) =>
        set({ pointsLastRound: points, isCorrectLastRound: isCorrect, streak, streakBonus }),
      updateScore: (score) => set((s) => s.player ? { player: { ...s.player, score } } : {}),
      clearPlayer: () => set({ player: null, pin: null, pointsLastRound: 0, isCorrectLastRound: null, streak: 0, streakBonus: 0 }),
    }),
    { name: 'quizverse-player' }
  )
);
