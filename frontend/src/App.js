import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import '@/App.css';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import BossChallenge from './pages/BossChallenge';
import AICoach from './pages/AICoach';
import FocusMode from './pages/FocusMode';
import Analytics from './pages/Analytics';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';

// Components
import LevelUpAnimation from './components/LevelUpAnimation';
import XPAnimation from './components/XPAnimation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configure axios defaults
axios.defaults.baseURL = API;

export const AuthContext = createContext(null);
export const GameContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState(null);
  const [xpGain, setXpGain] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    toast.success('Welcome back, warrior!', {
      description: `Level ${userData.level} • ${userData.current_streak ?? 0} day streak`,
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.info('Logged out. Come back stronger!');
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const showLevelUp = (newLevel) => {
    setLevelUp(newLevel);
  };

  const showXpGain = (amount, position) => {
    setXpGain({ amount, position, id: Date.now() });
    setTimeout(() => setXpGain(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, fetchCurrentUser }}>
      <GameContext.Provider value={{ showLevelUp, showXpGain }}>
        <div className="app-container">
          <div className="noise-overlay" />
          <BrowserRouter>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
                <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
                <Route path="/tasks" element={user ? <TasksPage /> : <Navigate to="/" />} />
                <Route path="/boss-challenge" element={user ? <BossChallenge /> : <Navigate to="/" />} />
                <Route path="/ai-coach" element={user ? <AICoach /> : <Navigate to="/" />} />
                <Route path="/focus" element={user ? <FocusMode /> : <Navigate to="/" />} />
                <Route path="/analytics" element={user ? <Analytics /> : <Navigate to="/" />} />
                <Route path="/achievements" element={user ? <Achievements /> : <Navigate to="/" />} />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
          
          {/* Level Up Animation Overlay */}
          <AnimatePresence>
            {levelUp && (
              <LevelUpAnimation 
                newLevel={levelUp} 
                onClose={() => setLevelUp(null)} 
              />
            )}
          </AnimatePresence>
          
          {/* XP Gain Animation */}
          <AnimatePresence>
            {xpGain && (
              <XPAnimation 
                key={xpGain.id}
                amount={xpGain.amount} 
                position={xpGain.position}
              />
            )}
          </AnimatePresence>
          
          <Toaster 
            theme="dark" 
            position="top-right"
            toastOptions={{
              style: {
                background: '#0a0a12',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
        </div>
      </GameContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
