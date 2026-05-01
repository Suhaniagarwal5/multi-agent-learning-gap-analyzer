// server/models/UserProgress.js
const mongoose = require("mongoose");

const userProgressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    displayName: { type: String },
    problemId: { type: String, required: true },
    problemTitle: { type: String },
    topic: { type: String },
    category: { type: String },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },

    // ── OUTCOME ──────────────────────────────────────────────
    status: {
      type: String,
      enum: ["solved", "partially_solved", "attempted"], // Added partially_solved
      default: "attempted",
    },

    // ── SUTRA SCORING & TEST CASES ───────────────────────────
    pointsEarned: { type: Number, default: 0 },
    testCasesPassed: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },

    // ── PERFORMANCE METRICS ───────────────────────────────────
    solveTimeSeconds: { type: Number, default: 0 },
    hintsUsed: { type: Number, default: 0 },
    lensUsed: { type: Boolean, default: false },
    voiceUsed: { type: Boolean, default: false },

    // ── TIMESTAMPS ───────────────────────────────────────────
    solvedAt: { type: Date },
    firstAttemptAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });
module.exports = mongoose.model("UserProgress", userProgressSchema);