'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileText, ImageIcon, Type, Link2, ArrowRight, Cpu } from 'lucide-react';

const sources = [
  {
    href: '/host/ai-import/pdf',
    icon: FileText,
    title: 'Upload PDF',
    desc: 'Extract questions from lecture notes, textbooks, or any PDF document',
    color: 'from-red-500 to-orange-600',
    border: 'border-red-500/30 hover:border-red-500/60',
    badge: 'Most popular',
  },
  {
    href: '/host/ai-import/image',
    icon: ImageIcon,
    title: 'Upload Image',
    desc: 'OCR-powered scanning of screenshots, question papers, or handwritten notes',
    color: 'from-blue-500 to-cyan-600',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    badge: null,
  },
  {
    href: '/host/ai-import/text',
    icon: Type,
    title: 'Paste Text',
    desc: 'Copy-paste raw MCQ content and let AI structure it automatically',
    color: 'from-violet-500 to-purple-600',
    border: 'border-violet-500/30 hover:border-violet-500/60',
    badge: 'Fastest',
  },
  {
    href: '/host/ai-import/url',
    icon: Link2,
    title: 'Import URL',
    desc: 'Provide a webpage URL and AI will extract quiz content from it',
    color: 'from-emerald-500 to-teal-600',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    badge: null,
  },
];

export default function AiImportPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-yellow-500/20">
          <Cpu className="w-8 h-8 text-[#1E5136]" />
        </div>
        <h1 className="text-3xl font-black mb-2 text-white">Create Quiz with AI</h1>
        <p className="text-emerald-100/70 text-lg">Choose your source — our AI does the rest</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="grid md:grid-cols-2 gap-5">
        {sources.map((src, i) => (
          <motion.div key={src.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
            <Link href={src.href}
              className={`group relative block rounded-2xl border bg-white/5 hover:bg-white/10 p-6 transition-all duration-300 ${src.border} shadow-lg hover:shadow-xl`}>
              {src.badge && (
                <span className="absolute top-4 right-4 text-xs font-bold bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full">
                  {src.badge}
                </span>
              )}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${src.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                <src.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{src.title}</h3>
              <p className="text-emerald-100/60 text-sm leading-relaxed mb-4">{src.desc}</p>
              <div className="flex items-center gap-2 text-sm font-semibold text-yellow-400 group-hover:gap-3 transition-all">
                Get started <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-8 rounded-2xl border border-white/10 bg-[#143d27]/80 backdrop-blur-md p-5 text-center shadow-lg">
        <p className="text-emerald-100/70 text-sm">
          Powered by <span className="text-yellow-400 font-semibold">Google Gemini</span> + <span className="text-blue-300 font-semibold">PaddleOCR</span>.
          All generated quizzes require your review before publishing.
        </p>
      </motion.div>
    </div>
  );
}
