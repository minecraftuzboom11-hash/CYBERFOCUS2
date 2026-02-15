import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  Music, Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, ChevronUp, ChevronDown, ExternalLink
} from 'lucide-react';

const MusicPlayer = () => {
  const [tracks, setTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [settings, setSettings] = useState({
    music_enabled: true,
    music_volume: 50,
    preferred_music_category: 'lofi'
  });
  const [category, setCategory] = useState('lofi');
  const audioRef = useRef(null);

  useEffect(() => {
    fetchTracks();
    fetchSettings();
    
    // Listen for settings updates
    const handleSettingsUpdate = (e) => {
      setSettings(e.detail);
      setVolume(e.detail.music_volume);
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  useEffect(() => {
    if (settings.preferred_music_category) {
      setCategory(settings.preferred_music_category);
      fetchTracks(settings.preferred_music_category);
    }
  }, [settings.preferred_music_category]);

  const fetchTracks = async (cat = category) => {
    try {
      const response = await axios.get('/music', { params: { category: cat } });
      setTracks(response.data);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      setSettings(response.data);
      setVolume(response.data.music_volume);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const currentTrack = tracks[currentTrackIndex] || {};

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const openInYouTube = () => {
    if (currentTrack.url) {
      window.open(currentTrack.url, '_blank');
    }
  };

  const categories = ['lofi', 'ambient', 'classical', 'nature', 'synthwave'];

  if (!settings.music_enabled) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-20 lg:bottom-4 right-4 z-30"
      data-testid="music-player"
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-80 glass-card p-4 mb-2"
          >
            {/* Category Selector */}
            <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    fetchTracks(cat);
                  }}
                  className={`px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                    category === cat
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                      : 'bg-white/5 text-[#a0a0b0] hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Current Track */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                {currentTrack.thumbnail ? (
                  <img 
                    src={currentTrack.thumbnail} 
                    alt={currentTrack.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-[#00F0FF]/20 flex items-center justify-center">
                    <Music className="w-6 h-6 text-[#00F0FF]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{currentTrack.title || 'Select a track'}</h4>
                  <p className="text-xs text-[#a0a0b0] truncate">{currentTrack.artist}</p>
                </div>
                <button
                  onClick={openInYouTube}
                  className="p-2 text-[#a0a0b0] hover:text-[#00F0FF] transition-colors"
                  title="Open in YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Track List */}
            <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
              {tracks.map((track, i) => (
                <button
                  key={track.id || i}
                  onClick={() => setCurrentTrackIndex(i)}
                  className={`w-full p-2 rounded text-left transition-colors ${
                    i === currentTrackIndex
                      ? 'bg-[#00F0FF]/20 text-[#00F0FF]'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="text-sm font-medium truncate">{track.title}</div>
                  <div className="text-xs text-[#a0a0b0] truncate">{track.artist}</div>
                </button>
              ))}
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-[#a0a0b0]">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1 accent-[#00F0FF]"
              />
              <span className="text-xs text-[#a0a0b0] w-8">{isMuted ? 0 : volume}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Player Button */}
      <div className="glass-card p-3 flex items-center gap-3">
        {/* Expand Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-[#a0a0b0] hover:text-white transition-colors"
          data-testid="expand-music-btn"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        {/* Track Info */}
        <div className="min-w-0 max-w-32">
          <div className="text-sm font-medium truncate">{currentTrack.title || 'No track'}</div>
          <div className="text-xs text-[#a0a0b0] truncate">{currentTrack.artist}</div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-2 text-[#a0a0b0] hover:text-white transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-2 bg-[#00F0FF]/20 text-[#00F0FF] rounded-full hover:bg-[#00F0FF]/30 transition-colors"
            data-testid="play-pause-btn"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={handleNext}
            className="p-2 text-[#a0a0b0] hover:text-white transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default MusicPlayer;
