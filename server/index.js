// server/index.js
// ─────────────────────────────────────────────────────────────
// Sutra AI — Node.js Backend
// Added: /api/progress, /api/dashboard/:userId, Submissions, Achievements
// ─────────────────────────────────────────────────────────────

const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const Problem        = require('./models/Problem');
const UserProgress   = require('./models/UserProgress');
const CodeSubmission = require('./models/CodeSubmission');
const UserRating     = require('./models/UserRating');
const { computeRating } = require('./utils/ratingEngine');

const app = express();
app.use(cors());
app.use(express.json());

// ── MongoDB Connection ────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Connection Error:", err));


// ════════════════════════════════════════════════════════════
// EXISTING ROUTES 
// ════════════════════════════════════════════════════════════

// Get all problems
app.get('/api/problems', async (req, res) => {
  try {
    const problems = await Problem.find();
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get problems by course
app.get('/api/problems/course/:name', async (req, res) => {
  const name = req.params.name;
  let query = {};
  if (name === 'DSA') query = { problemId: { $regex: 'DSA' } };
  else query = { language: name };
  const problems = await Problem.find(query);
  res.json(problems);
});


// ════════════════════════════════════════════════════════════
// ROUTE 1 — Save / Update Progress when user solves
// ════════════════════════════════════════════════════════════
app.post('/api/progress', async (req, res) => {
  try {
    const {
      userId, displayName, problemId, problemTitle,
      topic, category, difficulty, status,
      solveTimeSeconds, hintsUsed, lensUsed, voiceUsed,
      code, language 
    } = req.body;

    const update = {
      displayName,
      problemTitle,
      topic,
      category,
      difficulty,
      hintsUsed,
      lensUsed,
      voiceUsed,
    };

    if (status === 'solved') {
      update.status       = 'solved';
      update.solvedAt     = new Date();
      update.solveTimeSeconds = solveTimeSeconds;
    } else {
      update.status = 'attempted';
    }

    const progress = await UserProgress.findOneAndUpdate(
      { userId, problemId },  
      { $set: update },       
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (code) {
      await CodeSubmission.create({ 
        userId, 
        problemId, 
        code, 
        language: language || "python", 
        status 
      });
    }

    res.json({ success: true, progress });
  } catch (err) {
    console.error('Progress save error:', err);
    res.status(500).json({ message: err.message });
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE 2 — Full Dashboard Data for one user
// ════════════════════════════════════════════════════════════
app.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const allProgress = await UserProgress.find({ userId }).lean();

    const solved    = allProgress.filter(p => p.status === 'solved');
    const attempted = allProgress.filter(p => p.status === 'attempted');

    // ── 1. STATS ─────────────────────────────────────────────
    const totalSolved  = solved.length;
    const hintsUsed    = allProgress.reduce((sum, p) => sum + (p.hintsUsed || 0), 0);
    const solvedTimes  = solved.filter(p => p.solveTimeSeconds > 0).map(p => p.solveTimeSeconds);
    const avgSolveTime = solvedTimes.length
      ? Math.round(solvedTimes.reduce((a, b) => a + b, 0) / solvedTimes.length / 60) 
      : 0;

    const totalProblems = await Problem.countDocuments();
    const completionRate = totalProblems > 0
      ? Math.round((totalSolved / totalProblems) * 100)
      : 0;

    // ── 2. STREAK ─────────────────────────────────────────────
    const solveDates = [...new Set(
      solved
        .filter(p => p.solvedAt)
        .map(p => p.solvedAt.toISOString().split('T')[0]) 
    )].sort().reverse(); 

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak    = 0;

    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (solveDates.includes(today) || solveDates.includes(yesterday)) {
      for (let i = 0; i < solveDates.length; i++) {
        const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        if (solveDates.includes(expected)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    const asc = [...solveDates].reverse();
    for (let i = 0; i < asc.length; i++) {
      if (i === 0) { tempStreak = 1; continue; }
      const prev = new Date(asc[i - 1]);
      const curr = new Date(asc[i]);
      const diff = (curr - prev) / 86400000; 
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak, tempStreak);

    // ── 3. DIFFICULTY SPLIT ───────────────────────────────────
    const difficultyColors = { Easy: '#00C49F', Medium: '#FFBB28', Hard: '#FF5C5C' };
    const diffMap = { Easy: 0, Medium: 0, Hard: 0 };
    solved.forEach(p => { if (p.difficulty) diffMap[p.difficulty]++; });

    const [easyTotal, medTotal, hardTotal] = await Promise.all([
      Problem.countDocuments({ difficulty: 'Easy' }),
      Problem.countDocuments({ difficulty: 'Medium' }),
      Problem.countDocuments({ difficulty: 'Hard' }),
    ]);

    const difficulty = [
      { name: 'Easy',   solved: diffMap.Easy,   total: easyTotal || 1, color: difficultyColors.Easy },
      { name: 'Medium', solved: diffMap.Medium, total: medTotal  || 1, color: difficultyColors.Medium },
      { name: 'Hard',   solved: diffMap.Hard,   total: hardTotal || 1, color: difficultyColors.Hard },
    ];

    // ── 4. CATEGORY PROGRESS ──────────────────────────────────
    const catSolvedMap = {};
    solved.forEach(p => {
      if (!p.category) return;
      if (!catSolvedMap[p.category]) catSolvedMap[p.category] = { solved: 0, course: p.topic };
      catSolvedMap[p.category].solved++;
    });

    const catTotals = await Problem.aggregate([
      { $group: { _id: { category: '$category', topic: '$topic' }, count: { $sum: 1 } } }
    ]);

    const categoryProgress = catTotals.map(c => ({
      name:   c._id.category,
      course: c._id.topic,
      total:  c.count,
      solved: catSolvedMap[c._id.category]?.solved || 0,
    })).filter(c => c.name); 

    // ── 5. SKILL RADAR ────────────────────────────────────────
    const skillMap = {
      Logic:    ['Arrays', 'Linked Lists', 'Heaps'],
      Syntax:   ['Strings', 'Basics'],
      'Optim.': ['Dynamic Programming', 'Greedy'],
      Debug:    ['Trees', 'Graphs'],
      Patterns: ['Sorting', 'Searching'],
      Analysis: ['Complexity', 'System Design'],
    };

    const skillRadar = Object.entries(skillMap).map(([skill, cats]) => {
      const totalInSkill  = catTotals.filter(c => cats.includes(c._id.category)).reduce((s, c) => s + c.count, 0);
      const solvedInSkill = cats.reduce((s, cat) => s + (catSolvedMap[cat]?.solved || 0), 0);
      const score = totalInSkill > 0 ? Math.round((solvedInSkill / totalInSkill) * 100) : 0;
      return { subject: skill, score, fullMark: 100 };
    });

    // ── 6. WEEKLY ACTIVITY ────────────────────────────────────
    const weeklyActivity = [];
    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (w * 7) - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekSolved = solved.filter(p =>
        p.solvedAt && new Date(p.solvedAt) >= weekStart && new Date(p.solvedAt) < weekEnd
      );
      const weekHints = allProgress.filter(p =>
        p.createdAt && new Date(p.createdAt) >= weekStart && new Date(p.createdAt) < weekEnd
      ).reduce((sum, p) => sum + (p.hintsUsed || 0), 0);

      const label = `W${8 - w} ${weekStart.toLocaleString('default', { month: 'short' })}`;
      weeklyActivity.push({ week: label, solved: weekSolved.length, hints: weekHints });
    }

    // ── 7. HEATMAP ────────────────────────────────────────────
    const heatmapData = {};
    solved.forEach(p => {
      if (!p.solvedAt) return;
      const key = new Date(p.solvedAt).toISOString().split('T')[0];
      heatmapData[key] = (heatmapData[key] || 0) + 1;
    });

    // ── 8. RECENT ACTIVITY ────────────────────────────────────
    const recentActivity = await UserProgress
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    // ── 9. LEADERBOARD ────────────────────────────────────────
    const leaderboardRaw = await UserProgress.aggregate([
      { $match: { status: 'solved' } },
      { $group: {
          _id:         '$userId',
          displayName: { $first: '$displayName' },
          totalSolved: { $sum: 1 },
          points: { $sum: {
            $switch: {
              branches: [
                { case: { $eq: ['$difficulty', 'Easy']   }, then: 10 },
                { case: { $eq: ['$difficulty', 'Medium'] }, then: 20 },
                { case: { $eq: ['$difficulty', 'Hard']   }, then: 40 },
              ],
              default: 0
            }
          }}
      }},
      { $sort: { points: -1 } },
      { $limit: 20 },
    ]);

    const userPoints = solved.reduce((sum, p) => {
      if (p.difficulty === 'Easy')   return sum + 10;
      if (p.difficulty === 'Medium') return sum + 20;
      if (p.difficulty === 'Hard')   return sum + 40;
      return sum;
    }, 0);

    const userRank = leaderboardRaw.findIndex(l => l._id === userId) + 1;

    const leaderboard = leaderboardRaw.slice(0, 3).map((l, i) => ({
      rank:   i + 1,
      name:   l.displayName || 'Anonymous',
      points: l.points,
      streak: 0, 
      avatar: (l.displayName || 'A')[0].toUpperCase(),
      isUser: l._id === userId,
    }));

    if (userRank > 3) {
      leaderboard.push({ rank: '...', name: '', points: 0, streak: 0, avatar: '' }); 
      const userData = leaderboardRaw[userRank - 1];
      if (userData) {
        leaderboard.push({
          rank:   userRank,
          name:   userData.displayName || 'You',
          points: userData.points,
          streak: currentStreak,
          avatar: '★',
          isUser: true,
        });
        const nextUser = leaderboardRaw[userRank]; 
        if (nextUser) {
          leaderboard.push({
            rank:   userRank + 1,
            name:   nextUser.displayName || 'Anonymous',
            points: nextUser.points,
            streak: 0,
            avatar: (nextUser.displayName || 'A')[0].toUpperCase(),
          });
        }
      }
    }

    // ── 10. ACHIEVEMENTS DATA ─────────────────────────────────
    const pureSolves = solved.filter(p => p.hintsUsed === 0).length;
    const dsaSolved  = solved.filter(p => p.topic === 'DSA').length;
    const totalUsers = await UserProgress.distinct('userId').then(ids => ids.length) || 1;
    const speedBadges = {
      easy:   solved.some(p => p.difficulty === 'Easy'   && p.solveTimeSeconds > 0 && p.solveTimeSeconds <= 180),
      medium: solved.some(p => p.difficulty === 'Medium' && p.solveTimeSeconds > 0 && p.solveTimeSeconds <= 480),
      hard:   solved.some(p => p.difficulty === 'Hard'   && p.solveTimeSeconds > 0 && p.solveTimeSeconds <= 900),
    };

    // ── 11. RATING COMPUTATION ────────────────────────────────
    const easySolved       = diffMap.Easy   || 0;
    const mediumSolved     = diffMap.Medium || 0;
    const hardSolved       = diffMap.Hard   || 0;
    const uniqueCategories = Object.keys(catSolvedMap).length;
    const uniqueCourses    = [...new Set(solved.map(p => p.topic).filter(Boolean))].length;

    const ratingSignals = {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      hintsUsed,
      avgSolveTime,
      currentStreak,
      longestStreak,
      uniqueCategories,
      uniqueCourses,
      pureSolves,
    };

    const ratingResult = computeRating(ratingSignals);

    await UserRating.findOneAndUpdate(
      { userId },
      {
        rating:     ratingResult.rating,
        rank:       ratingResult.rank,
        subScores:  ratingResult.subScores,
        signals:    ratingResult.signals,
        computedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // ── FINAL RESPONSE ────────────────────────────────────────
    res.json({
      stats: {
        totalSolved,
        currentStreak,
        longestStreak,
        globalRank:     userRank || '—',
        totalPoints:    userPoints,
        hintsUsed,
        avgSolveTime,
        completionRate,
        pureSolves,
        dsaSolved,
        totalUsers,
        speedBadges,
      },
      rating: ratingResult,
      difficulty,
      skillRadar,
      weeklyActivity,
      categoryProgress,
      recentActivity: recentActivity.map(p => ({
        id:         p._id,
        title:      p.problemTitle || p.problemId,
        difficulty: p.difficulty,
        course:     p.topic,
        time:       p.solveTimeSeconds > 0 ? `${Math.round(p.solveTimeSeconds / 60)} min` : '—',
        hintsUsed:  p.hintsUsed,
        solvedAt:   p.solvedAt,
        status:     p.status,
      })),
      leaderboard,
      heatmapData,
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: err.message });
  }
});


// ════════════════════════════════════════════════════════════
// ROUTE 3 — Update hints count only (called on each hint)
// ════════════════════════════════════════════════════════════
app.patch('/api/progress/hint', async (req, res) => {
  try {
    const { userId, problemId, lensUsed, voiceUsed } = req.body;

    await UserProgress.findOneAndUpdate(
      { userId, problemId },
      {
        $inc: { hintsUsed: 1 },                 
        $set: {
          ...(lensUsed  && { lensUsed: true }),
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
});


// ════════════════════════════════════════════════════════════
// NEW ROUTES — Code Submissions API
// ════════════════════════════════════════════════════════════

// ── Route 1: Save a separate code submission ──
app.post("/api/submissions", async (req, res) => {
  try {
    const { userId, problemId, code, language, status } = req.body;

    if (!userId || !problemId || !code) {
      return res.status(400).json({ error: "userId, problemId, and code are required" });
    }

    const submission = new CodeSubmission({
      userId,
      problemId,
      code: code.trim(),
      language: language || "python",
      status: status || "attempted"
    });

    await submission.save();
    res.status(201).json({ message: "Submission saved", id: submission._id });

  } catch (err) {
    console.error("Save submission error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Route 2: Fetch all submissions for a problem (for plagiarism check) ──
app.get("/api/submissions/:problemId", async (req, res) => {
  try {
    const { problemId } = req.params;

    // Fetch all submissions for this problem, excluding huge fields
    const submissions = await CodeSubmission.find(
      { problemId },
      { userId: 1, code: 1, submittedAt: 1, status: 1, _id: 1 }
    ).sort({ submittedAt: -1 }).limit(200); // cap at 200 for performance

    res.json(submissions);
  } catch (err) {
    console.error("Fetch submissions error:", err);
    res.status(500).json({ error: err.message });
  }
});


// ════════════════════════════════════════════════════════════
// RATING ROUTES
// ════════════════════════════════════════════════════════════

// GET /api/rating/:userId — fetch stored rating for one user
app.get('/api/rating/:userId', async (req, res) => {
  try {
    const rating = await UserRating.findOne({ userId: req.params.userId }).lean();
    if (!rating) return res.status(404).json({ message: 'No rating found yet' });
    res.json(rating);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rating/leaderboard — top 20 users by Sutra Rating
app.get('/api/rating/leaderboard', async (req, res) => {
  try {
    const top = await UserRating.find({})
      .sort({ rating: -1 })
      .limit(20)
      .lean();
    res.json(top);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));