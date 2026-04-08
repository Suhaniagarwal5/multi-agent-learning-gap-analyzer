import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    const token = localStorage.getItem('token');
    if (token) navigate('/courses');
    else navigate('/auth');
  };

  return (
    <div className="h-[90vh] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-7xl font-bold text-center mb-6 leading-tight"
      >
        MASTER THE <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">CODE LOGIC</span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-400 max-w-lg text-center mb-10 text-lg"
      >
        Adaptive AI training for C, Python & DSA. 
        Detect learning gaps, fix logic errors, and master algorithms with Gemini-powered guidance.
      </motion.p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStart}
        className="px-8 py-4 bg-primary text-black font-bold text-lg rounded-full shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_40px_rgba(0,229,255,0.6)] transition-all"
      >
        START MASTER TRAINING
      </motion.button>
    </div>
  );
};

export default Home;