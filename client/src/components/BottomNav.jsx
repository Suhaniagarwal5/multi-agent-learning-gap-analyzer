import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Trophy } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();

  const links = [
    { to: '/courses', icon: <BookOpen size={20} />, label: 'Modules' },
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/achievements', icon: <Trophy size={20} />, label: 'Achievements' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/95 backdrop-blur-xl border-t border-zinc-800">
      <div className="flex items-center justify-around px-4 py-3">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-1 px-6 py-1 rounded-xl transition-all ${
                isActive ? 'text-cyan-400' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              {link.icon}
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {link.label}
              </span>
              {isActive && <div className="w-1 h-1 rounded-full bg-cyan-400" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;