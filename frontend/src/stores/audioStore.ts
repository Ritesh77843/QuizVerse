import { create } from 'zustand';

type Track = 'lobby' | 'gameplay' | 'podium' | 'none';

interface AudioState {
  currentTrack: Track;
  isMuted: boolean;
  volume: number;
  setTrack: (track: Track) => void;
  toggleMute: () => void;
  setVolume: (vol: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  currentTrack: 'none',
  isMuted: false, // Start unmuted, but we rely on user interaction to actually play
  volume: 0.5,
  setTrack: (track) => set({ currentTrack: track }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setVolume: (volume) => set({ volume }),
}));
