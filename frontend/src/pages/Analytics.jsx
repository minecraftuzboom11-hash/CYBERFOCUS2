import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import { 
  BarChart3, TrendingUp, Target, Clock, CheckCircle,
  Calendar, Zap, Flame
} from 'lucide-react';

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [statsRes, weeklyRes] = await Promise.all([
        axios.get('/analytics/dashboard'),
        axios.get('/analytics/weekly')
      ]);
      setStats(statsRes.data);
      setWeekly(weeklyRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#39FF14] border-t-transparent rounded-full"
          />
        </div>
      </Layout>
    );
  }

  const maxTasks = Math.max(...weekly.map(d => d.tasks_completed), 1);
  const maxFocus = Math.max(...weekly.map(d => d.focus_minutes), 1);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8" data-testid="analytics-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase font-orbitron mb-2" data-testid="analytics-title">
            Analytics
          </h1>
          <p className="text-[#a0a0b0]">Track your progress and performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <CheckCircle className="w-6 h-6" />, label: 'Tasks Done', value: stats?.total_tasks || 0, color: '#39FF14' },
            { icon: <Target className="w-6 h-6" />, label: 'Pending', value: stats?.pending_tasks || 0, color: '#FF0099' },
            { icon: <Clock className="w-6 h-6" />, label: 'Focus This Week', value: `${stats?.focus_minutes_week || 0}m`, color: '#00F0FF' },
            { icon: <Flame className="w-6 h-6" />, label: 'Current Streak', value: `${stats?.streak || 0} days`, color: '#FAFF00' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5"
              data-testid={`stat-card-${i}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div style={{ color: stat.color }}>{stat.icon}</div>
              </div>
              <div className="text-2xl font-black font-orbitron" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs text-[#a0a0b0] uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-8"
          data-testid="weekly-chart"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-[#00F0FF]" />
            <h2 className="text-xl font-bold font-orbitron">Weekly Activity</h2>
          </div>

          {/* Tasks Completed Chart */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#a0a0b0]">Tasks Completed</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#39FF14]" />
                <span className="text-xs text-[#a0a0b0]">Tasks</span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {weekly.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.tasks_completed / maxTasks) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="w-full bg-[#39FF14]/20 rounded-t relative min-h-[4px]"
                    style={{ backgroundColor: 'rgba(57, 255, 20, 0.2)' }}
                  >
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-[#39FF14] rounded-t"
                      style={{ height: '100%' }}
                    />
                  </motion.div>
                  <span className="text-xs text-[#a0a0b0]">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Minutes Chart */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#a0a0b0]">Focus Minutes</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-[#00F0FF]" />
                <span className="text-xs text-[#a0a0b0]">Minutes</span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {weekly.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.focus_minutes / maxFocus) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="w-full rounded-t min-h-[4px]"
                    style={{ backgroundColor: '#00F0FF' }}
                  />
                  <span className="text-xs text-[#a0a0b0]">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Skill Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
            data-testid="skill-breakdown"
          >
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-[#FF0099]" />
              <h2 className="text-xl font-bold font-orbitron">Skill Breakdown</h2>
            </div>
            
            {stats?.skill_breakdown && Object.keys(stats.skill_breakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.skill_breakdown).map(([skill, count], i) => {
                  const total = Object.values(stats.skill_breakdown).reduce((a, b) => a + b, 0);
                  const percentage = (count / total) * 100;
                  const colors = ['#00F0FF', '#FF0099', '#39FF14', '#FAFF00', '#0099FF', '#FF5500'];
                  
                  return (
                    <div key={skill} data-testid={`skill-${i}`}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">{skill}</span>
                        <span className="text-sm text-[#a0a0b0] font-mono">{count} tasks</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: colors[i % colors.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[#a0a0b0] text-center py-6">
                Complete tasks to see your skill breakdown
              </p>
            )}
          </motion.div>

          {/* XP Progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6"
            data-testid="xp-progress"
          >
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-[#00F0FF]" />
              <h2 className="text-xl font-bold font-orbitron">Level Progress</h2>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-6xl font-black font-orbitron text-[#00F0FF] mb-2">
                {user?.level || 1}
              </div>
              <div className="text-sm text-[#a0a0b0] uppercase tracking-wider">Current Level</div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-[#a0a0b0]">Progress to Next Level</span>
                <span className="text-[#00F0FF] font-mono">
                  {stats?.current_xp || 0} / {stats?.next_level_xp || 100} XP
                </span>
              </div>
              <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${((stats?.current_xp || 0) / (stats?.next_level_xp || 100)) * 100}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-[#00F0FF] to-[#0099FF] rounded-full"
                />
              </div>
            </div>

            <div className="text-center text-sm text-[#a0a0b0]">
              {(stats?.next_level_xp || 100) - (stats?.current_xp || 0)} XP until level {(user?.level || 1) + 1}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
