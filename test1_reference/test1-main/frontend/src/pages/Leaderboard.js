import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Trophy, Medal, Crown, TrendingUp, Flame, Star, Award } from 'lucide-react';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [timeframe, setTimeframe] = useState('all_time');
  const [leaderboardType, setLeaderboardType] = useState('global'); // global or local
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = leaderboardType === 'global' ? '/leaderboard/global' : '/leaderboard/local';
      const response = await axios.get(`${endpoint}?timeframe=${timeframe}&limit=100`);
      setLeaderboard(response.data.leaderboard || []);
      setCurrentUserRank(response.data.current_user_rank);
      setTotalUsers(response.data.total_users);
      setCountry(response.data.country || '');
    } catch (error) {
      toast.error('Failed to load leaderboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [leaderboardType, timeframe]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);


  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />;
    return <Trophy className="w-5 h-5 text-gray-500" />;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/50';
    if (rank === 2) return 'from-gray-300/20 to-gray-400/10 border-gray-400/50';
    if (rank === 3) return 'from-orange-500/20 to-orange-600/10 border-orange-500/50';
    return 'from-[#1a1a24] to-[#121218] border-[#00F0FF]/20';
  };

  const getTopThreeGlow = (rank) => {
    if (rank === 1) return 'shadow-lg shadow-yellow-500/30';
    if (rank === 2) return 'shadow-lg shadow-gray-400/20';
    if (rank === 3) return 'shadow-lg shadow-orange-500/20';
    return '';
  };

  const timeframes = [
    { value: 'all_time', label: 'All Time' },
    { value: 'monthly', label: 'This Month' },
    { value: 'weekly', label: 'This Week' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">
            🏆 Leaderboard
          </h1>
          <p className="text-gray-400 text-lg">
            {leaderboardType === 'global' 
              ? 'Top warriors worldwide ranked by level and XP'
              : `Top warriors in ${country} ranked by level and XP`
            }
          </p>
        </div>

        {/* Leaderboard Type Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setLeaderboardType('global')}
            className={`px-8 py-4 rounded-lg font-bold transition-all flex items-center gap-2 ${
              leaderboardType === 'global'
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] text-white shadow-lg shadow-[#00F0FF]/50'
                : 'bg-[#1a1a24] text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            <Trophy className="w-6 h-6" />
            Global Leaderboard
          </button>
          <button
            onClick={() => setLeaderboardType('local')}
            className={`px-8 py-4 rounded-lg font-bold transition-all flex items-center gap-2 ${
              leaderboardType === 'local'
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] text-white shadow-lg shadow-[#00F0FF]/50'
                : 'bg-[#1a1a24] text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            <Award className="w-6 h-6" />
            Local Leaderboard {country && `(${country})`}
          </button>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-8">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                timeframe === tf.value
                  ? 'bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] text-white shadow-lg shadow-[#00F0FF]/50'
                  : 'bg-[#1a1a24] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Current User Rank Card */}
        {currentUserRank && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#00F0FF]/10 to-[#FF00F5]/10 border-2 border-[#00F0FF] rounded-xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00F0FF] to-[#FF00F5] rounded-full flex items-center justify-center">
                  <span className="text-2xl font-black">#{currentUserRank}</span>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Your Rank</p>
                  <p className="text-2xl font-black">{user?.username}</p>
                  <p className="text-gray-400">Level {user?.level} • {user?.totalXp?.toLocaleString()} XP</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Out of</p>
                <p className="text-3xl font-black text-[#00F0FF]">{totalUsers}</p>
                <p className="text-sm text-gray-400">total users</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="order-1"
            >
              <div className={`bg-gradient-to-br ${getRankColor(2)} ${getTopThreeGlow(2)} rounded-xl border p-6 text-center`}>
                <div className="flex justify-center mb-3">
                  {getRankIcon(2)}
                </div>
                <div className="text-6xl font-black mb-2">#2</div>
                <div className="text-xl font-bold mb-1">{leaderboard[1].username}</div>
                <div className="text-sm text-gray-400 mb-2">Level {leaderboard[1].level}</div>
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold">{leaderboard[1].total_xp.toLocaleString()} XP</span>
                </div>
                {leaderboard[1].current_streak > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm">{leaderboard[1].current_streak} day streak</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="order-2"
            >
              <div className={`bg-gradient-to-br ${getRankColor(1)} ${getTopThreeGlow(1)} rounded-xl border p-6 text-center transform scale-110`}>
                <div className="flex justify-center mb-3">
                  {getRankIcon(1)}
                </div>
                <div className="text-7xl font-black mb-2">#1</div>
                <div className="text-2xl font-bold mb-1">{leaderboard[0].username}</div>
                <div className="text-sm text-gray-400 mb-2">Level {leaderboard[0].level}</div>
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="font-bold text-lg">{leaderboard[0].total_xp.toLocaleString()} XP</span>
                </div>
                {leaderboard[0].current_streak > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm">{leaderboard[0].current_streak} day streak</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="order-3"
            >
              <div className={`bg-gradient-to-br ${getRankColor(3)} ${getTopThreeGlow(3)} rounded-xl border p-6 text-center`}>
                <div className="flex justify-center mb-3">
                  {getRankIcon(3)}
                </div>
                <div className="text-6xl font-black mb-2">#3</div>
                <div className="text-xl font-bold mb-1">{leaderboard[2].username}</div>
                <div className="text-sm text-gray-400 mb-2">Level {leaderboard[2].level}</div>
                <div className="flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold">{leaderboard[2].total_xp.toLocaleString()} XP</span>
                </div>
                {leaderboard[2].current_streak > 0 && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm">{leaderboard[2].current_streak} day streak</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="space-y-2">
          {leaderboard.slice(3).map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gradient-to-br ${
                player.is_current_user 
                  ? 'from-[#00F0FF]/20 to-[#FF00F5]/20 border-[#00F0FF]' 
                  : 'from-[#1a1a24] to-[#121218] border-gray-700'
              } rounded-xl border p-4 hover:border-[#00F0FF]/40 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-xl font-black text-gray-400">#{player.rank}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{player.username}</span>
                      {player.is_current_user && (
                        <span className="px-2 py-0.5 bg-[#00F0FF]/20 text-[#00F0FF] text-xs rounded-full">YOU</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Level {player.level}</span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {player.total_xp.toLocaleString()} XP
                      </span>
                      {player.current_streak > 0 && (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" />
                          {player.current_streak} days
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">{player.discipline_score}/100</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-20">
            <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No rankings available yet</p>
            <p className="text-gray-500 mt-2">Be the first to level up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
