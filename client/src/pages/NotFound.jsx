import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        {/* 404 Text */}
        <h1 className="text-[10rem] font-black italic tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-zinc-600 to-zinc-900">
          404
        </h1>

        <div className="w-16 h-1 bg-cyan-500 mx-auto mb-6 rounded-full" />

        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-3">
          Page Not Found
        </h2>
        <p className="text-zinc-500 text-sm mb-10 max-w-sm mx-auto leading-relaxed">
          Looks like you wandered off the learning path. This page doesn't exist in our system.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-xl hover:shadow-[0_0_20px_#00E5FF] transition-all text-sm uppercase tracking-widest"
          >
            Back to Modules
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-zinc-900 text-zinc-400 font-bold rounded-xl border border-zinc-800 hover:border-zinc-600 transition-all text-sm uppercase tracking-widest"
          >
            Go Back
          </button>
        </div>
      </motion.div>

    </div>
  );
};

export default NotFound;