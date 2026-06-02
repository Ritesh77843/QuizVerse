'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, Play, Users, TrendingUp, Plus, ArrowRight, Clock, CheckCircle, FileEdit, Cpu } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ApiResponse, PageResponse, Quiz } from '@/types';
import { format } from 'date-fns';

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: quizzesData } = useQuery({
    queryKey: ['my-quizzes', user?.id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PageResponse<Quiz>>>('/quizzes?size=5&sort=createdAt,desc');
      return res.data.data;
    },
    enabled: !!user?.id,
  });

  const quizzes = quizzesData?.content ?? [];
  const total = quizzesData?.totalElements ?? 0;
  const published = quizzes.filter(q => q.status === 'PUBLISHED').length;

  const stats = [
    { label: 'Total Quizzes', value: total, icon: BookOpen, color: 'from-yellow-400 to-amber-500', change: '' },
    { label: 'Published', value: published, icon: CheckCircle, color: 'from-emerald-400 to-emerald-600', change: '' },
    { label: 'Total Questions', value: quizzes.reduce((a, q) => a + q.questionCount, 0), icon: TrendingUp, color: 'from-rose-400 to-red-500', change: '' },
    { label: 'AI Imports', value: 0, icon: Cpu, color: 'from-orange-400 to-amber-600', change: 'New' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">{user?.displayName ?? 'Host'}</span> 👋
        </h1>
        <p className="text-lg md:text-xl text-emerald-100/70 mt-2">Here's what's happening with your quizzes.</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {stats.map((stat, i) => (
          <motion.div key={i} variants={fadeUp}
            className="relative rounded-2xl border border-white/10 bg-white/5 p-6 overflow-hidden hover:border-yellow-400/50 transition-colors">
            <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-3xl bg-gradient-to-br ${stat.color} opacity-20`} />
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
              <stat.icon className="w-5 h-5 text-[#1E5136]" />
            </div>
            <p className="text-4xl md:text-5xl font-black mt-2 text-white">{stat.value}</p>
            <p className="text-emerald-100/70 text-base md:text-lg mt-1 font-medium">{stat.label}</p>
            {stat.change && <span className="absolute top-4 right-4 text-xs text-yellow-300 font-bold bg-yellow-400/20 px-2 py-0.5 rounded-full">{stat.change}</span>}
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="grid md:grid-cols-3 gap-4 mb-10">
        <Link href="/host/quizzes/create"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20 transition-all shadow-lg hover:shadow-yellow-500/10">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center group-hover:bg-yellow-400/30 transition-colors">
            <Plus className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <p className="font-bold text-lg md:text-xl text-white">Create Quiz</p>
            <p className="text-sm text-emerald-100/70">Build manually with editor</p>
          </div>
          <ArrowRight className="w-4 h-4 text-yellow-400 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link href="/host/ai-import"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 hover:bg-emerald-400/20 transition-all shadow-lg hover:shadow-emerald-500/10">
          <div className="w-12 h-12 rounded-xl bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center group-hover:bg-emerald-400/30 transition-colors">
            <Cpu className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <p className="font-bold text-lg md:text-xl text-white">AI Import</p>
            <p className="text-sm text-emerald-100/70">PDF, image, text, or URL</p>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-300 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link href="/join"
          className="group flex items-center gap-4 p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all shadow-lg hover:shadow-red-500/10">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center group-hover:bg-rose-500/30 transition-colors">
            <Play className="w-6 h-6 text-rose-400 fill-rose-400" />
          </div>
          <div>
            <p className="font-bold text-lg md:text-xl text-white">Join as Player</p>
            <p className="text-sm text-emerald-100/70">Test your own quiz</p>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-400 ml-auto group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Recent quizzes table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-white/10 bg-[#143d27]/80 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-xl md:text-2xl text-white">Recent Quizzes</h2>
          <Link href="/host/quizzes" className="text-base font-bold text-yellow-400 hover:text-yellow-300 transition-colors flex items-center gap-1">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-emerald-100/50 text-sm font-bold uppercase tracking-wider border-b border-white/10">
                <th className="text-left px-6 py-4">Quiz Name</th>
                <th className="text-left px-6 py-4">Questions</th>
                <th className="text-left px-6 py-4">Last Updated</th>
                <th className="text-left px-6 py-4">Status</th>
                <th className="text-left px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-white truncate max-w-48">{quiz.title}</td>
                  <td className="px-6 py-4 text-emerald-100/70 font-semibold">{quiz.questionCount}</td>
                  <td className="px-6 py-4 text-emerald-100/70 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {format(new Date(quiz.updatedAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border
                      ${quiz.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-white/10 text-emerald-100/70 border-white/10'}`}>
                      {quiz.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/host/quizzes/${quiz.id}/edit`}
                        className="text-sm font-bold text-emerald-100/70 hover:text-white transition-colors flex items-center gap-1 px-3 py-2 rounded-lg border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10">
                        <FileEdit className="w-4 h-4" /> Edit
                      </Link>
                      {quiz.status === 'PUBLISHED' && (
                        <Link href={`/host/quizzes/${quiz.id}/play`}
                          className="text-sm font-bold text-[#1E5136] hover:text-black transition-colors flex items-center gap-1 px-3 py-2 rounded-lg border border-yellow-400 bg-yellow-400 hover:bg-yellow-300 shadow-md">
                          <Play className="w-4 h-4 fill-current" /> Play
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {quizzes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-emerald-100/50 font-medium">
                    No quizzes yet.{' '}
                    <Link href="/host/quizzes/create" className="text-yellow-400 hover:text-yellow-300 font-bold">Create your first quiz →</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
