import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import {
  LayoutDashboard, ListTodo, Swords, Brain, Target,
  BarChart3, Trophy, User, LogOut, Zap
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <ListTodo size={20} />, label: 'Tasks', path: '/tasks' },
    { icon: <Swords size={20} />, label: 'Boss Challenge', path: '/boss-challenge' },
    { icon: <Brain size={20} />, label: 'AI Coach', path: '/ai-coach' },
    { icon: <Target size={20} />, label: 'Focus Mode', path: '/focus' },
    { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/analytics' },
    { icon: <Trophy size={20} />, label: 'Achievements', path: '/achievements' },
  ];

  const xpForCurrentLevel = Math.round(100 * Math.pow(user?.level || 1, 1.5));
  const currentLevelProgress = user?.xp ? (user.xp % xpForCurrentLevel) / xpForCurrentLevel * 100 : 0;

  return (
    <div className="min-h-screen bg-[#050505] grid-background">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-white/5" data-testid="main-navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3" data-testid="logo-link">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#0099FF] flex items-center justify-center">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold font-orbitron tracking-wider hidden sm:block">
                CYBER<span className="text-[#00F0FF]">FOCUS</span>
              </span>
            </Link>

            {/* Center Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-[#00F0FF]/10 text-[#00F0FF]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Right Side - User Info */}
            <div className="flex items-center gap-4">
              {/* XP Bar Mini */}
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-[#a0a0b0] font-mono">Level {user?.level || 1}</div>
                  <div className="w-24 h-2 xp-bar rounded-full overflow-hidden">
                    <motion.div
                      className="xp-bar-fill h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${currentLevelProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Profile */}
              <Link 
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                data-testid="profile-link"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF0099] to-[#FF0055] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.username}</span>
              </Link>

              {/* Logout */}
              <button
                onClick={logout}
                className="p-2 rounded-lg text-white/60 hover:text-[#FF0099] hover:bg-[#FF0099]/10 transition-colors"
                data-testid="logout-btn"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-card border-t border-white/5" data-testid="mobile-navbar">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                location.pathname === item.path
                  ? 'text-[#00F0FF]'
                  : 'text-white/60'
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              {item.icon}
              <span className="text-xs">{item.label.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-24 lg:pb-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
