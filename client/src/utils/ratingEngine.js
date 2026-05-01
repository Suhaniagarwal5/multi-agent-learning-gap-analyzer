// client/src/utils/ratingEngine.js

export const calculateSutraRating = (userData) => {
  const {
    solvedProblems = [], // Array of { difficulty, hintsUsed, lensUsed, voiceUsed }
    currentStreak = 0,
    longestStreak = 0,
    plagiarismFlags = 0, // Number of times caught cheating
  } = userData;

  let proficiencyScore = 0;
  let hintsTotal = 0;
  let uniqueCategories = new Set();
  let uniqueCourses = new Set();
  let zeroHintSolves = 0;

  // 1. Proficiency & Independence Calculation
  solvedProblems.forEach((prob) => {
    let basePoints = 0;
    if (prob.difficulty === 'Easy') basePoints = 10;
    if (prob.difficulty === 'Medium') basePoints = 25;
    if (prob.difficulty === 'Hard') basePoints = 50;

    // Treat voice hints identically to standard text hints
    const totalHintsForProb = (prob.hintsUsed || 0) + (prob.voiceUsed ? 1 : 0);
    hintsTotal += totalHintsForProb;

    if (totalHintsForProb === 0) zeroHintSolves += 1;

    // Hint penalty (-2 per hint), capped at 15 so Hard (50-15=35) is ALWAYS > Medium (25)
    let penalty = totalHintsForProb * 2;
    if (penalty > 15) penalty = 15; 

    let netPoints = basePoints - penalty;

    // Multimodal Impact: Sutra Lens Bonus
    if (prob.lensUsed) {
      netPoints += 5; // Flat bonus for physical-to-digital workflow
    }

    proficiencyScore += netPoints;

    if (prob.category) uniqueCategories.add(prob.category);
    if (prob.course) uniqueCourses.add(prob.course);
  });

  // 2. Anti-Cheat & Compounding Penalty (k = 50)
  let cheatPenalty = 0;
  if (plagiarismFlags > 0) {
    // Compounding: 50 * 1 = 50, 50 * 1.5 = 75, etc.
    cheatPenalty = 50 * Math.pow(1.5, plagiarismFlags - 1); 
    
    // Beginner Grace Curve: Reduce penalty if score is very low (Newcomer/Learner tier)
    if (proficiencyScore < 200) {
      cheatPenalty = cheatPenalty * 0.5; // 50% grace for beginners
    }
  }

  // Final Rating Math
  let rawRating = proficiencyScore - cheatPenalty;

  // Add Consistency (Streak)
  const streakBonus = (Math.min(currentStreak, 14) * 2) + (Math.min(longestStreak, 30) * 1);
  rawRating += streakBonus;

  // Independence Bonus (>80% zero hints)
  const indepRatio = solvedProblems.length > 0 ? (zeroHintSolves / solvedProblems.length) : 0;
  if (indepRatio > 0.8) rawRating += 50; 

  // Clamp between 0 and 1000
  let finalRating = Math.max(0, Math.min(Math.round(rawRating), 1000));

  // Determine Rank Tier
  let rank = 'Newcomer';
  if (finalRating >= 100) rank = 'Learner';
  if (finalRating >= 200) rank = 'Coder';
  if (finalRating >= 300) rank = 'Builder';
  if (finalRating >= 400) rank = 'Engineer';
  if (finalRating >= 500) rank = 'Architect';
  if (finalRating >= 600) rank = 'Veteran';
  if (finalRating >= 700) rank = 'Expert';
  if (finalRating >= 800) rank = 'Master';
  if (finalRating >= 900) rank = 'Grandmaster';

  return {
    rating: finalRating,
    rank: rank,
    subScores: {
      proficiency: Math.min(Math.round((proficiencyScore / 500) * 100), 100),
      efficiency: Math.min(Math.round(100 - (hintsTotal * 2)), 100),
      consistency: Math.min(Math.round((streakBonus / 58) * 100), 100),
      breadth: Math.min(Math.round(((uniqueCategories.size / 8) * 60) + ((uniqueCourses.size / 3) * 40)), 100),
      independence: Math.round(indepRatio * 100)
    },
    details: {
      rawProficiency: proficiencyScore,
      penaltiesApplied: cheatPenalty
    }
  };
};