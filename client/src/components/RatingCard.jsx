import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Flame, BookOpen, Shield, Target } from 'lucide-react';

const RANK_COLORS = {
  Newcomer:    { color: '#888780', glow: 'rgba(136,135,128,0.1)'  },
  Learner:     { color: '#5DCAA5', glow: 'rgba(93,202,165,0.1)'   },
  Coder:       { color: '#00E5FF', glow: 'rgba(0,229,255,0.1)'    },
  Builder:     { color: '#3B8BD4', glow: 'rgba(59,139,212,0.1)'   },
  Engineer:    { color: '#7F77DD', glow: 'rgba(127,119,221,0.15)' },
  Architect:   { color: '#EF9F27', glow: 'rgba(239,159,39,0.15)'  },
  Veteran:     { color: '#D85A30', glow: 'rgba(216,90,48,0.15)'   },
  Expert:      { color: '#D4537E', glow: 'rgba(212,83,126,0.15)'  },
  Master:      { color: '#E24B4A', glow: 'rgba(226,75,74,0.2)'    },
  Grandmaster: { color: '#FFD700', glow: 'rgba(255,215,0,0.25)'   },
};

// Colors matched to your second reference image
const SUB_SCORE_META = [
  { key: 'proficiency',  label: 'Proficiency',  icon: TrendingUp, weight: '35%', color: '#737373' },
  { key: 'efficiency',   label: 'Efficiency',   icon: Zap,        weight: '25%', color: '#EAB308' },
  { key: 'consistency',  label: 'Consistency',  icon: Flame,      weight: '20%', color: '#F97316' },
  { key: 'breadth',      label: 'Breadth',      icon: BookOpen,   weight: '12%', color: '#A855F7' },
  { key: 'independence', label: 'Independence', icon: Shield,     weight: '8%',  color: '#14B8A6' },
];

function RatingDial({ rating, rank }) {
  const rankCfg = RANK_COLORS[rank] || RANK_COLORS.Newcomer;
  const radius = 75;
  const stroke = 4; // Thinner stroke for a cleaner look
  const cx = 95;
  const cy = 95;
  const circ = 2 * Math.PI * radius;
  const arcFrac = 0.75;
  const dashFull = circ * arcFrac;
  const dashFill = (rating / 1000) * dashFull;

  return (
    <div style={{ position: 'relative', width: 190, height: 160 }}>
      <svg width="190" height="190" viewBox="0 0 190 190">
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="#1F1F1F"
          strokeWidth={stroke}
          strokeDasharray={`${dashFull} ${circ - dashFull}`}
          strokeLinecap="round"
          transform="rotate(135 95 95)"
        />
        <motion.circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={rankCfg.color}
          strokeWidth={stroke}
          strokeDasharray={`${dashFill} ${circ}`}
          strokeLinecap="round"
          transform="rotate(135 95 95)"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dashFill} ${circ}` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: '45%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 10, color: '#737373', letterSpacing: '0.1em', marginBottom: 4 }}>SUTRA RATING</div>
        <div style={{ fontSize: 48, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>{rating}</div>
        <div style={{ fontSize: 12, color: '#737373', marginTop: 4 }}>/ 1000</div>
        <div style={{ 
          marginTop: 12, fontSize: 11, fontWeight: 600, color: rankCfg.color, 
          letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '4px 12px', border: `1px solid ${rankCfg.color}44`, borderRadius: 20
        }}>
          {rank}
        </div>
      </div>
    </div>
  );
}

function SubScoreLine({ meta, score }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 30px', alignItems: 'center', gap: 15, height: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <meta.icon size={14} style={{ color: '#525252' }} />
        <span style={{ fontSize: 12, color: '#A3A3A3', fontWeight: 500 }}>{meta.label}</span>
      </div>
      <div style={{ height: 4, background: '#171717', borderRadius: 2, position: 'relative' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          style={{ height: '100%', background: meta.color, borderRadius: 2, boxShadow: `0 0 8px ${meta.color}44` }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', textAlign: 'right' }}>{score}</span>
    </div>
  );
}

export default function RatingCard({ rating: ratingData }) {
  if (!ratingData) return null;
  const { rating = 0, rank = 'Newcomer', subScores = {} } = ratingData;
  const lowest = [...SUB_SCORE_META].sort((a, b) => (subScores[a.key] || 0) - (subScores[b.key] || 0))[0];

  return (
    <div style={{
      background: '#0A0A0A',
      border: '1px solid #1F1F1F',
      borderRadius: 16,
      padding: '24px',
      color: '#FFFFFF',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        {/* Left Section: Dial */}
        <RatingDial rating={rating} rank={rank} />

        {/* Right Section: Bars */}
        <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {SUB_SCORE_META.map(meta => (
            <SubScoreLine key={meta.key} meta={meta} score={subScores[meta.key] || 0} />
          ))}
          
          {/* Target Suggestion integrated directly below bars */}
          <div style={{ 
            marginTop: 20, padding: '12px 16px', background: '#111111', 
            borderRadius: 12, border: '1px solid #1F1F1F', display: 'flex', alignItems: 'center', gap: 12
          }}>
            <div style={{ pading: 8, borderRadius: '50%', background: '#1F1F1F' }}><Target size={16} color="#3B8BD4" /></div>
            <div>
              <div style={{ fontSize: 10, color: '#737373', textTransform: 'uppercase' }}>Target Area</div>
              <div style={{ fontSize: 12, color: '#E5E5E5' }}>
                Focus on <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{lowest?.label}</span> to boost your rating.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}