import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return score.toLocaleString();
}

export function getAvatarUrl(seed: string): string {
  if (!seed) return `https://api.dicebear.com/7.x/bottts/svg?seed=placeholder&backgroundColor=transparent`;
  if (seed.includes(':')) {
    const [style, ...rest] = seed.split(':');
    return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(rest.join(':'))}&backgroundColor=transparent`;
  }
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=transparent`;
}

export const ANSWER_COLORS = [
  { bg: 'bg-[#E74C3C]', hover: 'hover:bg-[#C0392B]', text: 'text-white', border: 'border-[#C0392B]', label: 'A', shape: 'triangle' },
  { bg: 'bg-[#3498DB]', hover: 'hover:bg-[#2980B9]', text: 'text-white', border: 'border-[#2980B9]', label: 'B', shape: 'diamond' },
  { bg: 'bg-[#F39C12]', hover: 'hover:bg-[#D68910]', text: 'text-white', border: 'border-[#D68910]', label: 'C', shape: 'circle' },
  { bg: 'bg-[#27AE60]', hover: 'hover:bg-[#1E8449]', text: 'text-white', border: 'border-[#1E8449]', label: 'D', shape: 'square' },
];
