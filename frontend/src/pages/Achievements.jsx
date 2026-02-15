import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Layout from '../components/Layout';
import { 
  Trophy, Award, Star, Shield, Crown, Flame, 
  Zap, Target, TrendingUp, Lock, Sword
} from 'lucide-react';

const iconMap = {
  'Sword': Sword,
  'Shield': Shield,
  'Trophy': Trophy,
  'Crown': Crown,
  'Flame': Flame,
  'Zap': Zap,
  'Star': Star,
  'TrendingUp': TrendingUp,
  'Award': Award,
  'Target': Target
};

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await axios.get('/achievements');
      setAchievements(response.data);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
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
            className="w-16 h-16 border-4 border-[#FAFF00] border-t-transparent rounded-full"
          />
        </div>
      </Layout>
    );
  }

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8" data-testid="achievements-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase font-orbitron mb-2" data-testid="achievements-title">
            Achievements
          </h1>
          <p className="text-[#a0a0b0]">
            {unlocked.length} of {achievements.length} unlocked
          </p>
        </div>

        {/* Progress Bar */}
        <div className="glass-card p-6 mb-8" data-testid="achievement-progress">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#a0a0b0]">Overall Progress</span>
            <span className="text-sm font-mono text-[#FAFF00]">
              {Math.round((unlocked.length / achievements.length) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(unlocked.length / achievements.length) * 100}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-[#FAFF00] to-[#FF9900] rounded-full"
            />
          </div>
        </div>

        {/* Unlocked Achievements */}
        {unlocked.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold font-orbitron mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FAFF00]" />
              Unlocked ({unlocked.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {unlocked.map((achievement, i) => {
                const IconComponent = iconMap[achievement.icon] || Trophy;
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="achievement-card unlocked glass-card p-5 flex items-center gap-4"
                    data-testid={`achievement-unlocked-${i}`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FAFF00]/20 to-[#FF9900]/20 flex items-center justify-center">
                      <IconComponent className="w-7 h-7 text-[#FAFF00]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{achievement.name}</h3>
                      <p className="text-sm text-[#a0a0b0]">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Zap className="w-4 h-4 text-[#00F0FF]" />
                        <span className="text-xs font-mono text-[#00F0FF]">+{achievement.xp_reward} XP</span>
                      </div>
                    </div>
                    <div className="text-2xl">✓</div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locked Achievements */}
        {locked.length > 0 && (
          <div>
            <h2 className="text-xl font-bold font-orbitron mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#a0a0b0]" />
              Locked ({locked.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {locked.map((achievement, i) => {
                const IconComponent = iconMap[achievement.icon] || Trophy;
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="achievement-card locked glass-card p-5 flex items-center gap-4"
                    data-testid={`achievement-locked-${i}`}
                  >
                    <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center">
                      <IconComponent className="w-7 h-7 text-[#a0a0b0]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1 text-[#a0a0b0]">{achievement.name}</h3>
                      <p className="text-sm text-[#666]">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Zap className="w-4 h-4 text-[#666]" />
                        <span className="text-xs font-mono text-[#666]">+{achievement.xp_reward} XP</span>
                      </div>
                    </div>
                    <Lock className="w-5 h-5 text-[#a0a0b0]" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Achievements;
