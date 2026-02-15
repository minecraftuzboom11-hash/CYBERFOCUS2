import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext, GameContext } from '../App';
import Layout from '../components/Layout';
import { Target, Play, Pause, RotateCcw, CheckCircle, Clock, Zap } from 'lucide-react';

const FocusMode = () => {
  const { fetchCurrentUser } = useContext(AuthContext);
  const { showLevelUp, showXpGain } = useContext(GameContext);
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && session) {
      handleComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/focus/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleStart = async () => {
    try {
      const response = await axios.post('/focus/start', { duration_minutes: duration });
      setSession(response.data);
      setTimeLeft(duration * 60);
      setIsRunning(true);
      toast.success('Focus session started!', { description: 'Stay focused, warrior!' });
    } catch (error) {
      toast.error('Failed to start session');
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSession(null);
    setTimeLeft(duration * 60);
  };

  const handleComplete = async () => {
    if (!session) return;
    setIsRunning(false);

    try {
      const response = await axios.post(`/focus/${session.id}/complete`);
      
      showXpGain(response.data.xp_earned, { x: '50%', y: '40%' });
      toast.success('Focus session completed!', {
        description: `You earned ${response.data.xp_earned} XP!`
      });
      
      if (response.data.level_up) {
        setTimeout(() => showLevelUp(response.data.new_level), 1500);
      }
      
      setSession(null);
      setTimeLeft(duration * 60);
      fetchHistory();
      fetchCurrentUser();
    } catch (error) {
      toast.error('Failed to complete session');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = session ? ((duration * 60 - timeLeft) / (duration * 60)) * 100 : 0;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const durations = [15, 25, 45, 60];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8" data-testid="focus-mode-page">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase font-orbitron mb-2" data-testid="focus-title">
            Focus Mode
          </h1>
          <p className="text-[#a0a0b0]">Deep work. Zero distractions. Maximum XP.</p>
        </div>

        {/* Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center mb-8"
          data-testid="timer-card"
        >
          {/* Timer Circle */}
          <div className="relative w-72 h-72 mx-auto mb-8">
            <svg className="w-full h-full timer-ring" viewBox="0 0 300 300">
              {/* Background circle */}
              <circle
                cx="150"
                cy="150"
                r="140"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="150"
                cy="150"
                r="140"
                fill="none"
                stroke={isRunning ? "#00F0FF" : "#FF0099"}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div 
                className="text-6xl font-black font-orbitron mb-2"
                style={{ color: isRunning ? '#00F0FF' : '#ffffff' }}
                data-testid="timer-display"
              >
                {formatTime(timeLeft)}
              </div>
              <div className="text-[#a0a0b0] text-sm uppercase tracking-wider">
                {isRunning ? 'Stay focused!' : session ? 'Paused' : 'Ready'}
              </div>
            </div>
          </div>

          {/* Duration Selector (when not running) */}
          {!session && (
            <div className="mb-8">
              <p className="text-sm text-[#a0a0b0] mb-3">Select Duration</p>
              <div className="flex justify-center gap-3">
                {durations.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setDuration(d);
                      setTimeLeft(d * 60);
                    }}
                    className={`px-4 py-2 rounded-lg font-mono transition-colors ${
                      duration === d
                        ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                        : 'bg-white/5 text-[#a0a0b0] hover:bg-white/10'
                    }`}
                    data-testid={`duration-${d}`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4">
            {!session ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="cyber-button px-8 py-4 flex items-center gap-2"
                data-testid="start-focus-btn"
              >
                <Play className="w-5 h-5" />
                Start Focus
              </motion.button>
            ) : (
              <>
                {isRunning ? (
                  <button
                    onClick={handlePause}
                    className="px-6 py-3 bg-[#FAFF00]/10 text-[#FAFF00] rounded-lg hover:bg-[#FAFF00]/20 transition-colors flex items-center gap-2"
                    data-testid="pause-btn"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResume}
                    className="px-6 py-3 bg-[#39FF14]/10 text-[#39FF14] rounded-lg hover:bg-[#39FF14]/20 transition-colors flex items-center gap-2"
                    data-testid="resume-btn"
                  >
                    <Play className="w-5 h-5" />
                    Resume
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-white/5 text-[#a0a0b0] rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
                  data-testid="reset-btn"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
                <button
                  onClick={handleComplete}
                  className="cyber-button px-6 py-3 flex items-center gap-2"
                  data-testid="complete-early-btn"
                >
                  <CheckCircle className="w-5 h-5" />
                  Complete
                </button>
              </>
            )}
          </div>

          {/* XP Info */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[#a0a0b0]">
            <Zap className="w-4 h-4 text-[#00F0FF]" />
            <span>Earn <span className="text-[#00F0FF] font-mono">{duration * 2} XP</span> upon completion</span>
          </div>
        </motion.div>

        {/* Recent Sessions */}
        <div className="glass-card p-6" data-testid="history-section">
          <h3 className="text-lg font-bold font-orbitron mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#00F0FF]" />
            Recent Sessions
          </h3>
          
          {history.length === 0 ? (
            <p className="text-[#a0a0b0] text-center py-6">
              No focus sessions yet. Start your first one!
            </p>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((s, i) => (
                <div 
                  key={s.id} 
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  data-testid={`session-${i}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.completed ? 'bg-[#39FF14]' : 'bg-[#a0a0b0]'}`} />
                    <span className="font-mono">{s.duration_minutes}m</span>
                    <span className="text-[#a0a0b0] text-sm">
                      {new Date(s.started_at).toLocaleDateString()}
                    </span>
                  </div>
                  {s.completed && (
                    <span className="text-[#00F0FF] font-mono text-sm">+{s.xp_earned} XP</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FocusMode;
