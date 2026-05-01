// server/controllers/problemController.js
const Problem = require('../models/Problem');

exports.getProblems = async (req, res) => {
  try {
    const problems = await Problem.find();
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProblemsByCourse = async (req, res) => {
  try {
    const name = req.params.name;
    let query = name === 'DSA' ? { problemId: { $regex: 'DSA' } } : { language: name };
    const problems = await Problem.find(query);
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};