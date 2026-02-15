import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Globe, Clock, Users, TrendingUp, CheckCircle } from 'lucide-react';

const AdminQuestManager = () => {
  const [quests, setQuests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuest, setEditingQuest] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    xpReward: 50,
    target: 1,
    type: 'tasks',
    difficulty: 'medium',
    category: 'productivity',
    expiresIn: 0 // 0 = never expires, otherwise hours
  });

  useEffect(() => {
    fetchQuests();
    fetchStats();
  }, []);

  const fetchQuests = async () => {
    try {
      const response = await axios.get('/admin/quests/global', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('admin_token') || ''}`
        }
      });
      setQuests(response.data.quests || []);
    } catch (error) {
      toast.error('Failed to load quests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/admin/quests/stats', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('admin_token') || ''}`
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingQuest) {
        await axios.put(`/admin/quests/global/${editingQuest.id}`, formData, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('admin_token') || ''}`
          }
        });
        toast.success('Quest updated successfully!');
      } else {
        await axios.post('/admin/quests/global', formData, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('admin_token') || ''}`
          }
        });
        toast.success('Global quest created! All users can now see it.');
      }
      
      setShowForm(false);
      setEditingQuest(null);
      setFormData({
        title: '',
        description: '',
        xpReward: 50,
        target: 1,
        type: 'tasks',
        difficulty: 'medium',
        category: 'productivity',
        expiresIn: 0
      });
      
      fetchQuests();
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save quest');
    }
  };

  const handleDelete = async (questId) => {
    if (!window.confirm('Are you sure? This will delete the quest for all users.')) return;
    
    try {
      await axios.delete(`/admin/quests/global/${questId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('admin_token') || ''}`
        }
      });
      toast.success('Quest deleted successfully');
      fetchQuests();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete quest');
    }
  };

  const handleEdit = (quest) => {
    setEditingQuest(quest);
    setFormData({
      title: quest.title,
      description: quest.description || '',
      xpReward: quest.xpReward,
      target: quest.target,
      type: quest.type,
      difficulty: quest.difficulty,
      category: quest.category,
      expiresIn: 0
    });
    setShowForm(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">
              Global Quest Manager
            </h1>
            <p className="text-gray-400">Create quests that appear for all users</p>
          </div>
          
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingQuest(null);
              setFormData({
                title: '',
                description: '',
                xpReward: 50,
                target: 1,
                type: 'tasks',
                difficulty: 'medium',
                category: 'productivity',
                expiresIn: 0
              });
            }}
            className="px-6 py-3 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] rounded-lg font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-[#00F0FF]/50 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Global Quest
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-6 h-6 text-[#00F0FF]" />
                <span className="text-gray-400">Total Quests</span>
              </div>
              <p className="text-3xl font-black">{stats.total_global_quests}</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-green-500/20 p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-gray-400">Active</span>
              </div>
              <p className="text-3xl font-black text-green-400">{stats.active_quests}</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-red-500/20 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-red-400" />
                <span className="text-gray-400">Expired</span>
              </div>
              <p className="text-3xl font-black text-red-400">{stats.expired_quests}</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-purple-500/20 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-6 h-6 text-purple-400" />
                <span className="text-gray-400">Completions</span>
              </div>
              <p className="text-3xl font-black text-purple-400">{stats.total_completions}</p>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-yellow-500/20 p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
                <span className="text-gray-400">Avg/User</span>
              </div>
              <p className="text-3xl font-black text-yellow-400">{stats.average_completions_per_user}</p>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-6 mb-8"
          >
            <h2 className="text-2xl font-bold mb-4">{editingQuest ? 'Edit Quest' : 'Create New Global Quest'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none"
                    placeholder="Complete 10 tasks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">XP Reward *</label>
                  <input
                    type="number"
                    required
                    value={formData.xpReward}
                    onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Target *</label>
                  <input
                    type="number"
                    required
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none"
                  >
                    <option value="tasks">Tasks</option>
                    <option value="focus">Focus</option>
                    <option value="streak">Streak</option>
                    <option value="skill">Skill</option>
                    <option value="study">Study</option>
                    <option value="challenge">Challenge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none"
                  >
                    <option value="productivity">Productivity</option>
                    <option value="learning">Learning</option>
                    <option value="wellness">Wellness</option>
                    <option value="discipline">Discipline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Expires In (hours, 0 = never)</label>
                  <input
                    type="number"
                    value={formData.expiresIn}
                    onChange={(e) => setFormData({ ...formData, expiresIn: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none"
                    placeholder="0 for permanent, 24 for 1 day"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none"
                  rows="3"
                  placeholder="Detailed quest description..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] rounded-lg font-bold"
                >
                  {editingQuest ? 'Update Quest' : 'Create Quest'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingQuest(null);
                  }}
                  className="px-6 py-3 bg-gray-700 rounded-lg font-bold hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Quests List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">All Global Quests</h2>
          
          {quests.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-gray-700">
              <Globe className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">No global quests yet</p>
              <p className="text-gray-500 mt-2">Create your first quest to get started!</p>
            </div>
          ) : (
            quests.map((quest) => (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{quest.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(quest.difficulty)}`}>
                        {quest.difficulty?.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00F0FF]/20 text-[#00F0FF]">
                        +{quest.xp_reward} XP
                      </span>
                    </div>
                    
                    {quest.description && (
                      <p className="text-gray-400 mb-3">{quest.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Type: {quest.type}</span>
                      <span>Target: {quest.target}</span>
                      <span>Category: {quest.category}</span>
                      {quest.expires_at && (
                        <span className="text-orange-400">
                          Expires: {new Date(quest.expires_at).toLocaleString()}
                        </span>
                      )}
                      {!quest.expires_at && (
                        <span className="text-green-400">Never Expires</span>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center gap-4">
                      <span className="text-sm">
                        <Users className="w-4 h-4 inline mr-1" />
                        {quest.completion_count} completions
                      </span>
                      <span className="text-sm">
                        {quest.completion_rate}% completion rate
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(quest)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(quest.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuestManager;
