import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { Search, Code, Terminal, Database, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AI_API = import.meta.env.VITE_AI_URL;

const courses = [
  {
    id: 'DSA',
    title: 'Data Structures & Algorithms',
    subtitle: 'CORE MODULE',
    tagline: 'The language machines think in.',
    desc: 'Arrays, Linked Lists, Trees, Heaps, Graphs, Dynamic Programming. The complete arsenal.',
    icon: <Database />, 
    accent: '#00E5FF',
    accentDim: 'rgba(0,229,255,0.08)',
    accentBorder: 'rgba(0,229,255,0.2)',
    topics: ['Stack', 'Deque', 'Binary Search', 'Heap', 'Graph', 'Linked List'],
    problems: 60,
    difficulty: 'Advanced',
    diffColor: '#FF5C5C',
    status: 'ACTIVE',
    color: 'from-cyan-400 to-blue-500', 
  },
  {
    id: 'Python',
    title: 'Python Mastery',
    subtitle: 'LANGUAGE MODULE',
    tagline: 'Write code that thinks for itself.',
    desc: 'From syntax fundamentals to logic patterns. AI-assisted feedback on every submission.',
    icon: <Code />, 
    accent: '#F59E0B',
    accentDim: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.2)',
    topics: ['List', 'String', 'Function', 'Dictionary', 'Regex'],
    problems: 24,
    difficulty: 'Beginner',
    diffColor: '#00C49F',
    status: 'ACTIVE',
    color: 'from-yellow-400 to-orange-500', 
  },
  {
    id: 'C',
    title: 'C Programming',
    subtitle: 'SYSTEMS MODULE',
    tagline: 'Get close to the metal.',
    desc: 'Pointers, memory allocation, system calls. The foundation every engineer needs.',
    icon: <Terminal />, 
    accent: '#8B5CF6',
    accentDim: 'rgba(139,92,246,0.08)',
    accentBorder: 'rgba(139,92,246,0.2)',
    topics: ['Array', 'Pointer', 'Recursion'],
    problems: 15,
    difficulty: 'Intermediate',
    diffColor: '#FFBB28',
    status: 'ACTIVE',
    color: 'from-blue-400 to-purple-500', 
  },
];

const CourseSelect = () => {
  const [query, setQuery] = useState('');
  const [matchedTitles, setMatchedTitles] = useState(courses.map(c => c.title));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // API CALL TO PYTHON BACKEND FOR SMART SEARCH
  useEffect(() => {
    const fetchMatches = async () => {
      if (!query) {
        setMatchedTitles(courses.map(c => c.title));
        return;
      }
      setLoading(true);
      try {
        const res = await axios.post(`${AI_API}/api/match-strings`, {
          query: query,
          targets: courses.map(c => c.title) 
        });
        setMatchedTitles(res.data.results || []);
      } catch (err) {
        console.error("AI Server Error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchMatches, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const displayCourses = courses.filter(c => matchedTitles.includes(c.title));

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto mt-10">
        
        {/* HEADER SECTION (Like Screenshot) */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 border-b border-zinc-900 pb-8">
          <div className="max-w-xl">
            <h2 className="text-[10px] text-zinc-500 tracking-[0.2em] uppercase mb-3 font-bold">
              Sutra AI / Select Module
            </h2>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white mb-4">
              CHOOSE YOUR <br/><span className="text-cyan-500">BATTLEGROUND</span>
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Each module is a structured path from concept to mastery. AI analysis on every submission. No shortcuts.
            </p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className={`absolute left-4 top-3.5 ${loading ? "text-cyan-500 animate-pulse" : "text-zinc-500"}`} size={18} />
            <input 
              type="text" 
              placeholder="Filter modules..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-6 focus:border-cyan-500 focus:outline-none transition-all text-white text-sm"
            />
          </div>
        </header>

        {/* LIST SECTION (Horizontal Layout like Screenshot) */}
        <div className="flex flex-col gap-4">
          {displayCourses.map((course, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={course.id}
              onClick={() => navigate(`/course/${course.id}`)}
              className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl hover:bg-zinc-900/80 hover:border-zinc-700 transition-all cursor-pointer gap-6"
            >
              
              {/* Left: Icon & Text Info */}
              <div className="flex items-center gap-6 flex-1">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center border transition-colors"
                  style={{ backgroundColor: course.accentDim, color: course.accent, borderColor: course.accentBorder }}
                >
                  {React.cloneElement(course.icon, { size: 24 })}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span 
                      className="text-[10px] font-bold tracking-widest uppercase" 
                      style={{ color: course.accent }}
                    >
                      {course.subtitle}
                    </span>
                    <span 
                      className="text-[9px] px-2 py-0.5 rounded font-bold uppercase" 
                      style={{ color: course.diffColor, borderColor: `${course.diffColor}40`, backgroundColor: `${course.diffColor}10`, borderWidth: '1px' }}
                    >
                      {course.difficulty}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-white transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-1">{course.tagline}</p>
                </div>
              </div>

              {/* Middle: Topic Pills (Hidden on small screens) */}
              <div className="hidden lg:flex items-center gap-2 flex-wrap flex-1 justify-center">
                {course.topics.slice(0, 5).map((topic, i) => (
                  <span key={i} className="text-[10px] bg-zinc-800/50 text-zinc-400 border border-zinc-800 px-3 py-1.5 rounded-full font-medium">
                    {topic}
                  </span>
                ))}
              </div>

              {/* Right: Problem Count & Enter Button */}
              <div className="flex items-center gap-8 justify-end min-w-[150px]">
                <div className="text-center md:text-right">
                  <div className="text-2xl font-black text-white leading-none mb-1">{course.problems}</div>
                  <div className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">Problems</div>
                </div>
                <div 
                  className="text-xs font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform" 
                  style={{ color: course.accent }}
                >
                  ENTER <ArrowRight size={14} />
                </div>
              </div>

            </motion.div>
          ))}
          {displayCourses.length === 0 && !loading && (
             <div className="text-center py-20 text-zinc-500 border border-zinc-800/50 rounded-2xl bg-zinc-900/20">
               No battlegrounds match your AI query.
             </div>
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
              { label: 'Total Problems', value: '99' },
              { label: 'AI Feedback', value: 'On every submit' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 hidden md:flex">
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