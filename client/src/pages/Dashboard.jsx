import React, { useState, useEffect } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';
import {
  ChevronLeft, ChevronRight, Flame, Trophy, Target,
  Zap, TrendingUp, Clock, CheckCircle, BookOpen,
  Award, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RatingCard from '../components/RatingCard';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// ── Read from .env ────────────────────────────────────────
const NODE_URL = import.meta.env.VITE_NODE_URL || 'http://localhost:5000';

// ─────────────────────────────────────────────────────────
// MOCK DATA — realistic, shown when:
//   (a) user is not logged in, OR
//   (b) server is offline, OR
//   (c) user has zero real activity yet
// Replace nothing — this is the fallback.
// Real data from API will automatically override this.
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// MOCK DATA — Corrected to 99 problems across 17 categories
// ─────────────────────────────────────────────────────────
const MOCK_DATA = {
  stats: {
    totalSolved: 45, currentStreak: 7, longestStreak: 14,
    globalRank: 12, totalPoints: 1250, hintsUsed: 23,
    avgSolveTime: 18, completionRate: 45, // Updated for 99 total
  },
  // Difficulty totals (Easy: 39, Medium: 38, Hard: 22)[cite: 3]
  difficulty: [
    { name: 'Easy',   solved: 22, total: 39, color: '#00C49F' },
    { name: 'Medium', solved: 18, total: 38, color: '#FFBB28' },
    { name: 'Hard',   solved: 5,  total: 22, color: '#FF5C5C' },
  ],
  skillRadar: [
    { subject: 'Logic',    score: 82, fullMark: 100 },
    { subject: 'Syntax',   score: 68, fullMark: 100 },
    { subject: 'Optim.',   score: 57, fullMark: 100 },
    { subject: 'Debug',    score: 74, fullMark: 100 },
    { subject: 'Patterns', score: 63, fullMark: 100 },
    { subject: 'Analysis', score: 49, fullMark: 100 },
  ],
  weeklyActivity: [
    { week: 'W1 Jan', solved: 4,  hints: 8  },
    { week: 'W2 Jan', solved: 7,  hints: 5  },
    { week: 'W3 Jan', solved: 2,  hints: 3  },
    { week: 'W4 Jan', solved: 9,  hints: 11 },
    { week: 'W1 Feb', solved: 6,  hints: 4  },
    { week: 'W2 Feb', solved: 11, hints: 7  },
    { week: 'W3 Feb', solved: 3,  hints: 2  },
    { week: 'W4 Feb', solved: 8,  hints: 6  },
  ],
  // Categorized by Topic: DSA (60), Python (24), C (15)
  categoryProgress: [
    // DSA — 60 Problems (9 categories)
    { name: 'Stack',           solved: 5,  total: 12, course: 'DSA'    },
    { name: 'Deque',           solved: 4,  total: 10, course: 'DSA'    },
    { name: 'Binary Search',   solved: 3,  total: 7,  course: 'DSA'    },
    { name: 'Design',          solved: 2,  total: 6,  course: 'DSA'    },
    { name: 'Greedy',          solved: 2,  total: 6,  course: 'DSA'    },
    { name: 'Hashing',         solved: 3,  total: 6,  course: 'DSA'    },
    { name: 'Heap',            solved: 2,  total: 6,  course: 'DSA'    },
    { name: 'Linked List',     solved: 2,  total: 5,  course: 'DSA'    },
    { name: 'Graph',           solved: 1,  total: 2,  course: 'DSA'    },
    // Python — 24 Problems (5 categories)
    { name: 'Python - List',   solved: 4,  total: 6,  course: 'Python' },
    { name: 'Python - Dict',   solved: 3,  total: 5,  course: 'Python' },
    { name: 'Python - String', solved: 2,  total: 5,  course: 'Python' },
    { name: 'Python - Func',   solved: 2,  total: 4,  course: 'Python' },
    { name: 'Python - Regex',  solved: 1,  total: 4,  course: 'Python' },
    // C — 15 Problems (3 categories)
    { name: 'C - Array',       solved: 3,  total: 5,  course: 'C'      },
    { name: 'C - Pointer',     solved: 2,  total: 5,  course: 'C'      },
    { name: 'C - Recursion',   solved: 2,  total: 5,  course: 'C'      },
  ],
  recentActivity: [
    { id: 1, title: 'Kth Largest Element',   difficulty: 'Hard',   course: 'DSA',    time: '22 min', hintsUsed: 2, status: 'solved'    },
    { id: 2, title: 'Reverse a Linked List', difficulty: 'Easy',   course: 'DSA',    time: '8 min',  hintsUsed: 0, status: 'solved'    },
    { id: 3, title: 'Two Sum Variants',      difficulty: 'Medium', course: 'DSA',    time: '31 min', hintsUsed: 3, status: 'solved'    },
    { id: 4, title: 'String Compression',    difficulty: 'Medium', course: 'Python', time: '14 min', hintsUsed: 1, status: 'solved'    },
    { id: 5, title: 'Pointer Arithmetic',    difficulty: 'Hard',   course: 'C',      time: '—',      hintsUsed: 4, status: 'attempted' },
  ],
  leaderboard: [
    { rank: 1,  name: 'Arjun S.',  points: 2840, streak: 21, avatar: 'A' },
    { rank: 2,  name: 'Priya M.',  points: 2610, streak: 18, avatar: 'P' },
    { rank: 3,  name: 'Rohan K.',  points: 2390, streak: 15, avatar: 'R' },
    { rank: '',  name: '',          points: 0,    streak: 0,  avatar: ''  },
    { rank: 12, name: 'You',        points: 1250, streak: 7,  avatar: '★', isUser: true },
    { rank: 13, name: 'Sneha T.',  points: 1190, streak: 5,  avatar: 'S' },
  ],
  rating: {
    rating: 420,
    rank: 'Engineer',
    subScores: {
      proficiency:  58,
      efficiency:   47,
      consistency:  62,
      breadth:      35,
      independence: 40,
    },
    weights: {
      proficiency:  0.35,
      efficiency:   0.25,
      consistency:  0.20,
      breadth:      0.12,
      independence: 0.08,
    },
    signals: {
      totalSolved: 45, easySolved: 22, mediumSolved: 18, hardSolved: 5,
      hintsUsed: 23, avgSolveTime: 18, currentStreak: 7, longestStreak: 14,
      uniqueCategories: 6, uniqueCourses: 2, pureSolves: 18,
    },
  },
  heatmapData: (() => {
    const d = {};
    const today = new Date();
    for (let i = 0; i < 180; i++) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const key = day.toISOString().split('T')[0];
      const activity = ((i * 7) % 10);
      d[key] = activity > 6 ? (activity > 8 ? 3 : 2) : activity > 4 ? 1 : 0;
    }
    return d;
  })(),
};

// ─────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────

const Skeleton = ({ className }) => (
  <div className={`bg-zinc-800/50 rounded-xl animate-pulse ${className}`} />
);

const EmptyPrompt = ({ message = 'Solve a problem to see data here.' }) => (
  <div className="text-center py-12">
    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">{message}</p>
  </div>
);

const SectionCard = ({ title, icon, children, className = '' }) => (
  <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 ${className}`}>
    <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-5">
      <span className="text-cyan-500">{icon}</span> {title}
    </h3>
    {children}
  </div>
);

const StatCard = ({ icon, label, value, sub, accentColor = '#00E5FF' }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden h-full"
  >
    {/* top accent line */}
    <div className="absolute top-0 left-0 w-full h-[2px]"
      style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />
    <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-700"
      style={{ color: accentColor, background: `${accentColor}18` }}>
      {icon}
    </div>
    <div>
      <p className="text-zinc-500 text-[10px] font-bold tracking-[0.18em] uppercase">{label}</p>
      <p className="text-3xl font-black tracking-tighter text-white mt-1">{value}</p>
      {sub && <p className="text-zinc-600 text-[11px] mt-1">{sub}</p>}
    </div>
  </motion.div>
);

const DifficultyBadge = ({ level }) => {
  if (level === 'Easy')   return <span className="text-[9px] font-black px-2 py-0.5 rounded border border-green-500/30 text-green-400 bg-green-500/5 uppercase tracking-wider">Easy</span>;
  if (level === 'Medium') return <span className="text-[9px] font-black px-2 py-0.5 rounded border border-yellow-500/30 text-yellow-400 bg-yellow-500/5 uppercase tracking-wider">Medium</span>;
  if (level === 'Hard')   return <span className="text-[9px] font-black px-2 py-0.5 rounded border border-red-500/30 text-red-400 bg-red-500/5 uppercase tracking-wider">Hard</span>;
  return null;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[10px] text-zinc-500 font-bold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[11px] font-bold" style={{ color: p.color || '#00E5FF' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// HEATMAP
// ─────────────────────────────────────────────────────────
const ActivityHeatmap = ({ heatmapData = {} }) => {
  const [offset, setOffset] = useState(0);

  const levelColor = (n) => {
    if (n >= 3) return 'bg-cyan-400';
    if (n === 2) return 'bg-cyan-500/60';
    if (n === 1) return 'bg-cyan-500/25';
    return 'bg-zinc-800/60';
  };

  const months = [];
  // CHANGED: We now loop for 12 months instead of 4 (offset + 11 instead of offset + 3)
  const monthsToShow = 12; 
  
  for (let m = offset + (monthsToShow - 1); m >= offset; m--) {
    const ref = new Date();
    ref.setDate(1);
    ref.setMonth(ref.getMonth() - m);
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const label = ref.toLocaleString('default', { month: 'short', year: '2-digit' });
    const cells = [];
    for (let d = 1; d <= days; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ key, count: heatmapData[key] || 0 });
    }
    months.push({ label, cells });
  }

  return (
    <SectionCard title="Consistency Heatmap" icon={<Flame size={14} />}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Less</span>
          {[0, 1, 2, 3].map(n => <div key={n} className={`w-2.5 h-2.5 rounded-[3px] ${levelColor(n)}`} />)}
          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">More</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setOffset(o => o + 1)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => setOffset(o => Math.max(0, o - 1))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      
      {/* The scrollable container */}
      <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {months.map(({ label, cells }) => (
          <div key={label} className="flex flex-col gap-1.5 shrink-0">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
            <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
              {cells.map(({ key, count }) => (
                <div key={key} title={`${key}: ${count} solved`}
                  className={`w-[11px] h-[11px] rounded-[2px] cursor-pointer hover:scale-125 transition-transform ${levelColor(count)}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};

// ─────────────────────────────────────────────────────────
// CATEGORY PROGRESS
// ─────────────────────────────────────────────────────────
const CategoryProgress = ({ data = [] }) => (
  <SectionCard title="Category Progress" icon={<BookOpen size={14} />}>
    {!data.length ? <EmptyPrompt /> : (
      <div className="space-y-4">
        {data.map(cat => {
          const pct = cat.total > 0 ? Math.round((cat.solved / cat.total) * 100) : 0;
          const color = cat.course === 'DSA' ? '#00E5FF' : cat.course === 'Python' ? '#F59E0B' : '#8B5CF6';
          return (
            <div key={cat.name}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                    style={{ color, background: `${color}18`, border: `1px solid ${color}35` }}>
                    {cat.course}
                  </span>
                  <span className="text-xs font-semibold text-zinc-300">{cat.name}</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-500">{cat.solved}/{cat.total}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}70, ${color})` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    )}
  </SectionCard>
);

// ─────────────────────────────────────────────────────────
// RECENT ACTIVITY
// ─────────────────────────────────────────────────────────
const RecentActivity = ({ data = [] }) => (
  <SectionCard title="Recent Activity" icon={<Clock size={14} />} className="lg:col-span-2">
    {!data.length ? <EmptyPrompt /> : (
      <div className="divide-y divide-zinc-800/50">
        {data.map((item, i) => (
          <motion.div key={item.id || i}
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex items-center justify-between py-3 group">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                item.status === 'solved'
                  ? 'border-green-500/30 bg-green-500/5 text-green-400'
                  : 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400'
              }`}>
                {item.status === 'solved' ? <CheckCircle size={14} /> : <Zap size={14} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors leading-tight">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">{item.course}</span>
                  {item.hintsUsed > 0 && (
                    <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                      <Zap size={8} className="text-yellow-600" />{item.hintsUsed} hints
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] font-mono text-zinc-600">{item.time}</span>
              <DifficultyBadge level={item.difficulty} />
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </SectionCard>
);

// ─────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────
const Leaderboard = ({ data = [] }) => (
  <SectionCard title="Global Leaderboard" icon={<Trophy size={14} />}>
    {!data.length ? <EmptyPrompt message="No leaderboard data yet." /> : (
      <div className="space-y-1.5">
        {data.map((entry, i) => {
          // Spacer row
          if (!entry.name) return (
            <div key={`gap-${i}`} className="text-center text-zinc-700 text-xs py-0.5 tracking-widest">• • •</div>
          );
          // Rank badge color
          const rankClass =
            entry.rank === 1 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' :
            entry.rank === 2 ? 'text-zinc-300 bg-zinc-400/10 border-zinc-400/30' :
            entry.rank === 3 ? 'text-orange-400 bg-orange-400/10 border-orange-400/30' :
            'text-zinc-600 bg-zinc-800/50 border-zinc-700/50';

          return (
            <motion.div key={`${entry.rank}-${i}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                entry.isUser
                  ? 'bg-cyan-500/10 border border-cyan-500/20'
                  : 'hover:bg-zinc-800/40'
              }`}>
              <span className={`text-[10px] font-black w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${rankClass}`}>
                {entry.rank}
              </span>
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-black text-cyan-400 shrink-0">
                {entry.avatar}
              </div>
              <span className={`text-xs font-bold flex-1 min-w-0 truncate ${entry.isUser ? 'text-cyan-400' : 'text-zinc-300'}`}>
                {entry.name}
                {entry.isUser && <span className="text-[9px] text-cyan-600 ml-1">(you)</span>}
              </span>
              <div className="text-right shrink-0">
                <p className="text-[11px] font-black text-zinc-300">{(entry.points || 0).toLocaleString()}</p>
                {entry.streak > 0 && (
                  <p className="text-[9px] text-orange-400 flex items-center gap-0.5 justify-end">
                    <Flame size={8} />{entry.streak}d
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    )}
  </SectionCard>
);

// ─────────────────────────────────────────────────────────
// MAIN DASHBOARD
// ─────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  // NOTE: We do NOT use `loading` from AuthContext here because
  // AuthContext already blocks rendering children until Firebase
  // is ready (line: {!loading && children} in AuthProvider).
  // So by the time Dashboard mounts, auth is 100% resolved.

  const [data,      setData]      = useState(MOCK_DATA); // start with mock
  const [fetching,  setFetching]  = useState(false);
  const [isReal,    setIsReal]    = useState(false);     // is data from API?
  const [error,     setError]     = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // No user → keep showing mock data (demo mode)
    if (!user) return;

    // User exists → try to fetch real data
    const load = async () => {
      setFetching(true);
      setError(null);
      try {
        const res = await axios.get(`${NODE_URL}/api/dashboard/${user.uid}`);
        setData(res.data);
        setIsReal(true);
      } catch (err) {
        // Server down or error → keep mock data, show warning
        setError('Server offline — showing demo data');
        setIsReal(false);
      } finally {
        setFetching(false);
      }
    };

    load();
  }, [user]);

  const tabs = ['overview', 'skills', 'activity', 'rating'];

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── STICKY HEADER ──────────────────────────────── */}
      <div className="border-b border-zinc-800/70 bg-zinc-950/80 backdrop-blur-md sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">
              PERFORMANCE <span className="text-cyan-500">HQ</span>
            </h1>
            <p className="text-zinc-600 text-[10px] font-bold tracking-[0.2em] uppercase mt-0.5">
              {user?.displayName || 'Demo Mode'} · {data.stats.totalSolved} problems solved
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            {fetching && (
              <span className="text-[10px] text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-3 py-1.5 rounded-full font-bold animate-pulse">
                Loading your data...
              </span>
            )}
            {error && (
              <span className="text-[10px] text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-full font-bold">
                ⚠ {error}
              </span>
            )}
            {isReal && !fetching && (
              <span className="text-[10px] text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1.5 rounded-full font-bold">
                ✓ Live data
              </span>
            )}

            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                    activeTab === tab ? 'bg-cyan-500 text-black' : 'text-zinc-500 hover:text-white'
                  }`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── PRIMARY STAT CARDS ───────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={<Target size={18} />}  label="Total Solved"   value={data.stats.totalSolved}                        sub={`${data.stats.completionRate}% completion`}      accentColor="#00E5FF" />
          <StatCard icon={<Flame size={18} />}   label="Current Streak" value={`${data.stats.currentStreak}d`}                sub={`Best: ${data.stats.longestStreak} days`}         accentColor="#F97316" />
          <StatCard icon={<Trophy size={18} />}  label="Global Rank"    value={`#${data.stats.globalRank}`}                   sub="Based on total points"                            accentColor="#FBBF24" />
          <StatCard icon={<Star size={18} />}    label="Total Points"   value={(data.stats.totalPoints || 0).toLocaleString()} sub="Easy ×10 · Med ×20 · Hard ×40"                  accentColor="#A855F7" />
          <StatCard
  icon={<TrendingUp size={18} />}
  label="Your Rating"
  value={data.rating?.rating ?? '—'}
  sub={data.rating?.rank ?? 'Solve problems to get rated'}
  accentColor="#EF9F27"
/>
        </div>

        {/* ── SECONDARY STATS ──────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-green-500/20 bg-green-500/10 text-green-400 shrink-0"><TrendingUp size={16} /></div>
            <div><p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">Completion</p><p className="text-xl font-black text-white">{data.stats.completionRate}%</p></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-blue-500/20 bg-blue-500/10 text-blue-400 shrink-0"><Clock size={16} /></div>
            <div><p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">Avg Solve</p><p className="text-xl font-black text-white">{data.stats.avgSolveTime > 0 ? `${data.stats.avgSolveTime}m` : '—'}</p></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 shrink-0"><Zap size={16} /></div>
            <div><p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">Hints Used</p><p className="text-xl font-black text-white">{data.stats.hintsUsed}</p></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-purple-500/20 bg-purple-500/10 text-purple-400 shrink-0"><Award size={16} /></div>
            <div><p className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase">Best Streak</p><p className="text-xl font-black text-white">{data.stats.longestStreak}d</p></div>
          </div>
        </div>

        {/* ── HEATMAP ──────────────────────────────────── */}
        <ActivityHeatmap heatmapData={data.heatmapData} />

        {/* ── TABS ─────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {activeTab === 'overview' && (
            <motion.div key="overview"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-5">

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Difficulty donut */}
                <SectionCard title="Difficulty Split" icon={<Target size={14} />}>
                  <div className="w-full h-40">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={data.difficulty} innerRadius={48} outerRadius={68}
                          paddingAngle={4} dataKey="solved" startAngle={90} endAngle={-270}>
                          {data.difficulty.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2.5 mt-3">
                    {data.difficulty.map(d => (
                      <div key={d.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-xs text-zinc-400 font-semibold">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${Math.min((d.solved / d.total) * 100, 100)}%`, background: d.color }} />
                          </div>
                          <span className="text-[11px] font-bold text-zinc-500 w-10 text-right">{d.solved}/{d.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Weekly bar */}
                <SectionCard title="Weekly Activity" icon={<TrendingUp size={14} />}>
                  <div className="h-52">
                    <ResponsiveContainer>
                      <BarChart data={data.weeklyActivity} barGap={3} barCategoryGap="35%">
                        <XAxis dataKey="week" tick={{ fill: '#52525b', fontSize: 8 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} width={18} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Bar dataKey="solved" name="Solved" fill="#00E5FF" radius={[3, 3, 0, 0]} maxBarSize={14} />
                        <Bar dataKey="hints"  name="Hints"  fill="#3f3f46" radius={[3, 3, 0, 0]} maxBarSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>

                <Leaderboard data={data.leaderboard} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <RecentActivity data={data.recentActivity} />
                <CategoryProgress data={data.categoryProgress} />
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div key="skills"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                <SectionCard title="Skill Radar" icon={<Zap size={14} />}>
                  <div className="h-72">
                    <ResponsiveContainer>
                      <RadarChart 
                        cx="50%" 
                        cy="50%" 
                        outerRadius="78%" 
                        data={data.skillRadar && data.skillRadar.length > 0 ? data.skillRadar : MOCK_DATA.skillRadar}
                      >
                        <PolarGrid stroke="#27272a" />
                        <PolarAngleAxis dataKey="subject"
                          tick={{ fill: '#71717a', fontSize: 11, fontWeight: 700 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="score"
                          stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.12} strokeWidth={2} />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {data.skillRadar.map(s => (
                      <div key={s.subject} className="bg-zinc-800/40 rounded-xl p-2.5 text-center">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{s.subject}</p>
                        <p className="text-xl font-black text-cyan-400 mt-0.5">{s.score}</p>
                        <div className="h-1 bg-zinc-700 rounded-full mt-1.5 overflow-hidden">
                          <motion.div className="h-full bg-cyan-500 rounded-full"
                            initial={{ width: 0 }} animate={{ width: `${s.score}%` }}
                            transition={{ duration: 1, delay: 0.3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <CategoryProgress data={data.categoryProgress} />
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div key="activity"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                <SectionCard title="Solve + Hints Trend" icon={<TrendingUp size={14} />} className="lg:col-span-2">
                  <div className="h-52">
                    <ResponsiveContainer>
                      <AreaChart data={data.weeklyActivity}>
                        <defs>
                          <linearGradient id="gSolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#00E5FF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gHints" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="week" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} width={18} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="solved" name="Solved" stroke="#00E5FF" fill="url(#gSolved)" strokeWidth={2} />
                        <Area type="monotone" dataKey="hints"  name="Hints"  stroke="#F59E0B" fill="url(#gHints)"  strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>

                <RecentActivity data={data.recentActivity} />
                <Leaderboard data={data.leaderboard} />
              </div>
            </motion.div>
          )}
          {activeTab === 'rating' && (
            <motion.div key="rating"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="space-y-5">
 
              {/* Full rating card */}
              <RatingCard rating={data.rating} />
 
              {/* How the rating works — breakdown table */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-5">
                  <span className="text-cyan-500"><TrendingUp size={14} /></span> How your rating is calculated
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Proficiency',  weight: '35%', desc: 'Easy×10 + Medium×25 + Hard×50 pts, minus hint penalty',  score: data.rating?.subScores?.proficiency  ?? 0 },
                    { label: 'Efficiency',   weight: '25%', desc: 'Speed vs difficulty baseline, combined with hint ratio',  score: data.rating?.subScores?.efficiency   ?? 0 },
                    { label: 'Consistency',  weight: '20%', desc: 'Current streak + all-time longest streak',                score: data.rating?.subScores?.consistency  ?? 0 },
                    { label: 'Breadth',      weight: '12%', desc: 'Unique categories (60%) + unique courses (40%)',          score: data.rating?.subScores?.breadth      ?? 0 },
                    { label: 'Independence', weight: '8%',  desc: 'Ratio of problems solved without using any hints',       score: data.rating?.subScores?.independence ?? 0 },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-4 py-2 border-b border-zinc-800/60 last:border-0">
                      <div className="w-28 shrink-0">
                        <p className="text-xs font-bold text-zinc-200">{row.label}</p>
                        <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">{row.weight} weight</p>
                      </div>
                      <p className="text-[11px] text-zinc-500 flex-1">{row.desc}</p>
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-cyan-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${row.score}%` }}
                            transition={{ duration: 1, delay: 0.1 }}
                          />
                        </div>
                        <span className="text-xs font-black text-zinc-300 w-8 text-right">{row.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-700 mt-4 text-center">
                  Rating recalculates each time you load the dashboard · Stored in database
                </p>
              </div>
 
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default Dashboard;