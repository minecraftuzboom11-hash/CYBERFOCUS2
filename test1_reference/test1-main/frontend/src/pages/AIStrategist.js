import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Target, Calendar, TrendingUp, Zap, Brain, Award } from 'lucide-react';

const AIStrategist = () => {
  const [vision, setVision] = useState('');
  const [yearlyGoals, setYearlyGoals] = useState(['']);
  const [hasVision, setHasVision] = useState(false);
  const [dailyPriority, setDailyPriority] = useState('');
  const [weeklyAnalysis, setWeeklyAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVision();
    fetchDailyPriority();
    fetchWeeklyAnalysis();
  }, []);

  const fetchVision = async () => {
    try {
      const response = await axios.get('/strategist/vision');
      if (response.data.has_vision) {
        setVision(response.data.vision);
        setYearlyGoals(response.data.yearly_goals || ['']);
        setHasVision(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyPriority = async () => {
    try {
      const response = await axios.get('/strategist/daily-priority');
      setDailyPriority(response.data.priority);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchWeeklyAnalysis = async () => {
    try {
      const response = await axios.get('/strategist/weekly-analysis');
      setWeeklyAnalysis(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveVision = async () => {
    try {
      await axios.post('/strategist/vision', {
        vision,
        yearly_goals: yearlyGoals.filter(g => g.trim())
      });
      toast.success('Vision saved! Your strategic plan is active.');
      setHasVision(true);
      fetchDailyPriority();
    } catch (error) {
      toast.error('Failed to save vision');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white">Loading strategist...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">
          🧠 AI Life Strategist
        </h1>
        <p className="text-gray-400 text-lg mb-8">Define your vision, AI guides your daily actions</p>

        {!hasVision ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-8">
            <h2 className="text-2xl font-bold mb-4">Define Your 5-Year Vision</h2>
            <textarea
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="Where do you see yourself in 5 years? What have you achieved? Who have you become?"
              rows="6"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none mb-4"
            />

            <h3 className="text-xl font-bold mb-3">Yearly Goals (Top 3)</h3>
            {yearlyGoals.map((goal, index) => (
              <input
                key={index}
                type="text"
                value={goal}
                onChange={(e) => {
                  const newGoals = [...yearlyGoals];
                  newGoals[index] = e.target.value;
                  setYearlyGoals(newGoals);
                }}
                placeholder={`Goal ${index + 1}`}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none mb-3"
              />
            ))}
            
            <button
              onClick={() => setYearlyGoals([...yearlyGoals, ''])}
              className="text-[#00F0FF] mb-4"
            >
              + Add Goal
            </button>

            <button
              onClick={handleSaveVision}
              disabled={!vision.trim()}
              className="w-full py-4 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] rounded-lg font-bold text-lg disabled:opacity-50"
            >
              Activate Strategic Mode
            </button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Daily Priority */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-500/20 to-pink-500/10 border-2 border-purple-500/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-8 h-8 text-yellow-400" />
                <h2 className="text-2xl font-bold">Today's AI Priority</h2>
              </div>
              <p className="text-2xl font-bold text-white mb-4">{dailyPriority}</p>
              <button
                onClick={fetchDailyPriority}
                className="px-6 py-2 bg-purple-500 rounded-lg font-bold hover:bg-purple-600"
              >
                Regenerate Priority
              </button>
            </motion.div>

            {/* Weekly Analysis */}
            {weeklyAnalysis && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-green-500/20 p-6">
                  <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                  <p className="text-3xl font-black text-green-400">{weeklyAnalysis.completed_tasks}</p>
                  <p className="text-sm text-gray-400">Tasks Completed</p>
                </div>

                <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-blue-500/20 p-6">
                  <Award className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="text-3xl font-black text-blue-400">{weeklyAnalysis.completion_rate}%</p>
                  <p className="text-sm text-gray-400">Completion Rate</p>
                </div>

                <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-orange-500/20 p-6">
                  <Brain className="w-6 h-6 text-orange-400 mb-2" />
                  <p className="text-3xl font-black text-orange-400">{weeklyAnalysis.focus_sessions}</p>
                  <p className="text-sm text-gray-400">Focus Sessions</p>
                </div>

                <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-purple-500/20 p-6">
                  <Target className="w-6 h-6 text-purple-400 mb-2" />
                  <p className="text-3xl font-black text-purple-400">{weeklyAnalysis.current_streak}</p>
                  <p className="text-sm text-gray-400">Day Streak</p>
                </div>
              </div>
            )}

            {weeklyAnalysis?.procrastination_detected && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-red-400 mb-2">⚠️ Procrastination Detected</h3>
                <p className="text-gray-300">Your completion rate is below 50%. Time for a recovery mission! Focus on one priority task today.</p>
              </div>
            )}

            {/* Vision Display */}
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-6">
              <h3 className="text-xl font-bold mb-3">Your 5-Year Vision</h3>
              <p className="text-gray-300 mb-4">{vision}</p>
              
              <h4 className="font-bold mb-2">Yearly Goals:</h4>
              <ul className="list-disc list-inside space-y-1">
                {yearlyGoals.filter(g => g.trim()).map((goal, i) => (
                  <li key={i} className="text-gray-400">{goal}</li>
                ))}
              </ul>
              
              <button
                onClick={() => setHasVision(false)}
                className="mt-4 text-[#00F0FF] hover:underline"
              >
                Edit Vision
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIStrategist;
