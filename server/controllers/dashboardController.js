// server/controllers/dashboardController.js
const UserProgress = require('../models/UserProgress');
const Problem = require('../models/Problem');

exports.getDashboard = async (req, res) => {
  try {
    const { userId } = req.params;
    const allProgress = await UserProgress.find({ userId }).lean();
    
    // Partially solved and solved count towards score, but only fully solved count towards completion rate
    const solved = allProgress.filter(p => p.status === 'solved');
    
    // ── STATS ──
    const totalSolved = solved.length;
    const hintsUsed = allProgress.reduce((sum, p) => sum + (p.hintsUsed || 0), 0);
    const solvedTimes = solved.filter(p => p.solveTimeSeconds > 0).map(p => p.solveTimeSeconds);
    const avgSolveTime = solvedTimes.length ? Math.round(solvedTimes.reduce((a, b) => a + b, 0) / solvedTimes.length / 60) : 0;
    const totalProblems = await Problem.countDocuments();
    const completionRate = totalProblems > 0 ? Math.round((totalSolved / totalProblems) * 100) : 0;

    // ── TOTAL POINTS ──
    // Sum of points from all attempts (solved and partially solved)
    const userPoints = allProgress.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);

    // ── STREAK LOGIC ──
    const solveDates = [...new Set(solved.filter(p => p.solvedAt).map(p => p.solvedAt.toISOString().split('T')[0]))].sort().reverse(); 
    let currentStreak = 0; let longestStreak = 0; let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (solveDates.includes(today) || solveDates.includes(yesterday)) {
      for (let i = 0; i < solveDates.length; i++) {
        const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
        if (solveDates.includes(expected)) currentStreak++; else break;
      }
    }
    const asc = [...solveDates].reverse();
    for (let i = 0; i < asc.length; i++) {
      if (i === 0) { tempStreak = 1; continue; }
      const diff = (new Date(asc[i]) - new Date(asc[i - 1])) / 86400000; 
      if (diff === 1) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak); } 
      else tempStreak = 1;
    }
    longestStreak = Math.max(longestStreak, currentStreak, tempStreak);

    // ── DIFFICULTY SPLIT ──
    const difficultyColors = { Easy: '#00C49F', Medium: '#FFBB28', Hard: '#FF5C5C' };
    const diffMap = { Easy: 0, Medium: 0, Hard: 0 };
    solved.forEach(p => { if (p.difficulty) diffMap[p.difficulty]++; });
    const [easyTotal, medTotal, hardTotal] = await Promise.all([
      Problem.countDocuments({ difficulty: 'Easy' }), Problem.countDocuments({ difficulty: 'Medium' }), Problem.countDocuments({ difficulty: 'Hard' })
    ]);
    const difficulty = [
      { name: 'Easy', solved: diffMap.Easy, total: easyTotal || 1, color: difficultyColors.Easy },
      { name: 'Medium', solved: diffMap.Medium, total: medTotal || 1, color: difficultyColors.Medium },
      { name: 'Hard', solved: diffMap.Hard, total: hardTotal || 1, color: difficultyColors.Hard }
    ];

    // ── CATEGORY & SKILL RADAR ──
    const catSolvedMap = {};
    solved.forEach(p => {
      if (!p.category) return;
      if (!catSolvedMap[p.category]) catSolvedMap[p.category] = { solved: 0, course: p.topic };
      catSolvedMap[p.category].solved++;
    });
    const catTotals = await Problem.aggregate([{ $group: { _id: { category: '$category', topic: '$topic' }, count: { $sum: 1 } } }]);
    const categoryProgress = catTotals.map(c => ({ name: c._id.category, course: c._id.topic, total: c.count, solved: catSolvedMap[c._id.category]?.solved || 0 })).filter(c => c.name); 

    const skillMap = { Logic: ['Arrays', 'Linked Lists', 'Heaps'], Syntax: ['Strings', 'Basics'], 'Optim.': ['Dynamic Programming', 'Greedy'], Debug: ['Trees', 'Graphs'], Patterns: ['Sorting', 'Searching'], Analysis: ['Complexity', 'System Design'] };
    const skillRadar = Object.entries(skillMap).map(([skill, cats]) => {
      const totalInSkill = catTotals.filter(c => cats.includes(c._id.category)).reduce((s, c) => s + c.count, 0);
      const solvedInSkill = cats.reduce((s, cat) => s + (catSolvedMap[cat]?.solved || 0), 0);
      const score = totalInSkill > 0 ? Math.round((solvedInSkill / totalInSkill) * 100) : 0;
      return { subject: skill, score, fullMark: 100 };
    });

    // ── WEEKLY & RECENT ACTIVITY ──
    const heatmapData = {};
    solved.forEach(p => {
      if (!p.solvedAt) return;
      const key = new Date(p.solvedAt).toISOString().split('T')[0];
      heatmapData[key] = (heatmapData[key] || 0) + 1;
    });

    const recentActivity = await UserProgress.find({ userId }).sort({ updatedAt: -1 }).limit(10).lean();

    // ── LEADERBOARD (Uses New Points System) ──
    const leaderboardRaw = await UserProgress.aggregate([
      { $group: {
          _id: '$userId',
          displayName: { $first: '$displayName' },
          totalSolved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
          points: { $sum: '$pointsEarned' }
      }},
      { $sort: { points: -1 } },
      { $limit: 20 },
    ]);

    const userRank = leaderboardRaw.findIndex(l => l._id === userId) + 1;
    const leaderboard = leaderboardRaw.slice(0, 3).map((l, i) => ({
      rank: i + 1, name: l.displayName || 'Anonymous', points: l.points, streak: 0, avatar: (l.displayName || 'A')[0].toUpperCase(), isUser: l._id === userId
    }));

    if (userRank > 3) {
      leaderboard.push({ rank: '...', name: '', points: 0, streak: 0, avatar: '' }); 
      const userData = leaderboardRaw[userRank - 1];
      if (userData) {
        leaderboard.push({ rank: userRank, name: userData.displayName || 'You', points: userData.points, streak: currentStreak, avatar: '★', isUser: true });
      }
    }

    res.json({
      stats: { totalSolved, currentStreak, longestStreak, globalRank: userRank || '—', totalPoints: userPoints, hintsUsed, avgSolveTime, completionRate },
      difficulty, skillRadar, categoryProgress, heatmapData, leaderboard,
      recentActivity: recentActivity.map(p => ({
        id: p._id, title: p.problemTitle || p.problemId, difficulty: p.difficulty, course: p.topic, time: p.solveTimeSeconds > 0 ? `${Math.round(p.solveTimeSeconds / 60)} min` : '—', hintsUsed: p.hintsUsed, solvedAt: p.solvedAt, status: p.status, pointsEarned: p.pointsEarned
      })),
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: err.message });
  }
};