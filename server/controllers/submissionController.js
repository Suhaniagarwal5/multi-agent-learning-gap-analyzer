// server/controllers/submissionController.js
const CodeSubmission = require('../models/CodeSubmission');

exports.saveSubmission = async (req, res) => {
  try {
    const { userId, problemId, code, language, status } = req.body;
    const submission = new CodeSubmission({
      userId, problemId, code: code.trim(), language: language || "python", status: status || "attempted"
    });
    await submission.save();
    res.status(201).json({ message: "Submission saved", id: submission._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const submissions = await CodeSubmission.find(
      { problemId: req.params.problemId },
      { userId: 1, code: 1, submittedAt: 1, status: 1, _id: 1 }
    ).sort({ submittedAt: -1 }).limit(200);
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};