import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const XPAnimation = ({ amount, position = { x: '50%', y: '50%' } }) => {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 0,
        x: '-50%',
        scale: 0.5 
      }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        y: -100,
        scale: [0.5, 1.2, 1, 0.8]
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="fixed z-50 pointer-events-none"
      style={{ 
        left: position.x || '50%', 
        top: position.y || '50%' 
      }}
      data-testid="xp-animation"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00F0FF]/20 border border-[#00F0FF]">
        <Zap className="w-5 h-5 text-[#00F0FF]" />
        <span className="text-2xl font-bold font-orbitron text-[#00F0FF]" data-testid="xp-amount">
          +{amount} XP
        </span>
      </div>
    </motion.div>
  );
};

export default XPAnimation;
