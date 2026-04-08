import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuth = (e) => {
    e.preventDefault();
    // Simulate Login
    localStorage.setItem('token', 'dummy-jwt');
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md p-8 bg-surface rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        <h2 className="text-3xl font-bold text-center mb-8">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        <button className="w-full py-3 bg-white text-black font-semibold rounded mb-4 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-800"></div>
          <span className="relative z-10 bg-surface px-3 text-gray-500 text-sm">OR</span>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
             <input type="text" placeholder="Username" className="w-full bg-background border border-gray-800 rounded p-3 focus:border-primary focus:outline-none transition-colors" />
          )}
          <input type="email" placeholder="Email" className="w-full bg-background border border-gray-800 rounded p-3 focus:border-primary focus:outline-none transition-colors" />
          <input type="password" placeholder="Password" className="w-full bg-background border border-gray-800 rounded p-3 focus:border-primary focus:outline-none transition-colors" />
          
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 text-black font-bold rounded mt-2 hover:opacity-90 transition-opacity">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;