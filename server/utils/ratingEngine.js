// server/utils/ratingEngine.js
//
// Sutra Rating Engine — Weighted Bias System
// ─────────────────────────────────────────────────────────────
// Inspired by ML weight bias: each signal is normalized to
// a 0–100 sub-score, then multiplied by its learned weight.
// Final rating = Σ(weight_i × subScore_i) × 10  → 0 to 1000
//
// WEIGHTS (must sum to 1.0):
//   Proficiency   0.35  ← how hard the problems you solve are
//   Efficiency    0.25  ← how fast & independently you solve
//   Consistency   0.20  ← daily habit / streaks
//   Breadth       0.12  ← variety of topics & courses
//   Independence  0.08  ← solving without hints
// ─────────────────────────────────────────────────────────────

const WEIGHTS = {
  proficiency:  0.35,
  efficiency:   0.25,
  consistency:  0.20,
  breadth:      0.12,
  independence: 0.08,
};

// Rank tiers  (rating → label)
const RANK_TIERS = [
  { min: 900, label: 'Grandmaster' },
  { min: 800, label: 'Master'      },
  { min: 700, label: 'Expert'      },
  { min: 600, label: 'Veteran'     },
  { min: 500, label: 'Architect'   },
  { min: 400, label: 'Engineer'    },
  { min: 300, label: 'Builder'     },
  { min: 200, label: 'Coder'       },
  { min: 100, label: 'Learner'     },
  { min: 0,   label: 'Newcomer'    },
];

// ─────────────────────────────────────────────────────────────
// HELPER: clamp a value between 0 and 100
// ─────────────────────────────────────────────────────────────
const clamp = (v) => Math.min(100, Math.max(0, v));

// ─────────────────────────────────────────────────────────────
// HELPER: sigmoid-like curve
// Maps raw score → 0..100 with diminishing returns past the
// "saturation" point.  Prevents whales from maxing every sub-score.
//
//   normalize(value, saturationPoint)
//   e.g. normalize(25, 50) → ~39.3
//        normalize(50, 50) → 63.2
//        normalize(100, 50) → 86.5
// ─────────────────────────────────────────────────────────────
const normalize = (value, saturation) => {
  if (!saturation || value <= 0) return 0;
  return clamp(100 * (1 - Math.exp(-value / saturation)));
};

// ─────────────────────────────────────────────────────────────
// SUB-SCORE 1: PROFICIENCY (weight 0.35)
//
// Formula:
//   raw = (easy × 10) + (medium × 25) + (hard × 50)
//   Saturation at raw = 500  (a balanced solver hits ~63/100 at 500 pts)
//
// Hard problems contribute 5× more than easy ones.
// Hint PENALTY: each hint reduces proficiency by 0.5 points,
//   capped at 20 point deduction.
// ─────────────────────────────────────────────────────────────
function computeProficiency({ easySolved, mediumSolved, hardSolved, hintsUsed }) {
  const raw = (easySolved * 10) + (mediumSolved * 25) + (hardSolved * 50);
  const base = normalize(raw, 500);
  const hintPenalty = Math.min(20, hintsUsed * 0.5);
  return clamp(base - hintPenalty);
}

// ─────────────────────────────────────────────────────────────
// SUB-SCORE 2: EFFICIENCY (weight 0.25)
//
// Two components combined 60/40:
//
//   a) Speed score (60%):
//      Baseline solve times: Easy=8min, Medium=20min, Hard=40min
//      speedRatio = avgExpectedTime / avgActualTime
//      If you solve in half the expected time → ratio=2 → great score
//      Cap at ratio=3 (diminishing returns beyond 3× speed)
//
//   b) Hint efficiency (40%):
//      hintRatio = hintsUsed / totalSolved
//      Lower ratio = better score
//      0 hints/solve = 100, 2 hints/solve = 0
// ─────────────────────────────────────────────────────────────
function computeEfficiency({ easySolved, mediumSolved, hardSolved, avgSolveTime, hintsUsed, totalSolved }) {
  // a) Speed component
  let speedScore = 50; // default if no solve time data
  if (avgSolveTime > 0 && totalSolved > 0) {
    const totalExpected = (easySolved * 8) + (mediumSolved * 20) + (hardSolved * 40);
    const avgExpected = totalSolved > 0 ? totalExpected / totalSolved : 20;
    const ratio = Math.min(3, avgExpected / avgSolveTime);
    speedScore = clamp((ratio / 3) * 100);
  }

  // b) Hint efficiency component
  const hintRatio = totalSolved > 0 ? hintsUsed / totalSolved : 0;
  // 0 hints/solve → 100, 2+ hints/solve → 0 (linear)
  const hintScore = clamp(100 - (hintRatio * 50));

  return clamp((speedScore * 0.60) + (hintScore * 0.40));
}

// ─────────────────────────────────────────────────────────────
// SUB-SCORE 3: CONSISTENCY (weight 0.20)
//
// Two components combined 50/50:
//
//   a) Current streak (50%):
//      normalize(currentStreak, 14) — saturation at 2 weeks
//
//   b) Longest streak (50%):
//      normalize(longestStreak, 30) — saturation at 1 month
//
// Bonus: +5 points if currentStreak == longestStreak
//        (actively maintaining best streak)
// ─────────────────────────────────────────────────────────────
function computeConsistency({ currentStreak, longestStreak }) {
  const currScore    = normalize(currentStreak, 14);
  const longestScore = normalize(longestStreak, 30);
  const base = (currScore * 0.50) + (longestScore * 0.50);
  const bonus = (longestStreak > 0 && currentStreak === longestStreak) ? 5 : 0;
  return clamp(base + bonus);
}

// ─────────────────────────────────────────────────────────────
// SUB-SCORE 4: BREADTH (weight 0.12)
//
// Two components combined 60/40:
//
//   a) Category breadth (60%):
//      normalize(uniqueCategories, 8) — 8+ categories → near max
//
//   b) Course breadth (40%):
//      3 courses available (DSA, Python, C)
//      courseScore = (uniqueCourses / 3) × 100
// ─────────────────────────────────────────────────────────────
function computeBreadth({ uniqueCategories, uniqueCourses }) {
  const catScore    = normalize(uniqueCategories, 8);
  const courseScore = clamp((uniqueCourses / 3) * 100);
  return clamp((catScore * 0.60) + (courseScore * 0.40));
}

// ─────────────────────────────────────────────────────────────
// SUB-SCORE 5: INDEPENDENCE (weight 0.08)
//
// pureSolveRatio = pureSolves / totalSolved
// Score = pureSolveRatio × 100
// Pure solve = solved with 0 hints
//
// Bonus curve: extra 10 points if pureSolveRatio > 0.8
// ─────────────────────────────────────────────────────────────
function computeIndependence({ pureSolves, totalSolved }) {
  if (!totalSolved) return 0;
  const ratio = pureSolves / totalSolved;
  const base = clamp(ratio * 100);
  const bonus = ratio > 0.8 ? 10 : 0;
  return clamp(base + bonus);
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT: computeRating
//
// Input: signals object from the dashboard API
// Output: { rating, rank, subScores, signals, weights }
// ─────────────────────────────────────────────────────────────
function computeRating(signals) {
  const {
    totalSolved   = 0,
    easySolved    = 0,
    mediumSolved  = 0,
    hardSolved    = 0,
    hintsUsed     = 0,
    avgSolveTime  = 0,  // minutes
    currentStreak = 0,
    longestStreak = 0,
    uniqueCategories = 0,
    uniqueCourses = 0,
    pureSolves    = 0,
  } = signals;

  // Guard: no activity → rating 0
  if (totalSolved === 0) {
    return {
      rating: 0,
      rank: 'Newcomer',
      subScores: { proficiency: 0, efficiency: 0, consistency: 0, breadth: 0, independence: 0 },
      signals,
      weights: WEIGHTS,
    };
  }

  // Compute each sub-score (0–100)
  const subScores = {
    proficiency:  Math.round(computeProficiency({ easySolved, mediumSolved, hardSolved, hintsUsed })),
    efficiency:   Math.round(computeEfficiency({ easySolved, mediumSolved, hardSolved, avgSolveTime, hintsUsed, totalSolved })),
    consistency:  Math.round(computeConsistency({ currentStreak, longestStreak })),
    breadth:      Math.round(computeBreadth({ uniqueCategories, uniqueCourses })),
    independence: Math.round(computeIndependence({ pureSolves, totalSolved })),
  };

  // Weighted sum → 0..100 → scale to 0..1000
  const weightedSum =
    (subScores.proficiency  * WEIGHTS.proficiency)  +
    (subScores.efficiency   * WEIGHTS.efficiency)   +
    (subScores.consistency  * WEIGHTS.consistency)  +
    (subScores.breadth      * WEIGHTS.breadth)      +
    (subScores.independence * WEIGHTS.independence);

  const rating = Math.round(weightedSum * 10); // 0–100 × 10 = 0–1000

  // Determine rank tier
  const rank = RANK_TIERS.find(t => rating >= t.min)?.label || 'Newcomer';

  return { rating, rank, subScores, signals, weights: WEIGHTS };
}

module.exports = { computeRating, WEIGHTS, RANK_TIERS };
