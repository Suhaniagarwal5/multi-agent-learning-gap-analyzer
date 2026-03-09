import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Code, Terminal, Database, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// IDs MUST match the "topic" field in your JSON (e.g., "DSA", "C", "Python")
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
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black italic text-white mb-6 tracking-tighter"
          >
            MASTER <span className="text-primary">TRAINING</span>
          </motion.h1>
          
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface border border-gray-800 rounded-full py-4 pl-12 pr-6 focus:border-primary focus:outline-none transition-all text-white shadow-2xl"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <motion.div 
              whileHover={{ y: -10 }}
              key={course.id}
              onClick={() => navigate(`/course/${course.id}`)}
              className="bg-surface border border-gray-800 rounded-3xl p-8 cursor-pointer group hover:border-primary/50 transition-all relative overflow-hidden"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-black mb-6 shadow-lg`}>
                {React.cloneElement(course.icon, { size: 28 })}
              </div>

              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{course.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">{course.desc}</p>

              <div className="flex items-center text-primary font-bold text-sm gap-2">
                ENTER MODULE <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.div>
          ))}
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