import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, User, ArrowRight } from 'lucide-react';

const Login = () => {
  const { googleLogin, loginWithEmail, registerWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        await loginWithEmail(formData.email, formData.password);
      } else {
        await registerWithEmail(formData.email, formData.password, formData.name);
      }
      navigate('/courses');
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await resetPassword(formData.email);
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  const handleGoogle = async () => {
    try {
      await googleLogin();
      navigate('/courses');
    } catch (err) { 
      setError("Google Login Failed"); 
    }
  };

  // FORGOT PASSWORD SCREEN
  if (isForgot) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#00E5FF10_0%,_transparent_60%)]"></div>
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center border border-zinc-800 shadow-[0_0_15px_#00E5FF40]">
            <Mail size={32} className="text-[#00E5FF]" />
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter">RESET PASSWORD</h1>
          <p className="text-gray-500 text-sm mt-2">We'll send a reset link to your email</p>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 text-xs p-3 rounded-lg mb-4 text-center border border-red-500/20">{error}</div>}
        {success && <div className="bg-green-500/10 text-green-500 text-xs p-3 rounded-lg mb-4 text-center border border-green-500/20">{success}</div>}

        <form onSubmit={handleForgot} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-500" size={18}/>
            <input type="email" placeholder="Your Email Address" required
              className="w-full bg-black/50 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#00E5FF] outline-none"
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <button type="submit" className="w-full bg-[#00E5FF] text-black font-bold py-3 rounded-xl hover:shadow-[0_0_20px_#00E5FF] transition-all flex justify-center items-center gap-2">
            SEND RESET LINK <ArrowRight size={18}/>
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Remember your password?{' '}
          <button onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }} className="text-[#00E5FF] font-bold hover:underline">
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );

  // MAIN LOGIN/REGISTER SCREEN
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#00E5FF10_0%,_transparent_60%)]"></div>
      
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl w-full max-w-md relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-black rounded-full mx-auto mb-4 flex items-center justify-center border border-zinc-800 shadow-[0_0_15px_#00E5FF40]">
            <Zap size={32} className="text-[#00E5FF]" />
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter">
            {isLogin ? "WELCOME BACK" : "JOIN SUTRA"}
          </h1>
          <p className="text-gray-500 text-sm mt-2">Access the Logic-Level Learning Ecosystem</p>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 text-xs p-3 rounded-lg mb-4 text-center border border-red-500/20">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-gray-500" size={18}/>
              <input type="text" placeholder="Full Name" required 
                className="w-full bg-black/50 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#00E5FF] outline-none"
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 text-gray-500" size={18}/>
            <input type="email" placeholder="Email Address" required 
              className="w-full bg-black/50 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#00E5FF] outline-none"
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 text-gray-500" size={18}/>
            <input type="password" placeholder="Password" required 
              className="w-full bg-black/50 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#00E5FF] outline-none"
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {/* FORGOT PASSWORD LINK */}
          {isLogin && (
            <div className="text-right">
              <button type="button" onClick={() => { setIsForgot(true); setError(''); }} className="text-xs text-gray-500 hover:text-[#00E5FF] transition-colors">
                Forgot Password?
              </button>
            </div>
          )}

          <button type="submit" className="w-full bg-[#00E5FF] text-black font-bold py-3 rounded-xl hover:shadow-[0_0_20px_#00E5FF] transition-all flex justify-center items-center gap-2">
            {isLogin ? "LOGIN" : "CREATE ACCOUNT"} <ArrowRight size={18}/>
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="h-px bg-zinc-800 flex-1"></div>
          <span className="text-zinc-600 text-xs font-bold">OR</span>
          <div className="h-px bg-zinc-800 flex-1"></div>
        </div>

        <button onClick={handleGoogle} className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-200 transition-all">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="G" />
          Continue with Google
        </button>

        <p className="text-center text-gray-500 text-sm mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-[#00E5FF] font-bold hover:underline">
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;