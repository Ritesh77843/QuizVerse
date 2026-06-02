// ===== AUTH =====
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'HOST' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  email: string;
  displayName: string;
  role: string;
}

// ===== QUIZ =====
export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ScoringMode = 'STANDARD' | 'NO_PENALTY' | 'CUSTOM';
export type QuestionType = 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'TRUE_FALSE';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  status: QuizStatus;
  defaultTimeLimitSeconds: number;
  scoringMode: ScoringMode;
  coverImageUrl?: string;
  hostId: string;
  hostDisplayName: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
  position: number;
  colorCode?: string;
}

export interface Question {
  id: string;
  quizId: string;
  questionText: string;
  questionType: QuestionType;
  timeLimitSeconds: number;
  points: number;
  position: number;
  mediaUrl?: string;
  options: Option[];
  createdAt: string;
}

// ===== GAME SESSION =====
export type GameStatus = 'WAITING' | 'ACTIVE' | 'PAUSED' | 'ENDED';

export interface GameSession {
  id: string;
  pin: string;
  quizId: string;
  quizTitle: string;
  hostId: string;
  status: GameStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  playerCount: number;
  startedAt?: string;
  createdAt: string;
  players?: Player[];
}

export interface Player {
  id: string;
  nickname: string;
  avatarSeed: string;
  score: number;
  rank?: number;
  sessionPin: string;
}

// ===== WEBSOCKET EVENTS =====
export interface GameStateEvent {
  pin: string;
  status: GameStatus;
  isLocked?: boolean;
  playerCount: number;
  currentQuestionIndex: number;
  totalQuestions: number;
}

export interface QuestionEvent {
  questionId: string;
  index: number;
  total: number;
  questionText: string;
  questionType: string;
  timeLimitSeconds: number;
  points: number;
  mediaUrl?: string;
  options: {
    id: string;
    text: string;
    colorCode?: string;
    position: number;
  }[];
}

export interface TimerEvent {
  pin: string;
  questionId: string;
  remaining: number;
  total: number;
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  avatarSeed: string;
  score: number;
  pointsLastRound?: number;
}

export interface LeaderboardEvent {
  pin: string;
  entries: LeaderboardEntry[];
}

export interface PlayerJoinEvent {
  nickname: string;
  avatarSeed: string;
  totalPlayers: number;
}

// ===== AI IMPORT =====
export type ImportJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type DraftStatus = 'PENDING_REVIEW' | 'APPROVED' | 'DISCARDED';

export interface ImportJob {
  jobId: string;
  draftId?: string;
  jobStatus: ImportJobStatus;
  draftStatus?: DraftStatus;
  title?: string;
  parsedQuestions?: AiQuestion[];
  createdAt: string;
  completedAt?: string;
}

export interface AiQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  confidence: number;
}

// ===== ANALYTICS =====
export interface SessionSummary {
  pin: string;
  quizTitle: string;
  totalPlayers: number;
  averageScore: number;
  topScore: number;
  startedAt: string;
  endedAt?: string;
  leaderboard?: LeaderboardEntry[];
  questionStats: {
    questionId: string;
    questionText: string;
    totalAnswers: number;
    correctAnswers: number;
    accuracyPercent: number;
  }[];
}

// ===== API =====
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
