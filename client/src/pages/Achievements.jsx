import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trophy, Star, Target, Flame, Zap, Shield, Code, Database,
  Terminal, Lock, ChevronRight, Award, TrendingUp, Clock,
  CheckCircle, Gift, Crown, Cpu, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────────────────
// PSYCHOLOGY ENGINE
//
// 1. VARIABLE REWARD   — badges have tiers (bronze/silver/gold),
//                        you never know which tier you'll hit
// 2. NEAR-MISS EFFECT  — locked badges show exactly N problems away
// 3. LOSS AVERSION     — streak counter with "at risk" warning if streak < 3
// 4. COMPLETION URGE   — progress bars start at earned%, never 0
// 5. SOCIAL PROOF      — global rank + top % display
// 6. XP + LEVEL SYSTEM — always moving toward next level
// ─────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5000];
const LEVEL_NAMES = ['Initiate', 'Coder', 'Builder', 'Engineer', 'Architect', 'Veteran', 'Expert', 'Master', 'Legend', 'Grandmaster'];

const getLevel = (pts) => {
  let lvl = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (pts >= LEVEL_THRESHOLDS[i]) lvl = i;
  }
  return lvl;
};

const getLevelProgress = (pts) => {
  const lvl = getLevel(pts);
  const curr = LEVEL_THRESHOLDS[lvl];
  const next = LEVEL_THRESHOLDS[lvl + 1] || LEVEL_THRESHOLDS[lvl];
  if (curr === next) return 100;
  return Math.round(((pts - curr) / (next - curr)) * 100);
};

// ── BADGE DEFINITIONS ───────────────────────────────────
// Each has tiers so user always has something to chase
const BADGE_GROUPS = [
  {
    group: 'Streak',
    icon: Flame,
    color: '#F97316',
    badges: [
      { id: 'streak_3',  name: 'On Fire',        desc: '3-day streak',  tier: 'bronze', threshold: 3,   type: 'streak' },
      { id: 'streak_7',  name: 'Week Warrior',   desc: '7-day streak',  tier: 'silver', threshold: 7,   type: 'streak' },
      { id: 'streak_30', name: 'Unstoppable',    desc: '30-day streak', tier: 'gold',   threshold: 30,  type: 'streak' },
    ],
  },
  {
    group: 'Problems',
    icon: Target,
    color: '#00E5FF',
    badges: [
      { id: 'solve_10',  name: 'First Blood',    desc: '10 problems',   tier: 'bronze', threshold: 10,  type: 'solved' },
      { id: 'solve_25',  name: 'Problem Slayer', desc: '25 problems',   tier: 'silver', threshold: 25,  type: 'solved' },
      { id: 'solve_50',  name: 'Half Century',   desc: '50 problems',   tier: 'gold',   threshold: 50,  type: 'solved' },
    ],
  },
  {
    group: 'DSA',
    icon: Database,
    color: '#00C49F',
    badges: [
      { id: 'dsa_5',     name: 'Array Wrangler', desc: '5 DSA solved',  tier: 'bronze', threshold: 5,   type: 'dsa' },
      { id: 'dsa_20',    name: 'Tree Climber',   desc: '20 DSA solved', tier: 'silver', threshold: 20,  type: 'dsa' },
      { id: 'dsa_40',    name: 'Graph God',      desc: '40 DSA solved', tier: 'gold',   threshold: 40,  type: 'dsa' },
    ],
  },
  {
    group: 'Speed',
    icon: Zap,
    color: '#FBBF24',
    badges: [
      { id: 'speed_easy',   name: 'Quick Draw',   desc: 'Easy < 3 min',  tier: 'bronze', threshold: 1,  type: 'speed' },
      { id: 'speed_medium', name: 'Speed Demon',  desc: 'Medium < 8 min',tier: 'silver', threshold: 1,  type: 'speed' },
      { id: 'speed_hard',   name: 'Lightning Rod',desc: 'Hard < 15 min', tier: 'gold',   threshold: 1,  type: 'speed' },
    ],
  },
  {
    group: 'No Hints',
    icon: Shield,
    color: '#8B5CF6',
    badges: [
      { id: 'pure_5',    name: 'Self Made',      desc: '5 no-hint solves',  tier: 'bronze', threshold: 5,  type: 'pure' },
      { id: 'pure_15',   name: 'Iron Mind',      desc: '15 no-hint solves', tier: 'silver', threshold: 15, type: 'pure' },
      { id: 'pure_30',   name: 'Purist',         desc: '30 no-hint solves', tier: 'gold',   threshold: 30, type: 'pure' },
    ],
  },
  {
    group: 'Points',
    icon: Star,
    color: '#EC4899',
    badges: [
      { id: 'pts_500',   name: 'Point Guard',    desc: '500 points',    tier: 'bronze', threshold: 500,  type: 'points' },
      { id: 'pts_1000',  name: 'Centurion',      desc: '1000 points',   tier: 'gold',   threshold: 1000, type: 'points' },
      { id: 'pts_2500',  name: 'Elite',          desc: '2500 points',   tier: 'gold',   threshold: 2500, type: 'points' },
    ],
  },
];

// ── MOCK STATS (replace with real API data same as Dashboard) ──
const MOCK = {
  totalSolved: 45,
  totalPoints: 1250,
  currentStreak: 7,
  longestStreak: 14,
  globalRank: 12,
  totalUsers: 340,
  hintsUsed: 23,
  pureSolves: 18,
  dsaSolved: 22,
  speedBadges: { easy: true, medium: false, hard: false },
};

// ── BADGE UNLOCK LOGIC (mock) ────────────────────────────
const getBadgeState = (badge) => {
  const { totalSolved, currentStreak, longestStreak, totalPoints, dsaSolved, pureSolves } = MOCK;

  let current = 0;
  if (badge.type === 'streak')  current = longestStreak;
  if (badge.type === 'solved')  current = totalSolved;
  if (badge.type === 'dsa')     current = dsaSolved;
  if (badge.type === 'points')  current = totalPoints;
  if (badge.type === 'pure')    current = pureSolves;
  if (badge.type === 'speed')   current = badge.id === 'speed_easy' && MOCK.speedBadges.easy ? 1 : 0;

  const unlocked = current >= badge.threshold;
  const pct = Math.min(Math.round((current / badge.threshold) * 100), 100);
  const remaining = Math.max(badge.threshold - current, 0);

  return { unlocked, pct, remaining, current };
};

// ── TIER CONFIG ──────────────────────────────────────────
const TIER = {
  bronze: { label: 'Bronze', color: '#CD7F32', glow: 'rgba(205,127,50,0.3)',  bg: 'rgba(205,127,50,0.08)' },
  silver: { label: 'Silver', color: '#C0C0C0', glow: 'rgba(192,192,192,0.3)', bg: 'rgba(192,192,192,0.08)' },
  gold:   { label: 'Gold',   color: '#FFD700', glow: 'rgba(255,215,0,0.4)',   bg: 'rgba(255,215,0,0.10)' },
};

// ─────────────────────────────────────────────────────────
// XP BAR COMPONENT
// ─────────────────────────────────────────────────────────
const XPBar = ({ points }) => {
  const level = getLevel(points);
  const pct   = getLevelProgress(points);
  const next  = LEVEL_THRESHOLDS[level + 1];
  const name  = LEVEL_NAMES[level];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-black font-black text-sm shadow-lg">
            {level}
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-tight">{name}</p>
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">Level {level}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white font-black text-sm">{points.toLocaleString()} XP</p>
          {next && <p className="text-zinc-600 text-[9px] font-bold">{(next - points).toLocaleString()} to {LEVEL_NAMES[level + 1]}</p>}
        </div>
      </div>

      {/* XP Progress bar */}
      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full relative"
          style={{ background: 'linear-gradient(90deg, #00E5FF, #8B5CF6)' }}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1.5 }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </div>
        </motion.div>
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[9px] text-zinc-700 font-bold">{pct}%</span>
        <span className="text-[9px] text-zinc-700 font-bold">Next: {LEVEL_NAMES[level + 1] || 'MAX'}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// BADGE CARD COMPONENT
// ─────────────────────────────────────────────────────────
const BadgeCard = ({ badge, groupColor, Icon }) => {
  const { unlocked, pct, remaining } = getBadgeState(badge);
  const tier = TIER[badge.tier];
  const [showPop, setShowPop] = useState(false);

  // Trigger pop animation on mount if unlocked
  useEffect(() => {
    if (unlocked) {
      const t = setTimeout(() => setShowPop(true), Math.random() * 800 + 200);
      return () => clearTimeout(t);
    }
  }, [unlocked]);

  return (
    <motion.div
      whileHover={{ y: unlocked ? -4 : -2, scale: unlocked ? 1.02 : 1.01 }}
      className="relative rounded-2xl border p-4 flex flex-col gap-3 overflow-hidden transition-all duration-200"
      style={{
        background: unlocked ? tier.bg : 'rgba(9,9,11,0.6)',
        borderColor: unlocked ? `${tier.color}35` : 'rgba(39,39,42,0.8)',
        boxShadow: unlocked && showPop ? `0 0 20px ${tier.glow}` : 'none',
      }}
    >
      {/* Locked overlay */}
      {!unlocked && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-2xl z-10 flex flex-col items-center justify-center gap-2">
          <Lock size={16} className="text-zinc-600" />
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
            {remaining} away
          </span>
        </div>
      )}

      {/* Shine effect on unlocked gold */}
      {unlocked && badge.tier === 'gold' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 4 }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent -skew-x-12"
          />
        </div>
      )}

      {/* Icon */}
      <div className="flex items-start justify-between">
        <motion.div
          animate={unlocked && showPop ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="w-11 h-11 rounded-xl flex items-center justify-center border"
          style={{
            background: unlocked ? `${tier.color}15` : 'rgba(39,39,42,0.5)',
            borderColor: unlocked ? `${tier.color}40` : 'rgba(39,39,42,1)',
            color: unlocked ? tier.color : '#3f3f46',
            boxShadow: unlocked ? `0 0 12px ${tier.glow}` : 'none',
          }}
        >
          <Icon size={20} />
        </motion.div>

        {/* Tier badge */}
        <span className="text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider"
          style={{
            color: unlocked ? tier.color : '#52525b',
            borderColor: unlocked ? `${tier.color}40` : '#27272a',
            background: unlocked ? `${tier.color}10` : 'transparent',
          }}>
          {tier.label}
        </span>
      </div>

      {/* Text */}
      <div>
        <p className="text-xs font-black text-white leading-tight">{badge.name}</p>
        <p className="text-[10px] text-zinc-600 mt-0.5">{badge.desc}</p>
      </div>

      {/* Progress bar (always visible — shows urgency even at 0%) */}
      <div className="mt-auto">
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${unlocked ? 100 : Math.max(pct, unlocked ? 100 : 5)}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="h-full rounded-full"
            style={{
              background: unlocked
                ? `linear-gradient(90deg, ${tier.color}80, ${tier.color})`
                : 'rgba(63,63,70,0.8)',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────
// STREAK DISPLAY
// ─────────────────────────────────────────────────────────
const StreakDisplay = ({ current, longest }) => {
  const atRisk = current < 3;
  const flames = Math.min(current, 7);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
      {/* Glow bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: atRisk
          ? 'radial-gradient(ellipse at 50% 120%, rgba(239,68,68,0.05) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at 50% 120%, rgba(249,115,22,0.08) 0%, transparent 70%)'
        }} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Current Streak</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-black text-white">{current}</span>
              <span className="text-zinc-500 font-bold text-sm">days</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Best</p>
            <p className="text-xl font-black text-zinc-400 mt-1">{longest}d</p>
          </div>
        </div>

        {/* Flame row — visual representation */}
        <div className="flex gap-1.5 mb-4">
          {[...Array(7)].map((_, i) => (
            <motion.div key={i}
              initial={{ scale: 0 }}
              animate={{ scale: i < flames ? 1 : 0.5, opacity: i < flames ? 1 : 0.2 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              className="flex-1 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{
                background: i < flames
                  ? i < 3 ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.35)'
                  : 'rgba(39,39,42,0.5)',
              }}
            >
              {i < flames ? '🔥' : '·'}
            </motion.div>
          ))}
        </div>

        {/* Risk warning — loss aversion psychology */}
        {atRisk && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <p className="text-[10px] text-red-400 font-bold">Streak at risk — solve today to keep it alive</p>
          </motion.div>
        )}
        {!atRisk && (
          <div className="flex items-center gap-2 bg-orange-500/8 border border-orange-500/15 rounded-xl px-3 py-2.5">
            <Flame size={12} className="text-orange-400" />
            <p className="text-[10px] text-orange-400 font-bold">Keep it going — you're on a roll!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN ACHIEVEMENTS PAGE
// ─────────────────────────────────────────────────────────
const Achievements = () => {
  const { user } = useAuth();
  const [activeGroup, setActiveGroup] = useState('All');
  const d = MOCK;

  const level   = getLevel(d.totalPoints);
  const topPct  = Math.round((d.globalRank / d.totalUsers) * 100);
  const allUnlocked = BADGE_GROUPS.flatMap(g => g.badges).filter(b => getBadgeState(b).unlocked).length;
  const totalBadges = BADGE_GROUPS.flatMap(g => g.badges).length;

  const groups = ['All', ...BADGE_GROUPS.map(g => g.group)];

  const visibleGroups = activeGroup === 'All'
    ? BADGE_GROUPS
    : BADGE_GROUPS.filter(g => g.group === activeGroup);

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── BACKGROUND ───────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 20% 0%, rgba(0,229,255,0.04) 0%, transparent 50%),
                           radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.04) 0%, transparent 50%)`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-12">

        {/* ── HEADER ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-[1px] bg-cyan-500" />
            <span className="text-[10px] font-black text-cyan-500 tracking-[0.35em] uppercase">
              {user?.displayName || 'Learner'} / Achievements
            </span>
          </div>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">
                YOUR <span className="text-cyan-500">LEGACY</span>
              </h1>
              <p className="text-zinc-600 text-xs font-bold mt-2 tracking-widest uppercase">
                {allUnlocked}/{totalBadges} badges · Top {topPct}% globally · Level {level} {LEVEL_NAMES[level]}
              </p>
            </div>
            {/* Global rank pill */}
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-5 py-2.5 rounded-full">
              <Crown size={14} className="text-yellow-400" />
              <span className="text-xs font-black text-white">#{d.globalRank}</span>
              <span className="text-[10px] text-zinc-600 font-bold">Global Rank</span>
            </div>
          </div>
        </motion.div>

        {/* ── TOP ROW: XP + STREAK + QUICK STATS ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">

          {/* XP Level bar */}
          <div className="lg:col-span-2">
            <XPBar points={d.totalPoints} />
          </div>

          {/* Badge completion */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Badge Progress</p>
              <Award size={14} className="text-cyan-500" />
            </div>
            <div>
              <p className="text-4xl font-black text-white">{allUnlocked}<span className="text-zinc-600 text-xl">/{totalBadges}</span></p>
              <div className="h-2 bg-zinc-800 rounded-full mt-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((allUnlocked / totalBadges) * 100)}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                />
              </div>
              <p className="text-[9px] text-zinc-600 font-bold mt-1.5">
                {totalBadges - allUnlocked} badges left to unlock
              </p>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Problems Solved', value: d.totalSolved,               icon: Target,    color: '#00E5FF', sub: `${Math.round((d.totalSolved/173)*100)}% of all problems` },
            { label: 'Total Points',    value: d.totalPoints.toLocaleString(), icon: Star,    color: '#FBBF24', sub: `Level ${level} · ${LEVEL_NAMES[level]}` },
            { label: 'Pure Solves',     value: d.pureSolves,                 icon: Shield,   color: '#8B5CF6', sub: 'Solved without hints' },
            { label: 'Best Streak',     value: `${d.longestStreak}d`,        icon: Flame,    color: '#F97316', sub: `Current: ${d.currentStreak} days` },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[2px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border mb-3"
                  style={{ color: s.color, background: `${s.color}12`, borderColor: `${s.color}25` }}>
                  <Icon size={15} />
                </div>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{s.label}</p>
                <p className="text-2xl font-black text-white mt-0.5">{s.value}</p>
                <p className="text-[9px] text-zinc-700 font-medium mt-0.5">{s.sub}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ── STREAK PANEL ───────────────────────────────── */}
        <div className="mb-8">
          <StreakDisplay current={d.currentStreak} longest={d.longestStreak} />
        </div>

        {/* ── BADGES SECTION ─────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <Trophy size={14} className="text-cyan-500" /> Badges
          </h2>

          {/* Filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {groups.map(g => (
              <button key={g} onClick={() => setActiveGroup(g)}
                className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                  activeGroup === g
                    ? 'bg-cyan-500 text-black'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'
                }`}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeGroup}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {visibleGroups.map(group => {
              const GroupIcon = group.icon;
              return (
                <div key={group.group}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: `${group.color}15`, color: group.color }}>
                      <GroupIcon size={12} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: group.color }}>
                      {group.group}
                    </span>
                    <div className="flex-1 h-[1px]" style={{ background: `${group.color}20` }} />
                    <span className="text-[9px] text-zinc-700 font-bold">
                      {group.badges.filter(b => getBadgeState(b).unlocked).length}/{group.badges.length} unlocked
                    </span>
                  </div>

                  {/* Badge cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {group.badges.map((badge, i) => (
                      <motion.div key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.07 }}>
                        <BadgeCard badge={badge} groupColor={group.color} Icon={group.icon} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── BOTTOM CTA ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 relative rounded-3xl overflow-hidden border border-zinc-800 p-10 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(9,9,11,1) 0%, rgba(0,229,255,0.04) 50%, rgba(139,92,246,0.06) 100%)' }}
        >
          {/* Giant bg trophy */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center pr-8 opacity-[0.03] pointer-events-none select-none">
            <Trophy size={280} />
          </div>

          <div className="relative z-10 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
              <Gift size={24} className="text-black" />
            </div>
            <h3 className="text-3xl font-black italic tracking-tighter uppercase">
              {totalBadges - allUnlocked} Badges<br />
              <span className="text-cyan-500">Still Waiting For You</span>
            </h3>
            <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
              Every problem you solve moves you up the leaderboard and closer to the next badge.
              Your next milestone is just a few lines of code away.
            </p>
            <Link to="/courses">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(0,229,255,0.2)' }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 bg-white text-black font-black px-10 py-4 rounded-full text-[11px] tracking-[0.2em] uppercase hover:bg-cyan-400 transition-all inline-flex items-center gap-3 group"
              >
                Keep Grinding
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Achievements;