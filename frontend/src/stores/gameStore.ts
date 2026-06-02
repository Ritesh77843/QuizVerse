import { create } from 'zustand';
import { GameSession, GameStateEvent, QuestionEvent, TimerEvent, LeaderboardEvent, PlayerJoinEvent } from '@/types';

export interface GameControls {
  handleNext: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleEnd: () => void;
}

interface GameStore {
  session: GameSession | null;
  gameState: GameStateEvent | null;
  currentQuestion: QuestionEvent | null;
  timer: TimerEvent | null;
  leaderboard: LeaderboardEvent | null;
  waitingPlayers: PlayerJoinEvent[];
  selectedOptionId: string | null;
  hasAnswered: boolean;
  gameControls: GameControls | null;
  questionEnded: boolean;
  correctOptionId: string | null;
  showScoreboard: boolean;

  setSession: (session: GameSession) => void;
  setGameState: (event: GameStateEvent) => void;
  setCurrentQuestion: (event: QuestionEvent) => void;
  setTimer: (event: TimerEvent) => void;
  setLeaderboard: (event: LeaderboardEvent) => void;
  addPlayer: (event: PlayerJoinEvent) => void;
  setSelectedOption: (optionId: string) => void;
  resetAnswer: () => void;
  clearGame: () => void;
  setGameControls: (controls: GameControls | null) => void;
  setQuestionEnded: (ended: boolean, correctOptionId?: string | null) => void;
  setShowScoreboard: (show: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  session: null,
  gameState: null,
  currentQuestion: null,
  timer: null,
  leaderboard: null,
  waitingPlayers: [],
  selectedOptionId: null,
  hasAnswered: false,
  gameControls: null,
  questionEnded: false,
  correctOptionId: null,
  showScoreboard: false,

  setSession: (session) => set({
    session,
    waitingPlayers: session.players ? session.players.map(p => ({
      nickname: p.nickname,
      avatarSeed: p.avatarSeed,
      totalPlayers: session.players?.length ?? 0
    })) : []
  }),
  setGameState: (gameState) => set({ gameState }),
  setCurrentQuestion: (currentQuestion) => set({ currentQuestion, selectedOptionId: null, hasAnswered: false, questionEnded: false, correctOptionId: null, showScoreboard: false }),
  setTimer: (timer) => set({ timer }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  addPlayer: (event) => set((s) => ({
    waitingPlayers: [...s.waitingPlayers.filter(p => p.nickname !== event.nickname), event]
  })),
  setSelectedOption: (optionId) => set({ selectedOptionId: optionId, hasAnswered: true }),
  resetAnswer: () => set({ selectedOptionId: null, hasAnswered: false }),
  clearGame: () => set({
    session: null, gameState: null, currentQuestion: null,
    timer: null, leaderboard: null, waitingPlayers: [],
    selectedOptionId: null, hasAnswered: false,
    gameControls: null, questionEnded: false, correctOptionId: null, showScoreboard: false
  }),
  setGameControls: (gameControls) => set({ gameControls }),
  setQuestionEnded: (ended, correctOptionId = null) => set({ questionEnded: ended, correctOptionId }),
  setShowScoreboard: (show) => set({ showScoreboard: show }),
}));
