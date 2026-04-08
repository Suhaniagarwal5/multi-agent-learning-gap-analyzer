const mongoose = require('mongoose');
const fs = require('fs');
const Problem = require('./models/Problem');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI);

const importData = async () => {
  try {
    const data = JSON.parse(fs.readFileSync('./problems.json', 'utf-8'));
    await Problem.deleteMany(); // Purana data saaf karein
    await Problem.insertMany(data);
    console.log("🔥 Data Imported Successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

importData();