import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

const LevelUpAnimation = ({ newLevel, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
      data-testid="level-up-overlay"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Radial glow */}
        <div className="absolute inset-0 bg-gradient-radial from-[#FAFF00]/30 to-transparent blur-3xl scale-150" />
        
        {/* Main card */}
        <div className="relative glass-card p-12 text-center border-4 border-[#FAFF00] max-w-md" data-testid="level-up-card">
          {/* Trophy icon */}
          <motion.div
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6"
          >
            <Trophy className="w-24 h-24 text-[#FAFF00] mx-auto" />
          </motion.div>

          {/* LEVEL UP text */}
          <motion.h1
            className="text-5xl md:text-6xl font-black uppercase mb-4 font-orbitron"
            style={{ color: '#FAFF00' }}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            data-testid="level-up-text"
          >
            LEVEL UP!
          </motion.h1>

          {/* New level */}
          <div className="mb-6">
            <motion.div 
              className="text-8xl font-black font-orbitron"
              style={{ color: '#FAFF00' }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              data-testid="new-level-number"
            >
              {newLevel}
            </motion.div>
            <div className="text-[#a0a0b0] uppercase tracking-widest font-mono text-sm">
              New Level Achieved
            </div>
          </div>

          {/* Message */}
          <p className="text-lg text-[#a0a0b0] mb-8">
            You're getting stronger! Keep pushing forward, warrior.
          </p>

          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="cyber-button px-8 py-3 inline-flex items-center gap-2"
            data-testid="level-up-continue-btn"
          >
            <Sparkles className="w-5 h-5" />
            Continue
          </motion.button>
        </div>

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
              x: (Math.random() - 0.5) * 400,
              y: (Math.random() - 0.5) * 400,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-[#FAFF00] rounded-full"
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default LevelUpAnimation;
