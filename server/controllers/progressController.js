// server/controllers/progressController.js
const UserProgress = require('../models/UserProgress');
const CodeSubmission = require('../models/CodeSubmission');

exports.saveProgress = async (req, res) => {
  try {
    const {
      userId, displayName, problemId, problemTitle,
      topic, category, difficulty, status,
      solveTimeSeconds, hintsUsed, lensUsed, voiceUsed,
      code, language, testCasesPassed, totalTestCases, isPlagiarized
    } = req.body;

    // ── SCORING & PARTIAL POINTS LOGIC ──
    let passedCases = testCasesPassed !== undefined ? testCasesPassed : (status === 'solved' ? 1 : 0);
    let totalCases = totalTestCases || 1; 

    // 1. Base Score (Case insensitive to avoid errors)
    let diffStr = difficulty ? difficulty.toLowerCase() : 'medium';
    let baseScore = diffStr === 'hard' ? 45 : diffStr === 'medium' ? 30 : 15;

    // 2. Hint Deductions
    let hintDeduction = 0;
    if (hintsUsed === 1) hintDeduction = 1;
    else if (hintsUsed === 2) hintDeduction = 3;
    else if (hintsUsed === 3) hintDeduction = 6;
    else if (hintsUsed >= 4) hintDeduction = 11;

    // 3. Lens Bonus
    let bonus = lensUsed ? 3 : 0;

    // 4. Calculate Final Points
    let maxPossiblePoints = baseScore - hintDeduction + bonus;
    let multiplier = passedCases / totalCases; 
    let finalPoints = Math.round(maxPossiblePoints * multiplier);

    // 5. Determine Correct Status
    let finalStatus = 'attempted';
    if (multiplier === 1) finalStatus = 'solved';
    else if (multiplier > 0) finalStatus = 'partially_solved';

    // 🔴 PLAGIARISM PENALTY LOGIC 🔴
    if (isPlagiarized === true) {
        finalPoints = -50; 
        finalStatus = 'plagiarized'; 
    }

    // ── DB UPDATE ──
    let existingProgress = await UserProgress.findOne({ userId, problemId });
    
    // IMPORTANT FIX: Keep highest score UNLESS they plagiarized, then force penalty
    let highestPoints = finalPoints;
    if (existingProgress && isPlagiarized !== true) {
        highestPoints = Math.max(existingProgress.pointsEarned || 0, finalPoints);
    }

    const update = {
      displayName, problemTitle, topic, category, difficulty,
      hintsUsed, lensUsed, voiceUsed,
      status: finalStatus,
      pointsEarned: highestPoints,
      testCasesPassed: passedCases,
      totalTestCases: totalCases
    };

    if (finalStatus === 'solved' && (!existingProgress || existingProgress.status !== 'solved')) {
      update.solvedAt = new Date();
      update.solveTimeSeconds = solveTimeSeconds;
    }

    const progress = await UserProgress.findOneAndUpdate(
      { userId, problemId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ── Save Submission ──
    if (code) {
      await CodeSubmission.create({
        userId, problemId, code,
        language: language || "python",
        status: finalStatus
      });
    }

    res.json({ success: true, progress, pointsEarned: highestPoints });
  } catch (err) {
    console.error('Progress save error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateHintCount = async (req, res) => {
  try {
    const { userId, problemId, lensUsed, voiceUsed } = req.body;
    await UserProgress.findOneAndUpdate(
      { userId, problemId },
      {
        $inc: { hintsUsed: 1 },
        $set: {
          ...(lensUsed && { lensUsed: true }),
          ...(voiceUsed && { voiceUsed: true }),
        },
        $setOnInsert: { firstAttemptAt: new Date() }
      },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};