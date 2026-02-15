import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext, GameContext } from '../App';
import Layout from '../components/Layout';
import { Swords, Trophy, Flame, CheckCircle, Clock } from 'lucide-react';

const BossChallenge = () => {
  const { fetchCurrentUser } = useContext(AuthContext);
  const { showLevelUp, showXpGain } = useContext(GameContext);
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, []);

  const fetchChallenge = async () => {
    try {
      const response = await axios.get('/boss-challenge/today');
      setChallenge(response.data);
    } catch (error) {
      console.error('Failed to fetch challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (completing) return;
    setCompleting(true);
    
    try {
      const response = await axios.post(`/boss-challenge/${challenge.id}/complete`);
      
      showXpGain(response.data.xp_earned, { x: '50%', y: '30%' });
      toast.success('Boss Challenge Conquered!', {
        description: `You earned ${response.data.xp_earned} XP!`
      });
      
      if (response.data.level_up) {
        setTimeout(() => showLevelUp(response.data.new_level), 1500);
      }
      
      setChallenge({ ...challenge, completed: true });
      fetchCurrentUser();
    } catch (error) {
      toast.error('Failed to complete challenge');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#FF0099] border-t-transparent rounded-full"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8" data-testid="boss-challenge-page">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF0099] to-[#FF0055] flex items-center justify-center"
            >
              <Swords className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black uppercase font-orbitron mb-2" data-testid="boss-title">
            Daily Boss Challenge
          </h1>
          <p className="text-[#a0a0b0]">Conquer the challenge. Claim massive XP.</p>
        </motion.div>

        {/* Challenge Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`glass-card p-8 border-2 ${
            challenge?.completed 
              ? 'border-[#39FF14]/50' 
              : 'border-[#FF0099]/50'
          }`}
          data-testid="challenge-card"
        >
          {challenge?.completed ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 rounded-full bg-[#39FF14]/20 flex items-center justify-center mx-auto mb-6"
              >
                <Trophy className="w-12 h-12 text-[#39FF14]" />
              </motion.div>
              <h2 className="text-2xl font-bold font-orbitron mb-2 text-[#39FF14]">
                Challenge Conquered!
              </h2>
              <p className="text-[#a0a0b0] mb-4">
                You've defeated today's boss. Come back tomorrow for a new challenge!
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#39FF14]/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-[#39FF14]" />
                <span className="text-[#39FF14] font-mono">+{challenge.xp_reward} XP Earned</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold font-orbitron mb-4">
                  {challenge?.challenge_text}
                </h2>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#FAFF00]" />
                    <span className="text-[#a0a0b0]">Difficulty:</span>
                    <span className="text-[#FAFF00]">{'★'.repeat(challenge?.difficulty || 3)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#00F0FF]" />
                    <span className="text-[#a0a0b0]">Reward:</span>
                    <span className="text-[#00F0FF] font-mono font-bold">{challenge?.xp_reward} XP</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-lg font-bold mb-4 font-orbitron">Tips for Success:</h3>
                <ul className="space-y-3 text-[#a0a0b0] mb-8">
                  <li className="flex items-start gap-3">
                    <span className="text-[#FF0099]">•</span>
                    Break the challenge into smaller steps
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#FF0099]">•</span>
                    Use Focus Mode to maintain concentration
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[#FF0099]">•</span>
                    Eliminate distractions before starting
                  </li>
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  disabled={completing}
                  className="w-full cyber-button py-4 text-lg flex items-center justify-center gap-2"
                  data-testid="complete-challenge-btn"
                >
                  {completing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-black border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Swords className="w-5 h-5" />
                      Mark as Conquered
                    </>
                  )}
                </motion.button>
              </div>
            </>
          )}
        </motion.div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <div className="glass-card p-6" data-testid="info-card-1">
            <Clock className="w-8 h-8 text-[#00F0FF] mb-3" />
            <h3 className="font-bold mb-2">Daily Reset</h3>
            <p className="text-sm text-[#a0a0b0]">
              A new boss challenge appears every day at midnight UTC. Don't miss out!
            </p>
          </div>
          <div className="glass-card p-6" data-testid="info-card-2">
            <Flame className="w-8 h-8 text-[#FF0099] mb-3" />
            <h3 className="font-bold mb-2">Higher Stakes</h3>
            <p className="text-sm text-[#a0a0b0]">
              Boss challenges reward more XP than regular tasks. Push your limits!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BossChallenge;
