import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import { 
  User, Mail, Calendar, Trophy, Flame, Target, 
  Zap, Clock, CheckCircle, LogOut
} from 'lucide-react';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);

  const stats = [
    { icon: <Trophy className="w-5 h-5" />, label: 'Level', value: user?.level || 1, color: '#00F0FF' },
    { icon: <Zap className="w-5 h-5" />, label: 'Total XP', value: user?.xp || 0, color: '#FAFF00' },
    { icon: <Flame className="w-5 h-5" />, label: 'Current Streak', value: `${user?.current_streak || 0} days`, color: '#FF0099' },
    { icon: <Target className="w-5 h-5" />, label: 'Discipline', value: `${user?.discipline_score || 50}/100`, color: '#39FF14' },
    { icon: <CheckCircle className="w-5 h-5" />, label: 'Tasks Done', value: user?.total_tasks_completed || 0, color: '#00F0FF' },
    { icon: <Clock className="w-5 h-5" />, label: 'Longest Streak', value: `${user?.longest_streak || 0} days`, color: '#FF0099' },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8" data-testid="profile-page">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF0099] to-[#FF0055] flex items-center justify-center mx-auto mb-4"
          >
            <User className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black font-orbitron mb-1" data-testid="profile-username">
            {user?.username}
          </h1>
          <p className="text-[#a0a0b0] flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {user?.email}
          </p>
        </div>

        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center mb-8"
          data-testid="level-card"
        >
          <div className="mb-4">
            <span className="text-sm text-[#a0a0b0] uppercase tracking-wider">Current Level</span>
            <div className="text-7xl font-black font-orbitron text-[#00F0FF]">
              {user?.level || 1}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FAFF00]" />
              <span className="font-mono">{user?.xp || 0} XP Total</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#FF0099]" />
              <span className="font-mono">{user?.current_streak || 0} Day Streak</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-5 text-center"
              data-testid={`profile-stat-${i}`}
            >
              <div 
                className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="text-xl font-bold font-orbitron" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs text-[#a0a0b0] uppercase tracking-wider mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Account Info */}
        <div className="glass-card p-6 mb-8" data-testid="account-info">
          <h2 className="text-lg font-bold font-orbitron mb-4">Account Info</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-[#a0a0b0]">Member Since</span>
              <span className="font-mono">
                {user?.created_at 
                  ? new Date(user.created_at).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <span className="text-[#a0a0b0]">Email</span>
              <span className="font-mono">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[#a0a0b0]">Username</span>
              <span className="font-mono">{user?.username}</span>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className="w-full cyber-button-secondary py-4 flex items-center justify-center gap-2"
          data-testid="profile-logout-btn"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </motion.button>
      </div>
    </Layout>
  );
};

export default Profile;
