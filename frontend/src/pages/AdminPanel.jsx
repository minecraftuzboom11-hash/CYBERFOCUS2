import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Shield, Users, Swords, BookOpen, Music, Newspaper,
  Plus, Trash2, Eye, Lock, LogOut, BarChart3, Flame,
  ChevronRight, X, CheckCircle, AlertTriangle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [quests, setQuests] = useState([]);
  const [news, setNews] = useState([]);
  const [learning, setLearning] = useState([]);
  const [music, setMusic] = useState([]);
  
  // Login state
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  // Modal states
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  
  // Form states
  const [questForm, setQuestForm] = useState({
    title: '', description: '', quest_type: 'daily', difficulty: 3, xp_reward: 100, questions: []
  });
  const [newsForm, setNewsForm] = useState({ title: '', content: '', category: 'announcement' });
  const [learningForm, setLearningForm] = useState({
    title: '', description: '', content: '', category: 'productivity', difficulty: 'beginner', estimated_minutes: 15
  });
  const [musicForm, setMusicForm] = useState({ title: '', artist: '', url: '', category: 'lofi', thumbnail: '' });

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      fetchAllData();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/login`, credentials);
      sessionStorage.setItem('admin_token', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      setIsAuthenticated(true);
      toast.success('Welcome back, Admin!');
      fetchAllData();
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    navigate('/');
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, questsRes, newsRes, learningRes, musicRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/admin/quests`),
        axios.get(`${API}/admin/news`),
        axios.get(`${API}/admin/learning`),
        axios.get(`${API}/admin/music`)
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setQuests(questsRes.data);
      setNews(newsRes.data);
      setLearning(learningRes.data);
      setMusic(musicRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const createQuest = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/quests`, questForm);
      toast.success('Quest created!');
      setShowQuestModal(false);
      setQuestForm({ title: '', description: '', quest_type: 'daily', difficulty: 3, xp_reward: 100, questions: [] });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create quest');
    }
  };

  const createNews = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/news`, newsForm);
      toast.success('News created!');
      setShowNewsModal(false);
      setNewsForm({ title: '', content: '', category: 'announcement' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create news');
    }
  };

  const createLearning = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/learning`, learningForm);
      toast.success('Learning content created!');
      setShowLearningModal(false);
      setLearningForm({ title: '', description: '', content: '', category: 'productivity', difficulty: 'beginner', estimated_minutes: 15 });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to create learning content');
    }
  };

  const createMusic = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/music`, musicForm);
      toast.success('Music track added!');
      setShowMusicModal(false);
      setMusicForm({ title: '', artist: '', url: '', category: 'lofi', thumbnail: '' });
      fetchAllData();
    } catch (error) {
      toast.error('Failed to add music');
    }
  };

  const deleteItem = async (type, id) => {
    try {
      await axios.delete(`${API}/admin/${type}/${id}`);
      toast.success('Deleted successfully');
      fetchAllData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const addQuestion = () => {
    setQuestForm({
      ...questForm,
      questions: [...questForm.questions, { question: '', options: ['', '', '', ''], correct_answer: 0 }]
    });
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questForm.questions];
    if (field === 'option') {
      updated[index].options[value.index] = value.text;
    } else {
      updated[index][field] = value;
    }
    setQuestForm({ ...questForm, questions: updated });
  };

  const removeQuestion = (index) => {
    setQuestForm({
      ...questForm,
      questions: questForm.questions.filter((_, i) => i !== index)
    });
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0000] flex items-center justify-center p-4" data-testid="admin-login-page">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#330000_0%,_#0a0000_70%)]" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(139, 0, 0, 0.1) 50px, rgba(139, 0, 0, 0.1) 51px)`,
          }} />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#8B0000] to-[#DC143C] flex items-center justify-center"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-black font-orbitron text-[#DC143C]" data-testid="admin-title">
              ADMIN PORTAL
            </h1>
            <p className="text-[#8B0000] text-sm mt-2">Restricted Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="bg-black/60 backdrop-blur border-2 border-[#8B0000]/50 p-8 rounded-lg" data-testid="admin-login-form">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-[#DC143C]">Username</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B0000]" />
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-black/50 border-2 border-[#8B0000]/50 rounded-lg focus:border-[#DC143C] text-white"
                    placeholder="Enter admin username"
                    required
                    data-testid="admin-username-input"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-[#DC143C]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8B0000]" />
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-black/50 border-2 border-[#8B0000]/50 rounded-lg focus:border-[#DC143C] text-white"
                    placeholder="••••••••••"
                    required
                    data-testid="admin-password-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-[#8B0000] to-[#DC143C] text-white font-bold uppercase tracking-wider rounded-lg hover:from-[#A00000] hover:to-[#FF1744] transition-all"
                data-testid="admin-login-btn"
              >
                {loading ? 'Authenticating...' : 'Access Portal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard
  const tabs = [
    { id: 'stats', icon: <BarChart3 size={20} />, label: 'Statistics' },
    { id: 'users', icon: <Users size={20} />, label: 'Users' },
    { id: 'quests', icon: <Swords size={20} />, label: 'Quests' },
    { id: 'news', icon: <Newspaper size={20} />, label: 'News' },
    { id: 'learning', icon: <BookOpen size={20} />, label: 'Learning' },
    { id: 'music', icon: <Music size={20} />, label: 'Music' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0000]" data-testid="admin-dashboard">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_#330000_0%,_#0a0000_50%)]" />
      
      {/* Header */}
      <header className="relative z-10 border-b-2 border-[#8B0000]/30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B0000] to-[#DC143C] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold font-orbitron text-[#DC143C]">ADMIN PANEL</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-[#DC143C] hover:bg-[#8B0000]/20 rounded-lg transition-colors"
            data-testid="admin-logout-btn"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#8B0000] to-[#DC143C] text-white'
                  : 'bg-black/40 border border-[#8B0000]/30 text-[#DC143C] hover:bg-[#8B0000]/20'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.total_users, icon: <Users /> },
                { label: 'Total Tasks', value: stats.total_tasks, icon: <CheckCircle /> },
                { label: 'Completed Tasks', value: stats.completed_tasks, icon: <CheckCircle /> },
                { label: 'Focus Sessions', value: stats.total_focus_sessions, icon: <Flame /> },
              ].map((stat, i) => (
                <div key={i} className="bg-black/40 border-2 border-[#8B0000]/30 p-6 rounded-lg" data-testid={`stat-${i}`}>
                  <div className="text-[#8B0000] mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold font-orbitron text-[#DC143C]">{stat.value}</div>
                  <div className="text-sm text-[#8B0000]">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-black/40 border-2 border-[#8B0000]/30 p-6 rounded-lg">
              <h3 className="text-xl font-bold font-orbitron text-[#DC143C] mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5" /> Top Streaks
              </h3>
              <div className="space-y-3">
                {stats.top_streaks?.map((user, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#8B0000]/10 rounded-lg">
                    <div>
                      <span className="font-bold">{user.username}</span>
                      <span className="text-[#8B0000] text-sm ml-2">Level {user.level}</span>
                    </div>
                    <span className="text-[#DC143C] font-mono">{user.current_streak} days</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-black/40 border-2 border-[#8B0000]/30 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#8B0000]/20">
                  <tr>
                    <th className="p-4 text-left text-[#DC143C]">Username</th>
                    <th className="p-4 text-left text-[#DC143C]">Email</th>
                    <th className="p-4 text-left text-[#DC143C]">Level</th>
                    <th className="p-4 text-left text-[#DC143C]">XP</th>
                    <th className="p-4 text-left text-[#DC143C]">Streak</th>
                    <th className="p-4 text-left text-[#DC143C]">Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={i} className="border-t border-[#8B0000]/20">
                      <td className="p-4 font-bold">{user.username}</td>
                      <td className="p-4 text-[#8B0000]">{user.email}</td>
                      <td className="p-4">{user.level}</td>
                      <td className="p-4 text-[#DC143C] font-mono">{user.xp}</td>
                      <td className="p-4">{user.current_streak} days</td>
                      <td className="p-4">{user.total_tasks_completed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Quests Tab */}
        {activeTab === 'quests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-orbitron text-[#DC143C]">Manage Quests</h2>
              <button
                onClick={() => setShowQuestModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B0000] to-[#DC143C] rounded-lg"
                data-testid="add-quest-btn"
              >
                <Plus size={20} /> Add Quest
              </button>
            </div>
            
            <div className="grid gap-4">
              {quests.map((quest, i) => (
                <div key={i} className="bg-black/40 border-2 border-[#8B0000]/30 p-4 rounded-lg flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{quest.title}</h3>
                    <p className="text-[#8B0000] text-sm">{quest.description}</p>
                    <div className="flex gap-3 mt-2 text-sm">
                      <span className="px-2 py-1 bg-[#8B0000]/20 rounded">{quest.quest_type}</span>
                      <span className="text-[#DC143C]">+{quest.xp_reward} XP</span>
                      <span>{quest.questions?.length || 0} questions</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteItem('quests', quest.id)}
                    className="p-2 text-[#DC143C] hover:bg-[#8B0000]/20 rounded"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-orbitron text-[#DC143C]">Manage News</h2>
              <button
                onClick={() => setShowNewsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B0000] to-[#DC143C] rounded-lg"
                data-testid="add-news-btn"
              >
                <Plus size={20} /> Add News
              </button>
            </div>
            
            <div className="grid gap-4">
              {news.map((item, i) => (
                <div key={i} className="bg-black/40 border-2 border-[#8B0000]/30 p-4 rounded-lg flex justify-between">
                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-[#8B0000] text-sm mt-1">{item.content.substring(0, 100)}...</p>
                    <span className="text-xs text-[#8B0000] mt-2 block">{item.category}</span>
                  </div>
                  <button onClick={() => deleteItem('news', item.id)} className="p-2 text-[#DC143C] hover:bg-[#8B0000]/20 rounded">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-orbitron text-[#DC143C]">Manage Learning Content</h2>
              <button
                onClick={() => setShowLearningModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B0000] to-[#DC143C] rounded-lg"
                data-testid="add-learning-btn"
              >
                <Plus size={20} /> Add Content
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {learning.map((item, i) => (
                <div key={i} className="bg-black/40 border-2 border-[#8B0000]/30 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <h3 className="font-bold">{item.title}</h3>
                    <button onClick={() => deleteItem('learning', item.id)} className="p-1 text-[#DC143C]">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-[#8B0000] text-sm mt-1">{item.description}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-1 bg-[#8B0000]/20 rounded">{item.category}</span>
                    <span className="px-2 py-1 bg-[#8B0000]/20 rounded">{item.difficulty}</span>
                    <span className="px-2 py-1 bg-[#8B0000]/20 rounded">{item.estimated_minutes}m</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Music Tab */}
        {activeTab === 'music' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold font-orbitron text-[#DC143C]">Manage Music</h2>
              <button
                onClick={() => setShowMusicModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#8B0000] to-[#DC143C] rounded-lg"
                data-testid="add-music-btn"
              >
                <Plus size={20} /> Add Track
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {music.map((track, i) => (
                <div key={i} className="bg-black/40 border-2 border-[#8B0000]/30 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-bold">{track.title}</h3>
                      <p className="text-[#8B0000] text-sm">{track.artist}</p>
                    </div>
                    {!track.id?.startsWith('1') && (
                      <button onClick={() => deleteItem('music', track.id)} className="p-1 text-[#DC143C]">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 bg-[#8B0000]/20 rounded mt-2 inline-block">{track.category}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Quest Modal */}
      <AnimatePresence>
        {showQuestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowQuestModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#0a0000] border-2 border-[#8B0000] p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-orbitron text-[#DC143C]">Create Quest</h2>
                <button onClick={() => setShowQuestModal(false)} className="text-[#DC143C]"><X /></button>
              </div>

              <form onSubmit={createQuest} className="space-y-4">
                <input
                  type="text"
                  placeholder="Quest Title"
                  value={questForm.title}
                  onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={questForm.description}
                  onChange={(e) => setQuestForm({ ...questForm, description: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  rows={3}
                  required
                />
                <div className="grid grid-cols-3 gap-4">
                  <select
                    value={questForm.quest_type}
                    onChange={(e) => setQuestForm({ ...questForm, quest_type: e.target.value })}
                    className="p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="boss">Boss</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Difficulty (1-5)"
                    value={questForm.difficulty}
                    onChange={(e) => setQuestForm({ ...questForm, difficulty: parseInt(e.target.value) })}
                    className="p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                    min={1}
                    max={5}
                  />
                  <input
                    type="number"
                    placeholder="XP Reward"
                    value={questForm.xp_reward}
                    onChange={(e) => setQuestForm({ ...questForm, xp_reward: parseInt(e.target.value) })}
                    className="p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  />
                </div>

                {/* Multiple Choice Questions */}
                <div className="border-t border-[#8B0000]/30 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[#DC143C]">Multiple Choice Questions</h3>
                    <button type="button" onClick={addQuestion} className="text-sm px-3 py-1 bg-[#8B0000]/20 rounded text-[#DC143C]">
                      + Add Question
                    </button>
                  </div>
                  
                  {questForm.questions.map((q, qi) => (
                    <div key={qi} className="bg-black/30 p-4 rounded-lg mb-4 border border-[#8B0000]/30">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-[#8B0000]">Question {qi + 1}</span>
                        <button type="button" onClick={() => removeQuestion(qi)} className="text-[#DC143C] text-sm">Remove</button>
                      </div>
                      <input
                        type="text"
                        placeholder="Question text"
                        value={q.question}
                        onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                        className="w-full p-2 bg-black/50 border border-[#8B0000]/30 rounded mb-2"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${qi}`}
                              checked={q.correct_answer === oi}
                              onChange={() => updateQuestion(qi, 'correct_answer', oi)}
                              className="accent-[#DC143C]"
                            />
                            <input
                              type="text"
                              placeholder={`Option ${oi + 1}`}
                              value={opt}
                              onChange={(e) => updateQuestion(qi, 'option', { index: oi, text: e.target.value })}
                              className="flex-1 p-2 bg-black/50 border border-[#8B0000]/30 rounded text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#DC143C] rounded-lg font-bold">
                  Create Quest
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* News Modal */}
      <AnimatePresence>
        {showNewsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#0a0000] border-2 border-[#8B0000] p-6 rounded-lg w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold font-orbitron text-[#DC143C] mb-4">Create News</h2>
              <form onSubmit={createNews} className="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  required
                />
                <textarea
                  placeholder="Content"
                  value={newsForm.content}
                  onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  rows={5}
                  required
                />
                <select
                  value={newsForm.category}
                  onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                >
                  <option value="announcement">Announcement</option>
                  <option value="update">Update</option>
                  <option value="event">Event</option>
                  <option value="tip">Tip</option>
                </select>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#DC143C] rounded-lg font-bold">
                  Create News
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Learning Modal */}
      <AnimatePresence>
        {showLearningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowLearningModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#0a0000] border-2 border-[#8B0000] p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold font-orbitron text-[#DC143C] mb-4">Add Learning Content</h2>
              <form onSubmit={createLearning} className="space-y-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={learningForm.title}
                  onChange={(e) => setLearningForm({ ...learningForm, title: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Short Description"
                  value={learningForm.description}
                  onChange={(e) => setLearningForm({ ...learningForm, description: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  required
                />
                <textarea
                  placeholder="Full Content (supports markdown)"
                  value={learningForm.content}
                  onChange={(e) => setLearningForm({ ...learningForm, content: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  rows={6}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={learningForm.category}
                    onChange={(e) => setLearningForm({ ...learningForm, category: e.target.value })}
                    className="p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  >
                    <option value="productivity">Productivity</option>
                    <option value="programming">Programming</option>
                    <option value="mindset">Mindset</option>
                    <option value="health">Health</option>
                    <option value="skills">Skills</option>
                  </select>
                  <select
                    value={learningForm.difficulty}
                    onChange={(e) => setLearningForm({ ...learningForm, difficulty: e.target.value })}
                    className="p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <input
                  type="number"
                  placeholder="Estimated Minutes"
                  value={learningForm.estimated_minutes}
                  onChange={(e) => setLearningForm({ ...learningForm, estimated_minutes: parseInt(e.target.value) })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                />
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#DC143C] rounded-lg font-bold">
                  Create Content
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Music Modal */}
      <AnimatePresence>
        {showMusicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowMusicModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#0a0000] border-2 border-[#8B0000] p-6 rounded-lg w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold font-orbitron text-[#DC143C] mb-4">Add Music Track</h2>
              <form onSubmit={createMusic} className="space-y-4">
                <input
                  type="text"
                  placeholder="Track Title"
                  value={musicForm.title}
                  onChange={(e) => setMusicForm({ ...musicForm, title: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  required
                />
                <input
                  type="text"
                  placeholder="Artist"
                  value={musicForm.artist}
                  onChange={(e) => setMusicForm({ ...musicForm, artist: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  required
                />
                <input
                  type="url"
                  placeholder="YouTube URL or Audio URL"
                  value={musicForm.url}
                  onChange={(e) => setMusicForm({ ...musicForm, url: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                  required
                />
                <select
                  value={musicForm.category}
                  onChange={(e) => setMusicForm({ ...musicForm, category: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                >
                  <option value="lofi">Lofi</option>
                  <option value="ambient">Ambient</option>
                  <option value="classical">Classical</option>
                  <option value="nature">Nature</option>
                  <option value="synthwave">Synthwave</option>
                </select>
                <input
                  type="url"
                  placeholder="Thumbnail URL (optional)"
                  value={musicForm.thumbnail}
                  onChange={(e) => setMusicForm({ ...musicForm, thumbnail: e.target.value })}
                  className="w-full p-3 bg-black/50 border border-[#8B0000]/50 rounded-lg"
                />
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-[#DC143C] rounded-lg font-bold">
                  Add Track
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
