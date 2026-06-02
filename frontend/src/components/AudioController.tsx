'use client';
import { useEffect, useRef, useState } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { Volume2, VolumeX } from 'lucide-react';
import { usePathname } from 'next/navigation';

const TRACKS = {
  lobby: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  gameplay: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=electronic-future-beats-117997.mp3',
  podium: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39bde808.mp3?filename=epic-victory-114002.mp3',
};

export default function AudioController() {
  const { currentTrack, isMuted, volume, toggleMute, setTrack } = useAudioStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const pathname = usePathname();

  // Handle auto-routing logic to set the correct track based on the current page
  useEffect(() => {
    if (pathname.includes('/podium') || pathname.includes('/final') || pathname.includes('/results')) {
      setTrack('podium');
    } else if (pathname.includes('/question') || pathname.includes('/feedback') || pathname.includes('/practice') || (pathname.includes('/live') && !pathname.includes('/podium') && !pathname.includes('waiting'))) {
      setTrack('gameplay');
    } else if (pathname === '/' || pathname.includes('/join') || pathname.includes('/nickname') || pathname.includes('/waiting') || pathname.includes('/host')) {
      setTrack('lobby');
    } else {
      setTrack('none');
    }
  }, [pathname, setTrack]);

  // Handle user interaction to allow audio playback
  useEffect(() => {
    const handleInteract = () => setHasInteracted(true);
    window.addEventListener('click', handleInteract, { once: true });
    window.addEventListener('keydown', handleInteract, { once: true });
    return () => {
      window.removeEventListener('click', handleInteract);
      window.removeEventListener('keydown', handleInteract);
    };
  }, []);

  // Handle audio element creation and track switching
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;

    if (currentTrack === 'none' || isMuted || !hasInteracted) {
      audio.pause();
      return;
    }

    const src = TRACKS[currentTrack as keyof typeof TRACKS];
    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }

    audio.volume = volume;
    
    // Play returns a promise that can reject if autoplay is blocked
    audio.play().catch(e => console.warn('Audio play prevented by browser:', e));

    return () => {
      // Don't pause on unmount, we want it to persist across navigation
    };
  }, [currentTrack, isMuted, volume, hasInteracted]);

  // Render a floating volume toggle button
  if (currentTrack === 'none') return null;

  return (
    <button
      onClick={toggleMute}
      className={`fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md border border-white/10
        ${isMuted ? 'bg-zinc-900/80 text-zinc-500' : 'bg-violet-600/80 text-white hover:bg-violet-500'}`}
      title={isMuted ? "Unmute Music" : "Mute Music"}
    >
      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      
      {/* Pulse effect when playing */}
      {!isMuted && hasInteracted && (
        <span className="absolute inset-0 rounded-full border border-violet-500 animate-ping opacity-50" />
      )}
    </button>
  );
}
