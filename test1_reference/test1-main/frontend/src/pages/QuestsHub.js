import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Trophy, Zap, Calendar, Target, CheckCircle2, 
  Flame, Star, Clock, TrendingUp, Award, Gift
} from 'lucide-react';

const QuestsHub = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [dailyQuests, setDailyQuests] = useState([]);
  const [weeklyQuests, setWeeklyQuests] = useState([]);
  const [monthlyQuests, setMonthlyQuests] = useState([]);
  const [microQuests, setMicroQuests] = useState([]);
  const [globalQuests, setGlobalQuests] = useState([]);
  const [beginnerQuests, setBeginnerQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [completing, setCompleting] = useState(null);

  useEffect(() => {
    fetchAllQuests();
  }, []);

  const fetchAllQuests = async () => {
    setLoading(true);
    try {
      const [daily, weekly, monthly, micro, global, beginner] = await Promise.all([
        axios.get('/quests/daily'),
        axios.get('/quests/weekly'),
        axios.get('/quests/monthly'),
        axios.get('/quests/micro'),
        axios.get('/quests/global'),
        user?.level < 5 ? axios.get('/quests/beginner') : Promise.resolve({ data: { quests: [] } })
      ]);

      setDailyQuests(daily.data.quests || []);
      setWeeklyQuests(weekly.data.quests || []);
      setMonthlyQuests(monthly.data.quests || []);
      setMicroQuests(micro.data.quests || []);
      setGlobalQuests(global.data.quests || []);
      setBeginnerQuests(beginner.data.quests || []);
    } catch (error) {
      toast.error('Failed to load quests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (questId, questType) => {
    setCompleting(questId);
    try {
      const isGlobal = questType === 'global';
      const endpoint = isGlobal ? `/quests/global/${questId}/complete` : `/quests/${questId}/complete?quest_type=${questType}`;
      const response = await axios.post(endpoint);
      
      if (response.data.success) {
        toast.success(`Quest Completed! +${response.data.xp_gained} XP`, {
          description: response.data.level_up ? `🎉 Level Up! Now level ${response.data.new_level}` : ''
        });

        // Update user data
        if (response.data.level_up) {
          updateUser({ level: response.data.new_level });
        }

        // Refresh quests
        fetchAllQuests();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete quest');
    } finally {
      setCompleting(null);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'text-green-400 bg-green-400/10',
      medium: 'text-yellow-400 bg-yellow-400/10',
      hard: 'text-orange-400 bg-orange-400/10',
      legendary: 'text-purple-400 bg-purple-400/10'
    };
    return colors[difficulty] || colors.medium;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      productivity: <Target className="w-4 h-4" />,
      learning: <Star className="w-4 h-4" />,
      wellness: <Flame className="w-4 h-4" />,
      discipline: <Award className="w-4 h-4" />
    };
    return icons[category] || icons.productivity;
  };

  const QuestCard = ({ quest, questType }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group bg-gradient-to-br ${
        quest.completed 
          ? 'from-gray-800/40 to-gray-900/40' 
          : 'from-[#1a1a24] to-[#121218]'
      } rounded-xl border ${
        quest.completed
          ? 'border-gray-700/30'
          : 'border-[#00F0FF]/20'
      } p-6 hover:border-[#00F0FF]/40 transition-all duration-300`}
    >
      {/* Difficulty Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(quest.difficulty)}`}>
          {quest.difficulty?.toUpperCase()}
        </span>
        <span className="text-[#00F0FF] font-bold text-sm">+{quest.xp_reward} XP</span>
      </div>

      {/* Quest Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-lg ${
          quest.completed ? 'bg-green-500/20' : 'bg-[#00F0FF]/10'
        } flex items-center justify-center`}>
          {quest.completed ? (
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          ) : (
            <span className="text-2xl">{getCategoryIcon(quest.category)}</span>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className={`text-lg font-bold mb-1 ${
            quest.completed ? 'text-gray-400 line-through' : 'text-white'
          }`}>
            {quest.title}
          </h3>
          {quest.description && (
            <p className="text-sm text-gray-400">{quest.description}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{quest.progress}/{quest.target}</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(quest.progress / quest.target) * 100}%` }}
            className="h-full bg-gradient-to-r from-[#00F0FF] to-[#FF00F5]"
          />
        </div>
      </div>

      {/* Quest Type & Category */}
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2 py-1 rounded bg-[#00F0FF]/10 text-[#00F0FF] text-xs">
          {quest.type}
        </span>
        <span className="px-2 py-1 rounded bg-gray-800 text-gray-300 text-xs">
          {quest.category}
        </span>
      </div>

      {/* Complete Button */}
      {!quest.completed && (
        <button
          onClick={() => completeQuest(quest.id, questType)}
          disabled={completing === quest.id}
          className="w-full py-3 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] text-white rounded-lg font-bold hover:shadow-lg hover:shadow-[#00F0FF]/50 transition-all duration-300 disabled:opacity-50"
        >
          {completing === quest.id ? 'Completing...' : 'Complete Quest'}
        </button>
      )}

      {quest.completed && (
        <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
          <CheckCircle2 className="w-5 h-5" />
          Completed!
        </div>
      )}
    </motion.div>
  );

  const tabs = [
    { id: 'daily', label: 'Daily', icon: <Calendar className="w-5 h-5" />, count: dailyQuests.length },
    { id: 'weekly', label: 'Weekly', icon: <Trophy className="w-5 h-5" />, count: weeklyQuests.length },
    { id: 'monthly', label: 'Monthly', icon: <Award className="w-5 h-5" />, count: monthlyQuests.length },
    { id: 'micro', label: 'Micro', icon: <Zap className="w-5 h-5" />, count: microQuests.length },
    { id: 'global', label: 'Global', icon: <Target className="w-5 h-5" />, count: globalQuests.length },
    ...(user?.level < 5 ? [{ id: 'beginner', label: 'Beginner', icon: <Star className="w-5 h-5" />, count: beginnerQuests.length }] : [])
  ];

  const getCurrentQuests = () => {
    switch (activeTab) {
      case 'daily': return { quests: dailyQuests, type: 'daily' };
      case 'weekly': return { quests: weeklyQuests, type: 'weekly' };
      case 'monthly': return { quests: monthlyQuests, type: 'monthly' };
      case 'micro': return { quests: microQuests, type: 'micro' };
      case 'global': return { quests: globalQuests, type: 'global' };
      case 'beginner': return { quests: beginnerQuests, type: 'beginner' };
      default: return { quests: dailyQuests, type: 'daily' };
    }
  };

  const { quests, type } = getCurrentQuests();
  const completedCount = quests.filter(q => q.completed).length;
  const totalXP = quests.reduce((sum, q) => sum + (q.completed ? q.xp_reward : 0), 0);
  const potentialXP = quests.reduce((sum, q) => sum + (!q.completed ? q.xp_reward : 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading quests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">
            Quest Hub
          </h1>
          <p className="text-gray-400 text-lg">
            Complete quests to earn XP and level up! AI generates new quests daily.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-[#00F0FF]" />
              <span className="text-gray-400">Completed</span>
            </div>
            <p className="text-3xl font-black text-white">{completedCount}/{quests.length}</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-green-500/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-6 h-6 text-green-400" />
              <span className="text-gray-400">XP Earned</span>
            </div>
            <p className="text-3xl font-black text-green-400">{totalXP}</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-yellow-500/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-6 h-6 text-yellow-400" />
              <span className="text-gray-400">Potential XP</span>
            </div>
            <p className="text-3xl font-black text-yellow-400">{potentialXP}</p>
          </div>

          <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-purple-500/20 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <span className="text-gray-400">Total Quests</span>
            </div>
            <p className="text-3xl font-black text-purple-400">
              {dailyQuests.length + weeklyQuests.length + monthlyQuests.length + microQuests.length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] text-white shadow-lg shadow-[#00F0FF]/50'
                  : 'bg-[#1a1a24] text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-gray-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quest Grid */}
        {quests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {quests.map((quest) => (
                <QuestCard key={quest.id} quest={quest} questType={type} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <Clock className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No {activeTab} quests available yet</p>
            <p className="text-gray-500 mt-2">Check back soon for AI-generated quests!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestsHub;
