import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext, GameContext } from '../App';
import Layout from '../components/Layout';
import { 
  Zap, Target, Brain, Trophy, Flame, Swords,
  TrendingUp, CheckCircle, Clock, ChevronRight
} from 'lucide-react';

const Dashboard = () => {
  const { user, fetchCurrentUser } = useContext(AuthContext);
  const { showLevelUp, showXpGain } = useContext(GameContext);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [bossChallenge, setBossChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasksRes, statsRes, bossRes] = await Promise.all([
        axios.get('/tasks?completed=false'),
        axios.get('/analytics/dashboard'),
        axios.get('/boss-challenge/today')
      ]);

      setTasks(tasksRes.data.slice(0, 5));
      setStats(statsRes.data);
      setBossChallenge(bossRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId, xpReward) => {
    try {
      const response = await axios.patch(`/tasks/${taskId}`, { completed: true });
      
      showXpGain(xpReward, { x: '50%', y: '40%' });
      
      if (response.data.level_up) {
        setTimeout(() => showLevelUp(response.data.new_level), 1500);
      }
      
      fetchDashboardData();
      fetchCurrentUser();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full"
          />
        </div>
      </Layout>
    );
  }

  const currentXP = stats?.current_xp || 0;
  const nextLevelXP = stats?.next_level_xp || 100;
  const xpPercentage = (currentXP / nextLevelXP) * 100;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" data-testid="dashboard-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left"
        >
          <h1 className="text-4xl md:text-5xl font-black uppercase mb-2 font-orbitron" data-testid="dashboard-title">
            Command Center
          </h1>
          <p className="text-[#a0a0b0] text-lg">
            Welcome back, <span className="text-[#00F0FF]">{user?.username}</span>
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { icon: <Trophy className="w-6 h-6" />, label: 'Level', value: user?.level || 1, color: '#00F0FF', testId: 'level-stat' },
            { icon: <Flame className="w-6 h-6" />, label: 'Streak', value: `${user?.current_streak ?? 0} days`, color: '#FF0099', testId: 'streak-stat' },
            { icon: <Target className="w-6 h-6" />, label: 'Discipline', value: `${user?.discipline_score ?? 50}/100`, color: '#39FF14', testId: 'discipline-stat' },
            { icon: <CheckCircle className="w-6 h-6" />, label: 'Tasks Done', value: stats?.total_tasks || 0, color: '#FAFF00', testId: 'tasks-stat' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 md:p-6 stat-card"
              data-testid={stat.testId}
            >
              <div className="flex items-center justify-between mb-3">
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <span className="text-xs uppercase tracking-widest text-[#a0a0b0] font-mono">
                  {stat.label}
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black font-orbitron" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* XP Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6"
          data-testid="xp-progress-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold uppercase font-orbitron">
                Experience Points
              </h3>
              <p className="text-sm text-[#a0a0b0] font-mono">
                {currentXP} / {nextLevelXP} XP
              </p>
            </div>
            <Zap className="w-8 h-8 text-[#00F0FF]" />
          </div>
          <div className="xp-bar h-4 rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="xp-bar-fill rounded-full"
            />
          </div>
          <p className="text-xs text-right mt-2 text-[#a0a0b0] font-mono">
            {Math.round(100 - xpPercentage)}% to next level
          </p>
        </motion.div>

        {/* Boss Challenge */}
        {bossChallenge && !bossChallenge.completed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 border-2 border-[#FF0099]/50"
            data-testid="boss-challenge-card"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Swords className="w-6 h-6 text-[#FF0099]" />
                  <h3 className="text-xl md:text-2xl font-bold uppercase font-orbitron">
                    Daily Boss Challenge
                  </h3>
                </div>
                <p className="text-lg mb-3">{bossChallenge.challenge_text}</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm text-[#a0a0b0] font-mono">
                    Difficulty: <span className="text-[#FAFF00]">{'★'.repeat(bossChallenge.difficulty)}</span>
                  </span>
                  <span className="text-sm text-[#00F0FF] font-mono">
                    Reward: {bossChallenge.xp_reward} XP
                  </span>
                </div>
              </div>
              <Link to="/boss-challenge">
                <button className="cyber-button" data-testid="view-boss-challenge-btn">
                  Accept Challenge
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Active Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
          data-testid="active-tasks-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl md:text-2xl font-bold uppercase font-orbitron">
              Active Tasks
            </h3>
            <Link 
              to="/tasks" 
              className="text-[#00F0FF] hover:text-[#00C0CC] transition-colors flex items-center gap-1"
              data-testid="view-all-tasks-link"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-[#2a2a3e] mx-auto mb-4" />
              <p className="text-[#a0a0b0] mb-4">No active tasks. Create your first mission!</p>
              <Link to="/tasks">
                <button className="cyber-button" data-testid="create-first-task-btn">
                  Create Task
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex items-center justify-between gap-4 hover:border-[#00F0FF]/30"
                  data-testid={`task-item-${i}`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold mb-1 truncate">{task.title}</h4>
                    <div className="flex items-center gap-3 text-sm text-[#a0a0b0] flex-wrap">
                      <span className="font-mono text-xs px-2 py-0.5 bg-white/5 rounded">{task.skill_tree}</span>
                      <span className="font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.estimated_minutes}m
                      </span>
                      <span className="text-[#00F0FF] font-mono">+{task.xp_reward} XP</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#FAFF00] text-sm">{'★'.repeat(task.difficulty)}</span>
                    <button
                      onClick={() => handleCompleteTask(task.id, task.xp_reward)}
                      className="p-2 rounded-lg bg-[#39FF14]/10 text-[#39FF14] hover:bg-[#39FF14]/20 transition-colors"
                      data-testid={`complete-task-${i}`}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Brain className="w-6 h-6" />, label: 'AI Coach', link: '/ai-coach', color: '#FF0099', testId: 'ai-coach-quick' },
            { icon: <Target className="w-6 h-6" />, label: 'Focus Mode', link: '/focus', color: '#00F0FF', testId: 'focus-quick' },
            { icon: <TrendingUp className="w-6 h-6" />, label: 'Analytics', link: '/analytics', color: '#39FF14', testId: 'analytics-quick' },
            { icon: <Trophy className="w-6 h-6" />, label: 'Achievements', link: '/achievements', color: '#FAFF00', testId: 'achievements-quick' },
          ].map((action, i) => (
            <Link key={i} to={action.link} data-testid={action.testId}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="glass-card p-6 text-center cursor-pointer"
              >
                <div 
                  className="w-12 h-12 mx-auto mb-3 flex items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${action.color}15`, color: action.color }}
                >
                  {action.icon}
                </div>
                <div className="text-sm font-bold uppercase font-orbitron">
                  {action.label}
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
