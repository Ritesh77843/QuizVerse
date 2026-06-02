'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Zap, Bot, Smartphone, BarChart3, ArrowRight,
  Play, Users, Trophy, ChevronRight, Globe,
  Star, Check, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const features = [
  { icon: Zap, title: 'Real-time Live Quizzes', desc: 'Broadcast questions, collect answers, and update leaderboards in milliseconds with WebSocket technology.' },
  { icon: Bot, title: 'AI Quiz Generation', desc: 'Upload a PDF, paste text, or share a URL. Our AI extracts and structures questions automatically.' },
  { icon: Smartphone, title: 'Mobile-Friendly Gameplay', desc: 'Giant touch-friendly buttons optimized for phones. Players join instantly — no app required.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'See per-question accuracy, response times, score distribution, and participation rates.' },
];

const steps = [
  { num: '01', title: 'Create or Import', desc: 'Build manually or let AI generate from PDF, text, image, or URL' },
  { num: '02', title: 'Start Live Game', desc: 'Launch a session and get a unique 6-character PIN instantly' },
  { num: '03', title: 'Players Join via PIN', desc: 'Anyone can join from any device — no registration needed' },
  { num: '04', title: 'Compete Live', desc: 'Real-time questions, countdown timer, live leaderboard' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function LandingPage() {
  const { user } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1E5136] to-[#0A2616] text-white overflow-x-hidden font-sans">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#1E5136]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Sparkles className="w-4 h-4 text-[#1E5136] fill-[#1E5136]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">QuizVerse</span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-base font-medium text-emerald-100/70">
            <Link href="#features" className="hover:text-yellow-400 transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-yellow-400 transition-colors">How It Works</Link>
            <Link href="/join" className="hover:text-yellow-400 transition-colors">Join Game</Link>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/host/dashboard"
                className="bg-[#ED5565] hover:bg-[#F14C4F] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/25">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-base font-medium text-emerald-100/70 hover:text-white transition-colors hidden md:block">Login</Link>
                <Link href="/register"
                  className="bg-[#ED5565] hover:bg-[#F14C4F] text-white text-base font-bold px-6 py-2.5 rounded-lg transition-all hover:shadow-lg hover:shadow-red-500/25">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-gradient-to-b from-transparent via-yellow-400/20 to-transparent" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-1.5 text-sm text-yellow-300 mb-8 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Google Gemini AI</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black tracking-tight leading-[1.05] mb-8 text-white">
              Create live quizzes{' '}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FBD85D] to-[#F39C12]">in seconds with AI</span>
            </motion.h1>

            {/* Sub */}
            <motion.p variants={fadeUp} className="text-xl md:text-2xl text-emerald-100/80 max-w-3xl mx-auto mb-12 leading-relaxed">
              Upload a PDF, paste text, or create manually.
              <br />
              Run Kahoot-style live games instantly — for classrooms, teams, and events.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register"
                className="group flex items-center gap-2 bg-[#ED5565] hover:bg-[#F14C4F] text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg hover:shadow-red-500/30">
                Start Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/join"
                className="flex items-center gap-2 border-2 border-yellow-400/30 hover:border-yellow-400 hover:bg-yellow-400/10 text-yellow-400 font-bold px-8 py-4 rounded-xl text-lg transition-all">
                <Play className="w-5 h-5 fill-yellow-400" />
                Join a Game
              </Link>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-14 text-base text-emerald-200/60 font-medium">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>No registration for players</span>
              </div>
              <div className="w-px h-4 bg-emerald-700" />
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-yellow-400" />
                <span>Free to start</span>
              </div>
              <div className="w-px h-4 bg-emerald-700" />
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#ED5565]" />
                <span>Real-time WebSockets</span>
              </div>
            </motion.div>
          </motion.div>

          {/* ===== ANIMATED GAMEPLAY PREVIEW ===== */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 relative"
          >
            <div className="relative mx-auto max-w-4xl">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-red-500/20 blur-3xl rounded-3xl scale-95" />
              
              {/* Main preview card */}
              <div className="relative rounded-2xl border border-white/20 bg-white overflow-hidden shadow-2xl text-zinc-900">
                {/* Toolbar */}
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-200 bg-zinc-50">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <div className="ml-4 flex-1 bg-white border border-zinc-200 rounded text-xs text-zinc-500 px-3 py-1 text-center font-medium">quizverse.io/play</div>
                </div>

                {/* Gameplay mock */}
                <div className="p-8 md:p-14">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-400">Question 3/10</span>
                      <div className="w-24 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full w-2/5 bg-yellow-400 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#ED5565]/10 border border-[#ED5565]/20 rounded-lg px-3 py-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#ED5565] animate-pulse" />
                      <span className="text-[#ED5565] font-mono font-black text-lg">18</span>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="text-3xl md:text-4xl font-black text-center mb-10 px-4 leading-tight text-[#1E5136]">
                    What does JVM stand for in Java?
                  </div>

                  {/* Options grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { color: 'bg-[#ED5565]', label: 'A', text: 'Java Virtual Machine' },
                      { color: 'bg-[#3498DB]', label: 'B', text: 'Java Variable Method' },
                      { color: 'bg-[#FBD85D]', label: 'C', text: 'Java Verified Memory', textCol: 'text-zinc-900' },
                      { color: 'bg-[#27AE60]', label: 'D', text: 'None of the Above' },
                    ].map((opt, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className={`${opt.color} rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity border-b-4 border-black/20`}
                      >
                        <span className={`w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg shrink-0 ${opt.textCol || 'text-white'}`}>
                          {opt.label}
                        </span>
                        <span className={`font-bold text-lg ${opt.textCol || 'text-white'}`}>{opt.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Live stats */}
                  <div className="flex items-center justify-center gap-6 mt-6 text-sm text-zinc-400 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>48 players</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>36 answered</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating player cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}
                className="absolute -left-16 top-16 hidden xl:flex items-center gap-2 bg-white text-zinc-900 border border-zinc-200 rounded-xl px-3 py-2 shadow-xl"
              >
                <div className="w-8 h-8 rounded-full bg-[#1E5136] flex items-center justify-center text-white text-xs font-bold">R</div>
                <div>
                  <div className="text-xs font-bold text-zinc-900">Ritesh</div>
                  <div className="text-xs font-bold text-emerald-600">+1200 pts</div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                className="absolute -right-16 top-32 hidden xl:flex items-center gap-2 bg-white text-zinc-900 border border-zinc-200 rounded-xl px-3 py-2 shadow-xl"
              >
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="text-xs font-bold text-zinc-900">#1 Aman</div>
                  <div className="text-xs font-bold text-yellow-600">5,400 pts</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-32 px-6 bg-[#0E281A]">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div className="inline-block bg-yellow-400 text-[#1E5136] font-bold text-sm uppercase tracking-widest px-4 py-1 rounded-full mb-4">Features</div>
              <h2 className="text-5xl md:text-6xl font-black mt-2">Everything you need to run great quizzes</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <motion.div key={i} variants={fadeUp}
                  className="group p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-yellow-400/50 hover:bg-white/10 transition-all duration-300 cursor-default">
                  <div className="w-16 h-16 rounded-2xl bg-[#1E5136] border border-emerald-500/30 flex items-center justify-center mb-6 group-hover:bg-yellow-400 group-hover:border-yellow-400 transition-colors">
                    <f.icon className="w-8 h-8 text-yellow-400 group-hover:text-[#1E5136]" />
                  </div>
                  <h3 className="font-bold text-xl md:text-2xl mb-3 text-white">{f.title}</h3>
                  <p className="text-emerald-100/70 text-base leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-32 px-6 relative overflow-hidden bg-gradient-to-b from-[#0E281A] to-[#1E5136]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(251,216,93,0.05),transparent_70%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div className="inline-block bg-[#ED5565] text-white font-bold text-sm uppercase tracking-widest px-4 py-1 rounded-full mb-4">How It Works</div>
              <h2 className="text-5xl md:text-6xl font-black mt-2">Up and running in 60 seconds</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="relative">
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-10 left-full w-full h-px border-t-2 border-dashed border-emerald-400/30 z-0" />
                  )}
                  <div className="relative z-10 text-center">
                    <div className="w-20 h-20 rounded-full bg-yellow-400 border-4 border-[#1E5136] flex items-center justify-center mx-auto mb-6 font-black text-3xl text-[#1E5136] shadow-xl shadow-yellow-500/20">
                      {s.num}
                    </div>
                    <h3 className="font-bold text-xl md:text-2xl mb-3">{s.title}</h3>
                    <p className="text-emerald-100/70 text-base leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-24 px-6 bg-[#1E5136]">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="relative rounded-3xl p-12 text-center overflow-hidden bg-yellow-400 text-[#1E5136] shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent_70%)] pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-4">Ready to engage your audience?</h2>
              <p className="text-[#1E5136]/80 text-lg font-bold mb-8">Start free. No credit card. No downloads.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register"
                  className="group inline-flex items-center justify-center gap-2 bg-[#ED5565] hover:bg-[#F14C4F] text-white font-black px-8 py-4 rounded-xl text-lg transition-all shadow-lg">
                  Create Your First Quiz <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/join"
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 text-[#1E5136] font-black px-8 py-4 rounded-xl text-lg transition-all shadow-lg">
                  <Play className="w-5 h-5 fill-[#1E5136]" /> Join a Game
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/10 py-12 px-6 bg-[#0E281A]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#1E5136] fill-[#1E5136]" />
            </div>
            <span className="font-bold text-xl">QuizVerse</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-emerald-100/60">
            <Link href="#" className="hover:text-yellow-400 transition-colors">Docs</Link>
            <Link href="#" className="hover:text-yellow-400 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-yellow-400 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-yellow-400 transition-colors flex items-center gap-1"><Globe className="w-4 h-4" />GitHub</Link>
          </div>
          <p className="text-sm font-medium text-emerald-100/40">© 2024 QuizVerse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
