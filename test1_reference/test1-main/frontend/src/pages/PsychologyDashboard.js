import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Brain, TrendingUp, AlertTriangle, Smile } from 'lucide-react';

const PsychologyDashboard = () => {
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [notes, setNotes] = useState('');
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await axios.get('/psychology/insights');
      setInsights(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogMood = async () => {
    try {
      await axios.post('/psychology/mood', { mood, energy, notes });
      toast.success('Mood logged successfully');
      setNotes('');
      fetchInsights();
    } catch (error) {
      toast.error('Failed to log mood');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">
          🧠 Psychological Analytics
        </h1>
        <p className="text-gray-400 text-lg mb-8">Track your mental state and get AI insights</p>

        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-blue-500/20 p-6">
              <Smile className="w-6 h-6 text-blue-400 mb-2" />
              <p className="text-3xl font-black text-blue-400">{insights.average_mood}/10</p>
              <p className="text-sm text-gray-400">Average Mood</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-green-500/20 p-6">
              <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
              <p className="text-3xl font-black text-green-400">{insights.average_energy}/10</p>
              <p className="text-sm text-gray-400">Average Energy</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-purple-500/20 p-6">
              <Brain className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-3xl font-black text-purple-400">{insights.mood_logs_count}</p>
              <p className="text-sm text-gray-400">Logs This Week</p>
            </div>
          </div>
        )}

        {insights?.burnout_risk && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-red-400">Burnout Risk Detected</h3>
            </div>
            <p className="text-gray-300">Your mood and energy levels are low. Consider taking a break, talking to someone, or reducing workload.</p>
          </div>
        )}

        {insights?.insights && insights.insights.length > 0 && (
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 border border-purple-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-3">💡 AI Insights</h3>
            <ul className="space-y-2">
              {insights.insights.map((insight, i) => (
                <li key={i} className="text-gray-300">{insight}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-8">
          <h2 className="text-2xl font-bold mb-6">Log Today's Mood</h2>

          <label className="block text-sm font-bold mb-2">Mood (1-10)</label>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="range"
              min="1"
              max="10"
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-2xl font-bold">{mood}</span>
          </div>

          <label className="block text-sm font-bold mb-2">Energy (1-10)</label>
          <div className="flex items-center gap-4 mb-4">
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-2xl font-bold">{energy}</span>
          </div>

          <label className="block text-sm font-bold mb-2">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you feeling? What's on your mind?"
            rows="3"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-6"
          />

          <button onClick={handleLogMood} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-bold text-lg">
            Log Mood
          </button>
        </div>
      </div>
    </div>
  );
};

export default PsychologyDashboard;