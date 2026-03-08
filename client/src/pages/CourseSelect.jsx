import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Terminal, Database, Code, Lock, ChevronRight, Cpu, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const courses = [
  {
    id: 'DSA',
    title: 'Data Structures & Algorithms',
    subtitle: 'CORE MODULE',
    tagline: 'The language machines think in.',
    desc: 'Arrays, Linked Lists, Trees, Heaps, Graphs, Dynamic Programming. The complete arsenal.',
    icon: Database,
    accent: '#00E5FF',
    accentDim: 'rgba(0,229,255,0.08)',
    accentBorder: 'rgba(0,229,255,0.2)',
    topics: ['Arrays', 'Linked Lists', 'Trees', 'Heaps', 'Graphs', 'DP'],
    problems: 78,
    difficulty: 'Advanced',
    diffColor: '#FF5C5C',
    status: 'ACTIVE',
  },
  {
    id: 'Python',
    title: 'Python Mastery',
    subtitle: 'LANGUAGE MODULE',
    tagline: 'Write code that thinks for itself.',
    desc: 'From syntax fundamentals to logic patterns. AI-assisted feedback on every submission.',
    icon: Code,
    accent: '#F59E0B',
    accentDim: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.2)',
    topics: ['Basics', 'Strings', 'Functions', 'OOP', 'File I/O', 'Patterns'],
    problems: 54,
    difficulty: 'Beginner',
    diffColor: '#00C49F',
    status: 'ACTIVE',
  },
  {
    id: 'C',
    title: 'C Programming',
    subtitle: 'SYSTEMS MODULE',
    tagline: 'Get close to the metal.',
    desc: 'Pointers, memory allocation, system calls. The foundation every engineer needs.',
    icon: Terminal,
    accent: '#8B5CF6',
    accentDim: 'rgba(139,92,246,0.08)',
    accentBorder: 'rgba(139,92,246,0.2)',
    topics: ['Pointers', 'Memory', 'Structs', 'Recursion', 'File I/O', 'Bitwise'],
    problems: 41,
    difficulty: 'Intermediate',
    diffColor: '#FFBB28',
    status: 'ACTIVE',
  },
];

const CourseSelect = () => {
  const [query,   setQuery]   = useState('');
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">

      {/* ── BACKGROUND GRID ──────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── GLOW ORBS ────────────────────────────────────── */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)' }} />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto px-6 py-16">

        {/* ── HEADER ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-[1px] bg-cyan-500" />
            <span className="text-[10px] font-black text-cyan-500 tracking-[0.35em] uppercase">Sutra AI / Select Module</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div>
              <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
                CHOOSE YOUR<br />
                <span className="text-cyan-500" style={{ WebkitTextStroke: '0px', textShadow: '0 0 40px rgba(0,229,255,0.4)' }}>
                  BATTLEGROUND
                </span>
              </h1>
              <p className="text-zinc-500 mt-4 text-sm font-medium max-w-md leading-relaxed">
                Each module is a structured path from concept to mastery. 
                AI analysis on every submission. No shortcuts.
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input
                type="text"
                placeholder="Filter modules..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* ── COURSE CARDS ─────────────────────────────────── */}
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((course, i) => {
              const Icon = course.icon;
              const isHovered = hovered === course.id;

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  onHoverStart={() => setHovered(course.id)}
                  onHoverEnd={() => setHovered(null)}
                  onClick={() => navigate(`/course/${course.id}`)}
                  className="relative cursor-pointer rounded-2xl border overflow-hidden transition-all duration-300 group"
                  style={{
                    background: isHovered ? course.accentDim : 'rgba(9,9,11,0.8)',
                    borderColor: isHovered ? course.accentBorder : 'rgba(39,39,42,1)',
                    boxShadow: isHovered ? `0 0 40px ${course.accent}12` : 'none',
                  }}
                >
                  {/* Left accent bar */}
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-[3px]"
                    animate={{ scaleY: isHovered ? 1 : 0.3, opacity: isHovered ? 1 : 0.4 }}
                    transition={{ duration: 0.3 }}
                    style={{ background: course.accent, transformOrigin: 'top' }}
                  />

                  <div className="flex items-center gap-6 p-6 pl-8">

                    {/* Icon block */}
                    <motion.div
                      animate={{ scale: isHovered ? 1.08 : 1 }}
                      transition={{ duration: 0.2 }}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border"
                      style={{
                        background: `${course.accent}12`,
                        borderColor: `${course.accent}30`,
                        color: course.accent,
                        boxShadow: isHovered ? `0 0 20px ${course.accent}20` : 'none',
                      }}
                    >
                      <Icon size={28} />
                    </motion.div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[9px] font-black tracking-[0.25em] uppercase"
                          style={{ color: course.accent }}>
                          {course.subtitle}
                        </span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded border"
                          style={{ color: course.diffColor, borderColor: `${course.diffColor}30`, background: `${course.diffColor}10` }}>
                          {course.difficulty}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-white tracking-tight">{course.title}</h2>
                      <p className="text-zinc-500 text-xs mt-0.5 italic">{course.tagline}</p>
                    </div>

                    {/* Topic pills — hidden on mobile */}
                    <div className="hidden lg:flex flex-wrap gap-1.5 max-w-xs">
                      {course.topics.map(t => (
                        <span key={t} className="text-[9px] font-bold px-2 py-1 rounded-lg bg-zinc-800/80 text-zinc-500 border border-zinc-700/50">
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex flex-col items-center gap-1 shrink-0 w-20 text-center">
                      <span className="text-2xl font-black text-white">{course.problems}</span>
                      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Problems</span>
                    </div>

                    {/* Arrow CTA */}
                    <div className="flex items-center gap-3 shrink-0">
                      <motion.div
                        animate={{ x: isHovered ? 4 : 0, opacity: isHovered ? 1 : 0.4 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                        style={{ color: course.accent }}
                      >
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase hidden lg:block">
                          Enter
                        </span>
                        <div className="w-9 h-9 rounded-xl border flex items-center justify-center"
                          style={{ borderColor: `${course.accent}30`, background: `${course.accent}08` }}>
                          <ChevronRight size={18} />
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Bottom expand on hover — description */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-8 pb-5 pl-[5.5rem]">
                          <p className="text-zinc-500 text-xs leading-relaxed border-t border-zinc-800/60 pt-4">
                            {course.desc}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-24 text-zinc-700">
              <Cpu size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-bold uppercase tracking-widest">No modules match "{query}"</p>
            </motion.div>
          )}
        </div>

        {/* ── BOTTOM STATUS BAR ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-12 flex items-center justify-between border-t border-zinc-900 pt-6"
        >
          <div className="flex items-center gap-6">
            {[
              { label: 'Modules', value: '3' },
              { label: 'Total Problems', value: '173' },
              { label: 'AI Feedback', value: 'On every submit' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{s.label}:</span>
                <span className="text-[10px] text-zinc-400 font-bold">{s.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">AI Engine Online</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default CourseSelect;