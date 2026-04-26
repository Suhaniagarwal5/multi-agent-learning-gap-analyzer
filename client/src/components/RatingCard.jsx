// client/src/components/RatingCard.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Flame, BookOpen, Shield } from 'lucide-react';

// ── Config ──────────────────────────────────────────────────
const RANK_COLORS = {
  Newcomer:    { color: '#888780', glow: 'rgba(136,135,128,0.2)'  },
  Learner:     { color: '#5DCAA5', glow: 'rgba(93,202,165,0.2)'   },
  Coder:       { color: '#00E5FF', glow: 'rgba(0,229,255,0.2)'    },
  Builder:     { color: '#3B8BD4', glow: 'rgba(59,139,212,0.2)'   },
  Engineer:    { color: '#7F77DD', glow: 'rgba(127,119,221,0.25)' },
  Architect:   { color: '#EF9F27', glow: 'rgba(239,159,39,0.25)'  },
  Veteran:     { color: '#D85A30', glow: 'rgba(216,90,48,0.25)'   },
  Expert:      { color: '#D4537E', glow: 'rgba(212,83,126,0.25)'  },
  Master:      { color: '#E24B4A', glow: 'rgba(226,75,74,0.3)'    },
  Grandmaster: { color: '#FFD700', glow: 'rgba(255,215,0,0.35)'   },
};

const SUB_SCORE_META = [
  { key: 'proficiency',  label: 'Proficiency',  icon: TrendingUp, weight: '35%', tip: 'Weighted by difficulty (Hard×5 > Easy×1)'       },
  { key: 'efficiency',   label: 'Efficiency',   icon: Zap,        weight: '25%', tip: 'Speed + low hint usage'                         },
  { key: 'consistency',  label: 'Consistency',  icon: Flame,      weight: '20%', tip: 'Daily streaks — current & longest'              },
  { key: 'breadth',      label: 'Breadth',      icon: BookOpen,   weight: '12%', tip: 'Variety of topics and courses'                  },
  { key: 'independence', label: 'Independence', icon: Shield,     weight: '8%',  tip: 'Problems solved with zero hints'                },
];

// ── Animated radial dial ────────────────────────────────────
function RatingDial({ rating, rank }) {
  const rankCfg = RANK_COLORS[rank] || RANK_COLORS.Newcomer;
  const radius  = 72;
  const stroke  = 8;
  const cx = 90;
  const cy = 90;
  const circ = 2 * Math.PI * radius;
  // We use 75% of the full circle (270°) for the arc
  const arcFrac  = 0.75;
  const dashFull = circ * arcFrac;
  const dashFill = (rating / 1000) * dashFull;

  // Rotate so the arc starts at bottom-left (225°)
  const rotation = 135;

  return (
    <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="var(--color-border-tertiary)"
          strokeWidth={stroke}
          strokeDasharray={`${dashFull} ${circ - dashFull}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
        {/* Fill — animated */}
        <motion.circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={rankCfg.color}
          strokeWidth={stroke}
          strokeDasharray={`${dashFill} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${cx} ${cy})`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dashFill} ${circ}` }}
          transition={{ duration: 1.6, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2
      }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ fontSize: 34, fontWeight: 500, color: rankCfg.color, lineHeight: 1 }}
        >
          {rating}
        </motion.span>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', letterSpacing: '0.12em' }}>
          / 1000
        </span>
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: rankCfg.color,
          marginTop: 2,
          letterSpacing: '0.06em'
        }}>
          {rank}
        </span>
      </div>
    </div>
  );
}

// ── Sub-score bar ───────────────────────────────────────────
function SubScoreBar({ meta, score }) {
  const Icon = meta.icon;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={12} style={{ color: 'var(--color-text-secondary)' }} />
          <span style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 500 }}>
            {meta.label}
          </span>
          <span style={{
            fontSize: 10, color: 'var(--color-text-tertiary)',
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 4, padding: '1px 5px'
          }}>
            {meta.weight}
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {score}
        </span>
      </div>
      {/* Bar track */}
      <div style={{
        height: 5, borderRadius: 3,
        background: 'var(--color-background-tertiary)',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          style={{
            height: '100%', borderRadius: 3,
            background: score >= 70
              ? 'var(--color-text-success)'
              : score >= 40
              ? '#EF9F27'
              : 'var(--color-text-danger)',
          }}
        />
      </div>
      {/* Tooltip hint */}
      <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{meta.tip}</span>
    </div>
  );
}

// ── Main RatingCard ─────────────────────────────────────────
export default function RatingCard({ rating: ratingData }) {
  if (!ratingData) return null;

  const { rating = 0, rank = 'Newcomer', subScores = {}, weights = {} } = ratingData;
  const rankCfg = RANK_COLORS[rank] || RANK_COLORS.Newcomer;

  // What to improve — find lowest sub-score
  const lowest = [...SUB_SCORE_META].sort(
    (a, b) => (subScores[a.key] || 0) - (subScores[b.key] || 0)
  )[0];

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '1.25rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle rank glow in top-right */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 200, height: 200, borderRadius: '50%',
        background: rankCfg.glow,
        transform: 'translate(40%, -40%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <p style={{
        fontSize: 11, fontWeight: 500, letterSpacing: '0.18em',
        color: 'var(--color-text-secondary)',
        textTransform: 'uppercase',
        marginBottom: '1rem'
      }}>
        Sutra Rating
      </p>

      {/* Dial + sub-scores row */}
      <div style={{
        display: 'flex', gap: '1.5rem', alignItems: 'flex-start',
        flexWrap: 'wrap',
      }}>
        {/* Dial */}
        <RatingDial rating={rating} rank={rank} />

        {/* Sub-scores */}
        <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SUB_SCORE_META.map(meta => (
            <SubScoreBar
              key={meta.key}
              meta={meta}
              score={subScores[meta.key] || 0}
            />
          ))}
        </div>
      </div>

      {/* Insight strip */}
      <div style={{
        marginTop: '1.25rem',
        padding: '10px 14px',
        background: 'var(--color-background-secondary)',
        border: '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8
      }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '0 0 2px' }}>
            Focus area to improve your rating
          </p>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
            {lowest?.label} — {lowest?.tip}
          </p>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: rankCfg.color,
          border: `0.5px solid ${rankCfg.color}`,
          borderRadius: 'var(--border-radius-md)',
          padding: '3px 10px',
          background: rankCfg.glow,
        }}>
          {rank}
        </span>
      </div>
    </div>
  );
}
