// server/models/UserRating.js
// Stores the computed Sutra Rating for each user.
// Recomputed every time /api/dashboard/:userId is called.

const mongoose = require('mongoose');

const UserRatingSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },

  // Final composite score (0–1000)
  rating: { type: Number, default: 0 },

  // Rank label derived from rating
  rank: { type: String, default: 'Newcomer' },

  // Sub-scores (each 0–100, before weight is applied)
  subScores: {
    proficiency:  { type: Number, default: 0 }, // weight 0.35
    efficiency:   { type: Number, default: 0 }, // weight 0.25
    consistency:  { type: Number, default: 0 }, // weight 0.20
    breadth:      { type: Number, default: 0 }, // weight 0.12
    independence: { type: Number, default: 0 }, // weight 0.08
  },

  // Raw signals stored for transparency / debugging
  signals: {
    totalSolved:    { type: Number, default: 0 },
    easySolved:     { type: Number, default: 0 },
    mediumSolved:   { type: Number, default: 0 },
    hardSolved:     { type: Number, default: 0 },
    hintsUsed:      { type: Number, default: 0 },
    avgSolveTime:   { type: Number, default: 0 }, // minutes
    currentStreak:  { type: Number, default: 0 },
    longestStreak:  { type: Number, default: 0 },
    uniqueCategories: { type: Number, default: 0 },
    uniqueCourses:  { type: Number, default: 0 },
    pureSolves:     { type: Number, default: 0 },
  },

  computedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('UserRating', UserRatingSchema);
