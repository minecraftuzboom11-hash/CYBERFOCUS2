import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import { Zap, ChevronRight, Target, Brain, Trophy, Flame } from 'lucide-react';
import axios from 'axios';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Task Missions',
      description: 'Transform boring tasks into epic quests with XP rewards',
      color: '#00F0FF'
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'AI Coach',
      description: 'Get personalized motivation from your AI productivity companion',
      color: '#FF0099'
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: 'Achievements',
      description: 'Unlock badges and rewards as you level up your productivity',
      color: '#39FF14'
    },
    {
      icon: <Flame className="w-8 h-8" />,
      title: 'Streaks & XP',
      description: 'Build momentum with daily streaks and experience points',
      color: '#FAFF00'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] grid-background overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1701377000907-64f247c931f0?w=1920)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Header */}
          <nav className="flex items-center justify-between mb-16" data-testid="landing-nav">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#0099FF] flex items-center justify-center">
                <Zap className="w-7 h-7 text-black" />
              </div>
              <span className="text-2xl font-bold font-orbitron tracking-wider">
                CYBER<span className="text-[#00F0FF]">FOCUS</span>
              </span>
            </div>
            <Link
              to="/auth"
              className="cyber-button px-6 py-3 text-sm"
              data-testid="get-started-btn"
            >
              Get Started
            </Link>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 
                className="text-5xl md:text-7xl font-black uppercase mb-6 font-orbitron leading-tight"
                data-testid="hero-title"
              >
                Level Up Your{' '}
                <span className="neon-glow text-[#00F0FF]">Productivity</span>
              </h1>
              <p className="text-lg md:text-xl text-[#a0a0b0] mb-10 max-w-2xl mx-auto leading-relaxed">
                Transform your daily tasks into an epic adventure. Earn XP, unlock achievements, 
                and become the most productive version of yourself.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/auth"
                  className="cyber-button px-10 py-4 text-lg flex items-center gap-2"
                  data-testid="hero-cta-btn"
                >
                  Start Your Journey
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <button 
                  className="cyber-button-secondary px-10 py-4 text-lg font-orbitron"
                  data-testid="learn-more-btn"
                >
                  Learn More
                </button>
              </div>
            </motion.div>

            {/* Stats Preview */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { value: '10K+', label: 'Warriors', color: '#00F0FF' },
                { value: '500K+', label: 'Tasks Completed', color: '#FF0099' },
                { value: '1M+', label: 'XP Earned', color: '#39FF14' },
                { value: '99%', label: 'Success Rate', color: '#FAFF00' }
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="glass-card p-6 text-center"
                  data-testid={`stat-${i}`}
                >
                  <div 
                    className="text-3xl md:text-4xl font-black font-orbitron mb-1"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-sm text-[#a0a0b0] uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black uppercase font-orbitron mb-4">
              Power Up Your <span className="text-[#FF0099]">Workflow</span>
            </h2>
            <p className="text-[#a0a0b0] text-lg max-w-2xl mx-auto">
              Everything you need to crush your goals and become unstoppable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-8 group hover:border-white/20"
                data-testid={`feature-${i}`}
              >
                <div 
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-6 transition-transform group-hover:scale-110"
                  style={{ 
                    backgroundColor: `${feature.color}15`,
                    color: feature.color 
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold font-orbitron mb-3">{feature.title}</h3>
                <p className="text-[#a0a0b0] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12 border-2 border-[#00F0FF]/30"
          >
            <h2 className="text-3xl md:text-4xl font-black uppercase font-orbitron mb-4">
              Ready to <span className="text-[#00F0FF]">Level Up</span>?
            </h2>
            <p className="text-[#a0a0b0] text-lg mb-8">
              Join thousands of warriors who have transformed their productivity
            </p>
            <Link
              to="/auth"
              className="cyber-button px-12 py-4 text-lg inline-flex items-center gap-2"
              data-testid="final-cta-btn"
            >
              <Zap className="w-5 h-5" />
              Begin Your Quest
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#00F0FF]" />
            <span className="font-orbitron text-sm">CyberFocus © 2024</span>
          </div>
          <p className="text-[#a0a0b0] text-sm">
            Level up your life, one task at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
