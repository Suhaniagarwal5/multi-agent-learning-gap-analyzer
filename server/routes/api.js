// server/routes/api.js
const express = require('express');
const router = express.Router();

const { getProblems, getProblemsByCourse } = require('../controllers/problemController');
const { saveProgress, updateHintCount } = require('../controllers/progressController');
const { getDashboard } = require('../controllers/dashboardController');
const { saveSubmission, getSubmissions } = require('../controllers/submissionController');

// ── Problems ──
router.get('/problems', getProblems);
router.get('/problems/course/:name', getProblemsByCourse);

// ── Progress & Scoring ──
router.post('/progress', saveProgress);
router.patch('/progress/hint', updateHintCount);

// ── Dashboard ──
router.get('/dashboard/:userId', getDashboard);

// ── Code Submissions ──
router.post('/submissions', saveSubmission);
router.get('/submissions/:problemId', getSubmissions);

module.exports = router;