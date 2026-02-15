import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext, GameContext } from '../App';
import Layout from '../components/Layout';
import { 
  Plus, CheckCircle, Trash2, Clock, Zap, X,
  ListTodo, Filter, ChevronDown
} from 'lucide-react';

const SKILL_TREES = ['General', 'Work', 'Health', 'Learning', 'Creative', 'Social'];

const TasksPage = () => {
  const { fetchCurrentUser } = useContext(AuthContext);
  const { showLevelUp, showXpGain } = useContext(GameContext);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skill_tree: 'General',
    difficulty: 2,
    estimated_minutes: 30
  });

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = filter === 'all' ? {} : { completed: filter === 'completed' };
      const response = await axios.get('/tasks', { params });
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/tasks', formData);
      toast.success('Task created! Time to crush it!');
      setShowModal(false);
      setFormData({ title: '', description: '', skill_tree: 'General', difficulty: 2, estimated_minutes: 30 });
      fetchTasks();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      const response = await axios.patch(`/tasks/${task.id}`, { completed: true });
      
      showXpGain(task.xp_reward, { x: '50%', y: '40%' });
      toast.success(`+${task.xp_reward} XP earned!`);
      
      if (response.data.level_up) {
        setTimeout(() => showLevelUp(response.data.new_level), 1500);
      }
      
      fetchTasks();
      fetchCurrentUser();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

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
      <div className="max-w-5xl mx-auto px-4 py-8" data-testid="tasks-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase font-orbitron mb-2" data-testid="tasks-title">
              Task Hub
            </h1>
            <p className="text-[#a0a0b0]">Manage your missions and earn XP</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="cyber-button flex items-center gap-2"
            data-testid="create-task-btn"
          >
            <Plus className="w-5 h-5" />
            New Task
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <Filter className="w-5 h-5 text-[#a0a0b0]" />
          <div className="flex gap-2">
            {['all', 'pending', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f 
                    ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30' 
                    : 'bg-white/5 text-[#a0a0b0] hover:bg-white/10'
                }`}
                data-testid={`filter-${f}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="glass-card p-12 text-center" data-testid="empty-tasks">
            <ListTodo className="w-16 h-16 text-[#2a2a3e] mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No tasks yet</h3>
            <p className="text-[#a0a0b0] mb-6">Create your first task to start earning XP</p>
            <button 
              onClick={() => setShowModal(true)}
              className="cyber-button"
              data-testid="empty-create-task-btn"
            >
              Create Task
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-5 ${task.completed ? 'opacity-60' : ''}`}
                data-testid={`task-card-${i}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-bold ${task.completed ? 'line-through text-[#a0a0b0]' : ''}`}>
                        {task.title}
                      </h3>
                      <span className="text-[#FAFF00] text-sm">{'★'.repeat(task.difficulty)}</span>
                    </div>
                    {task.description && (
                      <p className="text-[#a0a0b0] text-sm mb-3">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 flex-wrap text-sm">
                      <span className="px-2 py-1 bg-white/5 rounded font-mono text-xs">
                        {task.skill_tree}
                      </span>
                      <span className="flex items-center gap-1 text-[#a0a0b0]">
                        <Clock className="w-4 h-4" /> {task.estimated_minutes}m
                      </span>
                      <span className="flex items-center gap-1 text-[#00F0FF] font-mono">
                        <Zap className="w-4 h-4" /> {task.xp_reward} XP
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!task.completed && (
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="p-2 rounded-lg bg-[#39FF14]/10 text-[#39FF14] hover:bg-[#39FF14]/20 transition-colors"
                        data-testid={`complete-btn-${i}`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 rounded-lg bg-[#FF0099]/10 text-[#FF0099] hover:bg-[#FF0099]/20 transition-colors"
                      data-testid={`delete-btn-${i}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Task Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card p-6 w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
                data-testid="create-task-modal"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold font-orbitron">New Mission</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    data-testid="close-modal-btn"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#a0a0b0]">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00F0FF] transition-colors"
                      placeholder="Enter your mission"
                      required
                      data-testid="task-title-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#a0a0b0]">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00F0FF] transition-colors resize-none"
                      placeholder="Add details (optional)"
                      rows={3}
                      data-testid="task-description-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#a0a0b0]">
                        Skill Tree
                      </label>
                      <select
                        value={formData.skill_tree}
                        onChange={(e) => setFormData({ ...formData, skill_tree: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00F0FF]"
                        data-testid="skill-tree-select"
                      >
                        {SKILL_TREES.map((tree) => (
                          <option key={tree} value={tree}>{tree}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#a0a0b0]">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        value={formData.estimated_minutes}
                        onChange={(e) => setFormData({ ...formData, estimated_minutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00F0FF]"
                        min={5}
                        max={480}
                        data-testid="duration-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#a0a0b0]">
                      Difficulty: {formData.difficulty} {'★'.repeat(formData.difficulty)}
                    </label>
                    <input
                      type="range"
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
                      className="w-full accent-[#00F0FF]"
                      min={1}
                      max={5}
                      data-testid="difficulty-slider"
                    />
                    <div className="flex justify-between text-xs text-[#a0a0b0] mt-1">
                      <span>Easy</span>
                      <span>Medium</span>
                      <span>Hard</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 text-[#a0a0b0] hover:text-white transition-colors"
                      data-testid="cancel-task-btn"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="cyber-button"
                      data-testid="submit-task-btn"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default TasksPage;
