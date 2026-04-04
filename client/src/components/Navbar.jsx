import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Trophy, LayoutDashboard, BookOpen, User as UserIcon, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-black/90 backdrop-blur-xl sticky top-0 z-50">
      <Link to="/courses" className="flex items-center gap-2 group">
        <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <span className="text-black font-black italic text-lg">S</span>
        </div>
        <span className="text-xl font-black italic tracking-tighter text-white uppercase">Sutra AI</span>
      </Link>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-[11px] font-bold tracking-[0.2em] text-zinc-500">
          <Link to="/courses" className="hover:text-cyan-400 flex items-center gap-2 transition-all"><BookOpen size={14}/> MODULES</Link>
          <Link to="/dashboard" className="hover:text-cyan-400 flex items-center gap-2 transition-all"><LayoutDashboard size={14}/> DASHBOARD</Link>
          <Link to="/achievements" className="hover:text-cyan-400 flex items-center gap-2 transition-all"><Trophy size={14}/> ACHIEVEMENTS</Link>
        </div>

        {user && (
          <div className="relative pl-6 border-l border-zinc-800" ref={dropdownRef}>
            
            {/* Avatar Button */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="relative w-9 h-9 rounded-full border-2 border-zinc-900 object-cover" />
                ) : (
                  <div className="relative w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-cyan-400 border-2 border-zinc-900">
                    <UserIcon size={18} />
                  </div>
                )}
              </div>
              <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                
                {/* User Info */}
                <div className="p-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-cyan-400">
                        <UserIcon size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">
                        {user.displayName || 'Sutra User'}
                      </p>
                      <p className="text-zinc-500 text-xs truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => { navigate('/dashboard'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all text-sm"
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </button>
                  <button
                    onClick={() => { navigate('/achievements'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all text-sm"
                  >
                    <Trophy size={16} /> Achievements
                  </button>
                </div>

                {/* Logout */}
                <div className="p-2 border-t border-zinc-800">
                  <button
                    onClick={() => { logout(); navigate('/login'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-sm"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;