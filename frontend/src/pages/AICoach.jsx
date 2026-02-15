import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import { Brain, Send, Sparkles, User, Bot, Loader2 } from 'lucide-react';

const AICoach = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/ai-coach/history');
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message immediately
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);
    
    setLoading(true);

    try {
      const response = await axios.post('/ai-coach/chat', { message: userMessage });
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('AI Coach error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Let's try again in a moment, warrior!",
        timestamp: new Date().toISOString(),
        error: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "How can I stay motivated today?",
    "Help me prioritize my tasks",
    "I'm feeling overwhelmed",
    "Give me a productivity tip"
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 h-[calc(100vh-10rem)]" data-testid="ai-coach-page">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF0099] to-[#FF0055] flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-orbitron" data-testid="ai-coach-title">
              CyberCoach AI
            </h1>
            <p className="text-[#a0a0b0] text-sm">Your personal productivity companion</p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="glass-card flex flex-col h-[calc(100%-6rem)]" data-testid="chat-container">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-[#00F0FF] animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-12 h-12 text-[#FF0099] mb-4" />
                <h3 className="text-xl font-bold mb-2">Welcome, {user?.username}!</h3>
                <p className="text-[#a0a0b0] mb-6 max-w-md">
                  I'm your CyberCoach, here to help you stay focused, motivated, and crushing your goals.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(prompt)}
                      className="px-4 py-2 glass-card text-sm hover:border-[#00F0FF]/50 transition-colors"
                      data-testid={`quick-prompt-${i}`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <motion.div
                  key={msg.id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  data-testid={`message-${i}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-[#00F0FF]/20' 
                      : 'bg-[#FF0099]/20'
                  }`}>
                    {msg.role === 'user' 
                      ? <User className="w-4 h-4 text-[#00F0FF]" />
                      : <Bot className="w-4 h-4 text-[#FF0099]" />
                    }
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-lg ${
                    msg.role === 'user'
                      ? 'chat-bubble-user'
                      : 'chat-bubble-ai'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))
            )}
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FF0099]/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#FF0099]" />
                </div>
                <div className="chat-bubble-ai p-4 rounded-lg">
                  <div className="flex gap-1">
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 bg-[#FF0099] rounded-full"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-[#FF0099] rounded-full"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-[#FF0099] rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your coach anything..."
                className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00F0FF] transition-colors"
                disabled={loading}
                data-testid="chat-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="cyber-button px-6 disabled:opacity-50"
                data-testid="send-message-btn"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AICoach;
