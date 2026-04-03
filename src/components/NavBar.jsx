// ══════════════════════════════════════════════════════
//  FABER.NET · src/components/NavBar.jsx
// ══════════════════════════════════════════════════════
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Zap, Home, ShoppingBag, Play, BookOpen,
  User, BarChart2, Bell, LogOut, Shield, Moon, Sun, MessageSquare
} from 'lucide-react';

const navItems = [
  { to: '/feed',      icon: Home,       label: 'FEED'      },
  { to: '/reels',     icon: Play,       label: 'REELS'     },
  { to: '/tutorials', icon: BookOpen,   label: 'LEARN'     },
  { to: '/market',    icon: ShoppingBag,label: 'MARKET'    },
  { to: '/profile',   icon: User,       label: 'PROFILE'   },
];

export default function NavBar() {
  const { user, logout, isAdmin, setChatTarget } = useAuth();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    const dark = document.documentElement.classList.toggle('dark');
    setIsDark(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <>
      {/* ─── TOP BAR (desktop) ─────────────────────────────── */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl h-14 items-center px-6">
        <div className="flex items-center gap-2 mr-8">
          <Zap className="text-sky-400 w-5 h-5 animate-pulse" />
          <span className="font-black text-lg tracking-tighter italic text-white">FABER.NET</span>
          <span className="text-[9px] font-bold text-sky-400/50 bg-sky-400/10 px-1.5 py-0.5 rounded ml-1">BETA</span>
        </div>

        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all
                 ${isActive ? 'bg-sky-500/15 text-sky-400' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`
              }>
              <Icon className="w-3.5 h-3.5" />{label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest transition-all
                 ${isActive ? 'bg-amber-500/15 text-amber-400' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`
              }>
              <Shield className="w-3.5 h-3.5" />ADMIN
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => setChatTarget({ id: '', name: 'Global Chat' })} 
            className="p-2 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-all shadow-[0_0_15px_rgba(14,165,233,0.1)] position-relative" title="Messenger">
            <MessageSquare className="w-4 h-4" />
          </button>
          <div className="text-right border-l border-white/5 pl-3">
            <p className="text-[10px] font-bold text-white">{user?.name}</p>
            <p className="text-[9px] text-sky-400/70">{user?.node_id}</p>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all" title="Toggle Theme">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={handleLogout} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── BOTTOM NAV (mobile) ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all
                 ${isActive ? 'text-sky-400' : 'text-slate-600 hover:text-slate-400'}`
              }>
              <Icon className="w-5 h-5" />
              <span className="text-[8px] font-bold tracking-widest">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
