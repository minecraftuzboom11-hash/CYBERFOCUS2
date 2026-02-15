import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { User, Brain, Lightbulb, Award } from 'lucide-react';

const IdentityTransform = () => {
  const [alterEgo, setAlterEgo] = useState({ name: '', traits: [''], values: [''], daily_habits: [''] });
  const [hasAlterEgo, setHasAlterEgo] = useState(false);
  const [scenario, setScenario] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    fetchAlterEgo();
  }, []);

  const fetchAlterEgo = async () => {
    try {
      const response = await axios.get('/identity/alter-ego');
      if (response.data.has_alter_ego) {
        setAlterEgo(response.data.alter_ego);
        setHasAlterEgo(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveAlterEgo = async () => {
    try {
      await axios.post('/identity/alter-ego', alterEgo);
      toast.success('Alter ego created! Your transformation begins.');
      setHasAlterEgo(true);
    } catch (error) {
      toast.error('Failed to save alter ego');
    }
  };

  const fetchScenario = async () => {
    try {
      const response = await axios.get('/identity/decision-scenario');
      setScenario(response.data);
      setSelectedOption(null);
    } catch (error) {
      toast.error('Failed to load scenario');
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    const isCorrect = option === scenario.correct;
    if (isCorrect) {
      toast.success('✅ Logical choice! You\'re thinking strategically.');
    } else {
      toast.error('❌ Emotional choice. Practice thinking long-term.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">
          👤 Identity Transformation
        </h1>
        <p className="text-gray-400 text-lg mb-8">Define your ideal self, train strategic thinking</p>

        {!hasAlterEgo ? (
          <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-8">
            <h2 className="text-2xl font-bold mb-4">Create Your Alter Ego</h2>
            
            <label className="block text-sm font-bold mb-2">Alter Ego Name</label>
            <input
              type="text"
              value={alterEgo.name}
              onChange={(e) => setAlterEgo({...alterEgo, name: e.target.value})}
              placeholder="The person you want to become"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-4"
            />

            <label className="block text-sm font-bold mb-2">Key Traits</label>
            {alterEgo.traits.map((trait, i) => (
              <input
                key={i}
                value={trait}
                onChange={(e) => {
                  const newTraits = [...alterEgo.traits];
                  newTraits[i] = e.target.value;
                  setAlterEgo({...alterEgo, traits: newTraits});
                }}
                placeholder="e.g., Disciplined, Strategic, Calm"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg mb-2"
              />
            ))}
            <button onClick={() => setAlterEgo({...alterEgo, traits: [...alterEgo.traits, '']})} className="text-[#00F0FF] mb-4">+ Add Trait</button>

            <button onClick={handleSaveAlterEgo} className="w-full py-4 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] rounded-lg font-bold mt-4">Create Alter Ego</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/10 border-2 border-purple-500/50 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <User className="w-8 h-8 text-purple-400" />
                <h2 className="text-3xl font-bold">{alterEgo.name}</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {alterEgo.traits?.filter(t => t).map((trait, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-500/20 rounded-full text-sm">{trait}</span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6" />
                Decision Training
              </h3>
              
              {!scenario ? (
                <button onClick={fetchScenario} className="px-6 py-3 bg-gradient-to-r from-[#00F0FF] to-blue-500 rounded-lg font-bold">
                  Generate Scenario
                </button>
              ) : (
                <div>
                  <p className="text-lg mb-4">{scenario.scenario}</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleOptionSelect('a')}
                      disabled={selectedOption}
                      className={`w-full p-4 rounded-lg text-left border-2 transition-all ${
                        selectedOption === 'a' 
                          ? scenario.correct === 'a' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                          : 'border-gray-700 hover:border-[#00F0FF]'
                      }`}
                    >
                      <strong>Option A:</strong> {scenario.option_a}
                    </button>
                    <button
                      onClick={() => handleOptionSelect('b')}
                      disabled={selectedOption}
                      className={`w-full p-4 rounded-lg text-left border-2 transition-all ${
                        selectedOption === 'b' 
                          ? scenario.correct === 'b' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                          : 'border-gray-700 hover:border-[#00F0FF]'
                      }`}
                    >
                      <strong>Option B:</strong> {scenario.option_b}
                    </button>
                  </div>
                  {selectedOption && (
                    <button onClick={fetchScenario} className="mt-4 px-6 py-2 bg-blue-500 rounded-lg">Next Scenario</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentityTransform;