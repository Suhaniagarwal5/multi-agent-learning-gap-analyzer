const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  topic: String,      // <--- THIS WAS MISSING. Add this line!
  problemId: String,
  title: String,
  description: String,
  language: String,
  category: String,
  difficulty: String,
  inputFormat: String,
  outputFormat: String,
  constraints: String,
  explanation: String,
  starterCode: String,
  testCases: [
  {
    input:  { type: String },
    output: { type: String }
  }
]
});

module.exports = mongoose.model('Problem', problemSchema);