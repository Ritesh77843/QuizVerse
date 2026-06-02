'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Cpu, Settings, LogOut, Sparkles, ChevronRight, Play, Pause, Square
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import api from '@/lib/api';

const nav = [
  { href: '/host/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/host/explore', icon: Sparkles, label: 'Explore' },
  { href: '/host/quizzes', icon: BookOpen, label: 'My Quizzes' },
  { href: '/host/ai-import', icon: Cpu, label: 'AI Import' },
  { href: '/host/settings', icon: Settings, label: 'Settings' },
];

export function HostSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { session, gameState, gameControls } = useGameStore();

  const isLiveGame = pathname.startsWith('/host/live/');
  const status = gameState?.status ?? session?.status;
  const isActive = status === 'ACTIVE';
  const isPaused = status === 'PAUSED';

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/login');
  };

  return (
    <aside className="w-72 h-screen sticky top-0 shrink-0 flex flex-col bg-[#143d27]/80 backdrop-blur-md border-r border-white/10 z-40 text-white">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/host/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Sparkles className="w-5 h-5 text-[#1E5136] fill-[#1E5136]" />
          </div>
          <span className="font-bold text-xl">QuizVerse</span>
        </Link>
      </div>

      {/* Nav / Game Controls */}
      {!isLiveGame && (
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ href, icon: Icon, label }) => {
            const isActivePath = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className={`group flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all
                  ${isActivePath
                    ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30'
                    : 'text-emerald-100/70 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActivePath ? 'text-yellow-400' : 'text-emerald-200/50 group-hover:text-emerald-100'}`} />
                {label}
                {isActivePath && <ChevronRight className="w-5 h-5 ml-auto text-yellow-400" />}
              </Link>
            );
          })}
        </nav>
      )}

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-full bg-yellow-400 text-[#1E5136] flex items-center justify-center text-base font-bold shrink-0">
              {user.displayName[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 text-white">
              <p className="text-base font-semibold truncate">{user.displayName}</p>
              <p className="text-sm text-emerald-100/60 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium text-emerald-100/70 hover:text-[#ED5565] hover:bg-[#ED5565]/10 transition-all">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
