import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext, GameContext } from '../App';
import Layout from '../components/Layout';
import { 
  BookOpen, Clock, Zap, ChevronRight, CheckCircle,
  Filter, GraduationCap, Brain, Heart, Code, Sparkles
} from 'lucide-react';

const categoryIcons = {
  productivity: <Sparkles className="w-5 h-5" />,
  programming: <Code className="w-5 h-5" />,
  mindset: <Brain className="w-5 h-5" />,
  health: <Heart className="w-5 h-5" />,
  skills: <GraduationCap className="w-5 h-5" />,
};

const LearningPage = () => {
  const { fetchCurrentUser } = useContext(AuthContext);
  const { showXpGain, showLevelUp } = useContext(GameContext);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedContent, setSelectedContent] = useState(null);
  const [completions, setCompletions] = useState({});

  useEffect(() => {
    fetchContent();
  }, [filter]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { category: filter } : {};
      const response = await axios.get('/learning', { params });
      setContent(response.data);
    } catch (error) {
      console.error('Failed to fetch learning content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (contentId) => {
    try {
      const response = await axios.post(`/learning/${contentId}/complete`);
      
      if (response.data.xp_earned > 0) {
        showXpGain(response.data.xp_earned, { x: '50%', y: '40%' });
        toast.success(`Lesson completed! +${response.data.xp_earned} XP`);
        fetchCurrentUser();
      } else {
        toast.info('You already completed this lesson');
      }
      
      setCompletions({ ...completions, [contentId]: true });
    } catch (error) {
      toast.error('Failed to complete lesson');
    }
  };

  const categories = ['all', 'productivity', 'programming', 'mindset', 'health', 'skills'];
  const difficulties = { beginner: '#39FF14', intermediate: '#FAFF00', advanced: '#FF0099' };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-[#00F0FF] border-t-transparent rounded-full"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8" data-testid="learning-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase font-orbitron mb-2" data-testid="learning-title">
            Learning Hub
          </h1>
          <p className="text-[#a0a0b0]">Level up your skills and earn XP</p>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          <Filter className="w-5 h-5 text-[#a0a0b0]" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === cat
                  ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30'
                  : 'bg-white/5 text-[#a0a0b0] hover:bg-white/10'
              }`}
              data-testid={`filter-${cat}`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        {content.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <BookOpen className="w-16 h-16 text-[#2a2a3e] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No lessons available</h3>
            <p className="text-[#a0a0b0]">Check back soon for new learning content!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {content.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-6 cursor-pointer hover:border-[#00F0FF]/30 ${
                  completions[item.id] ? 'border-[#39FF14]/30' : ''
                }`}
                onClick={() => setSelectedContent(item)}
                data-testid={`lesson-card-${i}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: `${difficulties[item.difficulty]}15`,
                      color: difficulties[item.difficulty]
                    }}
                  >
                    {categoryIcons[item.category] || <BookOpen className="w-5 h-5" />}
                  </div>
                  {completions[item.id] && (
                    <CheckCircle className="w-6 h-6 text-[#39FF14]" />
                  )}
                </div>
                
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-[#a0a0b0] text-sm mb-4 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: `${difficulties[item.difficulty]}20`,
                        color: difficulties[item.difficulty]
                      }}
                    >
                      {item.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-[#a0a0b0]">
                      <Clock className="w-4 h-4" /> {item.estimated_minutes}m
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[#00F0FF] font-mono">
                    <Zap className="w-4 h-4" /> {item.estimated_minutes * 2} XP
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Content Detail Modal */}
        {selectedContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedContent(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              data-testid="lesson-modal"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span 
                    className="px-2 py-1 rounded text-xs inline-block mb-2"
                    style={{ 
                      backgroundColor: `${difficulties[selectedContent.difficulty]}20`,
                      color: difficulties[selectedContent.difficulty]
                    }}
                  >
                    {selectedContent.difficulty} • {selectedContent.category}
                  </span>
                  <h2 className="text-2xl font-bold font-orbitron">{selectedContent.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="text-[#a0a0b0] hover:text-white p-2"
                >
                  ✕
                </button>
              </div>

              <div className="prose prose-invert max-w-none mb-8">
                <p className="text-[#a0a0b0] mb-4">{selectedContent.description}</p>
                <div className="whitespace-pre-wrap">{selectedContent.content}</div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-4 text-sm text-[#a0a0b0]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {selectedContent.estimated_minutes} minutes
                  </span>
                  <span className="flex items-center gap-1 text-[#00F0FF]">
                    <Zap className="w-4 h-4" /> {selectedContent.estimated_minutes * 2} XP
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    handleComplete(selectedContent.id);
                    setSelectedContent(null);
                  }}
                  className="cyber-button flex items-center gap-2"
                  data-testid="complete-lesson-btn"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark as Complete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default LearningPage;
