// server/models/UserProgress.js
// ─────────────────────────────────────────────────────────────
// This model stores ONE record per problem attempt per user.
// Every time a user solves or attempts a problem in the IDE,
// one document is created/updated here.
// ─────────────────────────────────────────────────────────────

const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({

  // ── WHO ──────────────────────────────────────────────────
  userId:       { type: String, required: true, index: true },
  // Firebase UID — e.g. "abc123xyz" (from user.uid in AuthContext)
  // This is the primary key we use to fetch all of a user's data.

  displayName:  { type: String },
  // Stored here so leaderboard queries don't need a separate
  // Users collection. Denormalized on purpose for query speed.

  // ── WHAT PROBLEM ─────────────────────────────────────────
  problemId:    { type: String, required: true },
  // e.g. "DSA_LL_001" — matches problemId in the Problem collection

  problemTitle: { type: String },
  // Stored here to avoid JOIN with Problem collection on dashboard queries.
  // e.g. "Reverse a Linked List"

  topic:        { type: String },
  // "DSA", "Python", or "C" — the course this problem belongs to

  category:     { type: String },
  // "Linked Lists", "Arrays", "Trees" etc.

  difficulty:   { type: String, enum: ['Easy', 'Medium', 'Hard'] },

  // ── OUTCOME ──────────────────────────────────────────────
  status: {
    type: String,
    enum: ['solved', 'attempted'],
    default: 'attempted'
  },
  // 'solved'    → all test cases passed on submit
  // 'attempted' → user ran/submitted but didn't pass

  // ── PERFORMANCE METRICS ───────────────────────────────────
  solveTimeSeconds: { type: Number, default: 0 },
  // Time from first keystroke to successful submit, in seconds.
  // We track startTime in IDE and send (Date.now() - startTime) / 1000.

  hintsUsed:    { type: Number, default: 0 },
  // Count of times the Hint button was clicked OR Lens sent a hint.
  // Incremented in IDE on each hint request.

  lensUsed:     { type: Boolean, default: false },
  // Did the user activate the Lens (phone camera) feature?

  voiceUsed:    { type: Boolean, default: false },
  // Did the user use the Thoughts (microphone) feature?

  // ── TIMESTAMPS ───────────────────────────────────────────
  solvedAt:     { type: Date },
  // Only set when status becomes 'solved'. Used for heatmap + streak.

  firstAttemptAt: { type: Date, default: Date.now },
  // When they first opened/started this problem.

}, {
  timestamps: true,
  // Adds createdAt and updatedAt automatically.
});

// ── COMPOUND INDEX ────────────────────────────────────────────
// Ensures one document per user+problem combination.
// If user solves the same problem again, we UPDATE the existing
// record (upsert) rather than creating a duplicate.
userProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
