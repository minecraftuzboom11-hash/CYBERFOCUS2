import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Globe, Heart, TreePine, Users, TrendingUp } from 'lucide-react';

const WorldImpact = () => {
  const [stats, setStats] = useState(null);
  const [type, setType] = useState('volunteer');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/impact/stats');
      setStats(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogContribution = async () => {
    if (!description) {
      toast.error('Please describe your contribution');
      return;
    }

    try {
      const response = await axios.post('/impact/contribution', {
        type,
        description,
        hours,
        carbon_impact: 0
      });
      toast.success(response.data.message);
      setDescription('');
      setHours(0);
      fetchStats();
    } catch (error) {
      toast.error('Failed to log contribution');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">
          🌍 World Impact
        </h1>
        <p className="text-gray-400 text-lg mb-8">Track how you contribute to the world</p>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-green-500/20 p-6">
              <Heart className="w-6 h-6 text-green-400 mb-2" />
              <p className="text-3xl font-black text-green-400">{stats.weekly_contributions}</p>
              <p className="text-sm text-gray-400">This Week</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-blue-500/20 p-6">
              <Globe className="w-6 h-6 text-blue-400 mb-2" />
              <p className="text-3xl font-black text-blue-400">{stats.total_contributions}</p>
              <p className="text-sm text-gray-400">Total Impact</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-purple-500/20 p-6">
              <TrendingUp className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-3xl font-black text-purple-400">{stats.contribution_streak}</p>
              <p className="text-sm text-gray-400">Week Streak</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-orange-500/20 p-6">
              <TreePine className="w-6 h-6 text-orange-400 mb-2" />
              <p className="text-3xl font-black text-orange-400">{stats.carbon_impact}</p>
              <p className="text-sm text-gray-400">Carbon Impact</p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-8">
          <h2 className="text-2xl font-bold mb-6">Log Today's Contribution</h2>

          <label className="block text-sm font-bold mb-2">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-4">
            <option value="volunteer">Volunteer Work</option>
            <option value="build">Build Something Useful</option>
            <option value="teach">Teach/Mentor</option>
            <option value="environmental">Environmental Action</option>
            <option value="community">Community Service</option>
          </select>

          <label className="block text-sm font-bold mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you do to make the world better?"
            rows="4"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-4"
          />

          <label className="block text-sm font-bold mb-2">Hours Spent</label>
          <input
            type="number"
            value={hours}
            onChange={(e) => setHours(parseFloat(e.target.value))}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-6"
          />

          <button onClick={handleLogContribution} className="w-full py-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg font-bold text-lg">
            Log Contribution (+50 XP)
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorldImpact;