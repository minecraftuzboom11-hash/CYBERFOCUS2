import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import axios from 'axios';
import { toast } from 'sonner';
import { Image, Sparkles, Coins, Link as LinkIcon, Save, Eye } from 'lucide-react';

const BackgroundCustomizer = () => {
  const { user } = useContext(AuthContext);
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [backgroundType, setBackgroundType] = useState('default');
  const [tokens, setTokens] = useState(10);
  const [urlInput, setUrlInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchBackground();
  }, []);

  const fetchBackground = async () => {
    try {
      const response = await axios.get('/user/background');
      setBackgroundUrl(response.data.background_url || '');
      setBackgroundType(response.data.background_type);
      setTokens(response.data.tokens);
      setPreview(response.data.background_url);
    } catch (error) {
      console.error('Failed to load background:', error);
    }
  };

  const handleUrlUpdate = async () => {
    if (!urlInput) {
      toast.error('Please enter a valid URL');
      return;
    }

    if (tokens < 1) {
      toast.error('Not enough tokens! You need 1 token to change background.');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('/user/background/update', {
        background_url: urlInput,
        background_type: 'url'
      });

      setBackgroundUrl(urlInput);
      setBackgroundType('url');
      setTokens(response.data.remaining_tokens);
      setPreview(urlInput);
      toast.success('Background updated! (-1 token)');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update background');
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt) {
      toast.error('Please enter a description for your background');
      return;
    }

    if (tokens < 2) {
      toast.error('Not enough tokens! You need 2 tokens for AI generation.');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post('/user/background/generate', {
        prompt: aiPrompt
      });

      setBackgroundUrl(response.data.image_url);
      setBackgroundType('ai-generated');
      setTokens(response.data.remaining_tokens);
      setPreview(response.data.image_url);
      toast.success('AI background generated! (-2 tokens)');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate background');
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = async () => {
    if (tokens < 1) {
      toast.error('Not enough tokens!');
      return;
    }

    setSaving(true);
    try {
      await axios.post('/user/background/update', {
        background_url: '',
        background_type: 'default'
      });

      setBackgroundUrl('');
      setBackgroundType('default');
      setTokens(tokens - 1);
      setPreview(null);
      toast.success('Reset to default background! (-1 token)');
    } catch (error) {
      toast.error('Failed to reset background');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-[#00F0FF] to-[#FF00F5] bg-clip-text text-transparent">
            🎨 Background Customizer
          </h1>
          <p className="text-gray-400 text-lg">
            Personalize your dashboard with custom backgrounds
          </p>
        </div>

        {/* Token Display */}
        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/50 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Coins className="w-12 h-12 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Background Tokens</p>
                <p className="text-4xl font-black text-yellow-400">{tokens}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-2">Token Costs:</p>
              <p className="text-sm">URL Change: <span className="text-yellow-400 font-bold">1 token</span></p>
              <p className="text-sm">AI Generate: <span className="text-orange-400 font-bold">2 tokens</span></p>
              <p className="text-sm">Reset: <span className="text-green-400 font-bold">1 token</span></p>
            </div>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Current Background
            </h3>
            <div 
              className="w-full h-64 rounded-xl border border-[#00F0FF]/20 bg-cover bg-center"
              style={{ backgroundImage: `url(${preview})` }}
            >
              <div className="w-full h-full backdrop-blur-sm bg-black/30 rounded-xl flex items-center justify-center">
                <p className="text-white font-bold text-xl">Dashboard Preview</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* URL Method */}
          <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-[#00F0FF]/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <LinkIcon className="w-6 h-6 text-[#00F0FF]" />
              <h2 className="text-2xl font-bold">Use Image URL</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Paste a direct link to any image online (costs 1 token)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Image URL</label>
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-[#00F0FF] focus:outline-none"
                />
              </div>

              <button
                onClick={handleUrlUpdate}
                disabled={saving || !urlInput || tokens < 1}
                className="w-full py-3 bg-gradient-to-r from-[#00F0FF] to-blue-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-[#00F0FF]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Set Background (1 Token)'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> Use high-quality images (1920x1080 or larger) for best results. Try Unsplash.com for free images!
              </p>
            </div>
          </div>

          {/* AI Generation Method */}
          <div className="bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-purple-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold">AI Generate</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Describe your ideal background and let AI create it (costs 2 tokens)
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Describe Your Background</label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., Mountain landscape at sunset with purple clouds, minimalist gradient with geometric shapes, futuristic cityscape at night..."
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleAIGenerate}
                disabled={generating || !aiPrompt || tokens < 2}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {generating ? 'Generating...' : 'Generate with AI (2 Tokens)'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <p className="text-sm text-purple-300">
                ✨ <strong>AI Powered:</strong> Uses GPT Image 1 to create unique backgrounds based on your description. Be creative!
              </p>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleReset}
            disabled={saving || tokens < 1}
            className="px-8 py-3 bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-600 transition-all disabled:opacity-50"
          >
            Reset to Default (1 Token)
          </button>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-4">📚 How It Works</h3>
          <ul className="space-y-2 text-gray-400">
            <li>• <strong className="text-white">Private:</strong> Your background is only visible to you</li>
            <li>• <strong className="text-white">Tokens:</strong> Each change costs tokens to maintain quality</li>
            <li>• <strong className="text-white">New Users:</strong> Get 10 free tokens to start</li>
            <li>• <strong className="text-white">Earn More:</strong> Complete quests and level up to earn more tokens</li>
            <li>• <strong className="text-white">AI Quality:</strong> AI-generated backgrounds are unique and high-quality</li>
          </ul>
        </div>

        {/* Example Prompts */}
        <div className="mt-8 bg-gradient-to-br from-[#1a1a24] to-[#121218] rounded-xl border border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-4">💡 AI Prompt Examples</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Abstract geometric shapes with blue and purple gradient',
              'Peaceful zen garden with cherry blossoms',
              'Cyberpunk city skyline at night with neon lights',
              'Northern lights over snowy mountains',
              'Minimalist waves pattern in teal colors',
              'Space nebula with stars and galaxies'
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => setAiPrompt(example)}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-left text-sm text-gray-300 hover:text-white transition-all"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundCustomizer;
