import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Rocket, Plus, TrendingUp, DollarSign } from 'lucide-react';

const FounderMode = () => {
  const [ideas, setIdeas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: '', description: '', target_market: '', revenue_model: '' });

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const response = await axios.get('/founder/ideas');
      setIdeas(response.data.ideas || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddIdea = async () => {
    if (!newIdea.title) {
      toast.error('Title is required');
      return;
    }

    try {
      await axios.post('/founder/ideas', newIdea);
      toast.success('Startup idea added!');
      setNewIdea({ title: '', description: '', target_market: '', revenue_model: '' });
      setShowForm(false);
      fetchIdeas();
    } catch (error) {
      toast.error('Failed to add idea');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">
              🚀 Founder Mode
            </h1>
            <p className="text-gray-400 text-lg">Build, validate, and launch your startup ideas</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] rounded-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Idea
          </button>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">New Startup Idea</h2>
            
            <input
              type="text"
              placeholder="Idea Title"
              value={newIdea.title}
              onChange={(e) => setNewIdea({...newIdea, title: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-3"
            />
            
            <textarea
              placeholder="Description"
              value={newIdea.description}
              onChange={(e) => setNewIdea({...newIdea, description: e.target.value})}
              rows="4"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-3"
            />
            
            <input
              type="text"
              placeholder="Target Market"
              value={newIdea.target_market}
              onChange={(e) => setNewIdea({...newIdea, target_market: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-3"
            />
            
            <input
              type="text"
              placeholder="Revenue Model"
              value={newIdea.revenue_model}
              onChange={(e) => setNewIdea({...newIdea, revenue_model: e.target.value})}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-4"
            />

            <div className="flex gap-3">
              <button onClick={handleAddIdea} className="px-6 py-3 bg-green-500 rounded-lg font-bold">Add Idea</button>
              <button onClick={() => setShowForm(false)} className="px-6 py-3 bg-gray-700 rounded-lg font-bold">Cancel</button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ideas.map((idea) => (
            <motion.div key={idea.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold">{idea.title}</h3>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">{idea.status}</span>
              </div>
              <p className="text-gray-400 mb-4">{idea.description}</p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Market: {idea.targetMarket || 'Not set'}</span>
                <span>Model: {idea.revenueModel || 'Not set'}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {ideas.length === 0 && !showForm && (
          <div className="text-center py-20">
            <Rocket className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No startup ideas yet</p>
            <p className="text-gray-500 mt-2">Click "New Idea" to add your first startup concept!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FounderMode;