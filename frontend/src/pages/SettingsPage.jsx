import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { AuthContext } from '../App';
import Layout from '../components/Layout';
import { 
  Settings as SettingsIcon, Music, Bell, Clock, Palette,
  Volume2, VolumeX, Save, RotateCcw
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState({
    music_enabled: true,
    music_volume: 50,
    preferred_music_category: 'lofi',
    notifications_enabled: true,
    focus_duration: 25,
    theme: 'dark'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.put('/settings', settings);
      toast.success('Settings saved!');
      
      // Dispatch event for music player to update
      window.dispatchEvent(new CustomEvent('settingsUpdated', { detail: settings }));
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      music_enabled: true,
      music_volume: 50,
      preferred_music_category: 'lofi',
      notifications_enabled: true,
      focus_duration: 25,
      theme: 'dark'
    });
    toast.info('Settings reset to defaults');
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
      <div className="max-w-3xl mx-auto px-4 py-8" data-testid="settings-page">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black uppercase font-orbitron mb-2" data-testid="settings-title">
            Settings
          </h1>
          <p className="text-[#a0a0b0]">Customize your CyberFocus experience</p>
        </div>

        <div className="space-y-6">
          {/* Music Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
            data-testid="music-settings"
          >
            <div className="flex items-center gap-3 mb-6">
              <Music className="w-6 h-6 text-[#00F0FF]" />
              <h2 className="text-xl font-bold font-orbitron">Music</h2>
            </div>

            <div className="space-y-6">
              {/* Enable Music */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Music</h3>
                  <p className="text-sm text-[#a0a0b0]">Play background music while working</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, music_enabled: !settings.music_enabled })}
                  className={`w-14 h-8 rounded-full transition-colors relative ${
                    settings.music_enabled ? 'bg-[#00F0FF]' : 'bg-white/20'
                  }`}
                  data-testid="music-toggle"
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${
                    settings.music_enabled ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Volume */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium flex items-center gap-2">
                    {settings.music_volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    Volume
                  </h3>
                  <span className="text-[#00F0FF] font-mono">{settings.music_volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.music_volume}
                  onChange={(e) => setSettings({ ...settings, music_volume: parseInt(e.target.value) })}
                  className="w-full accent-[#00F0FF]"
                  data-testid="volume-slider"
                />
              </div>

              {/* Preferred Category */}
              <div>
                <h3 className="font-medium mb-2">Preferred Category</h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {['lofi', 'ambient', 'classical', 'nature', 'synthwave'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSettings({ ...settings, preferred_music_category: cat })}
                      className={`px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                        settings.preferred_music_category === cat
                          ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/50'
                          : 'bg-white/5 text-[#a0a0b0] hover:bg-white/10'
                      }`}
                      data-testid={`music-cat-${cat}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Focus Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6"
            data-testid="focus-settings"
          >
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-[#FF0099]" />
              <h2 className="text-xl font-bold font-orbitron">Focus Mode</h2>
            </div>

            <div>
              <h3 className="font-medium mb-2">Default Duration</h3>
              <div className="grid grid-cols-4 gap-2">
                {[15, 25, 45, 60].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setSettings({ ...settings, focus_duration: duration })}
                    className={`px-4 py-3 rounded-lg font-mono transition-colors ${
                      settings.focus_duration === duration
                        ? 'bg-[#FF0099]/20 text-[#FF0099] border border-[#FF0099]/50'
                        : 'bg-white/5 text-[#a0a0b0] hover:bg-white/10'
                    }`}
                    data-testid={`duration-${duration}`}
                  >
                    {duration}m
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
            data-testid="notification-settings"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-[#39FF14]" />
              <h2 className="text-xl font-bold font-orbitron">Notifications</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Enable Notifications</h3>
                <p className="text-sm text-[#a0a0b0]">Get reminders for streaks and tasks</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, notifications_enabled: !settings.notifications_enabled })}
                className={`w-14 h-8 rounded-full transition-colors relative ${
                  settings.notifications_enabled ? 'bg-[#39FF14]' : 'bg-white/20'
                }`}
                data-testid="notifications-toggle"
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${
                  settings.notifications_enabled ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </motion.div>

          {/* Theme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
            data-testid="theme-settings"
          >
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-[#FAFF00]" />
              <h2 className="text-xl font-bold font-orbitron">Theme</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
                className={`p-4 rounded-lg transition-colors ${
                  settings.theme === 'dark'
                    ? 'bg-[#FAFF00]/20 border-2 border-[#FAFF00]/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                data-testid="theme-dark"
              >
                <div className="w-full h-20 bg-[#050505] rounded-lg mb-2 border border-white/10" />
                <span className="font-medium">Dark (Cyber)</span>
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'midnight' })}
                className={`p-4 rounded-lg transition-colors ${
                  settings.theme === 'midnight'
                    ? 'bg-[#FAFF00]/20 border-2 border-[#FAFF00]/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                data-testid="theme-midnight"
              >
                <div className="w-full h-20 bg-gradient-to-br from-[#0a0020] to-[#000010] rounded-lg mb-2 border border-white/10" />
                <span className="font-medium">Midnight</span>
              </button>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={resetToDefaults}
              className="flex-1 py-4 bg-white/5 rounded-lg text-[#a0a0b0] hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              data-testid="reset-settings-btn"
            >
              <RotateCcw className="w-5 h-5" />
              Reset to Defaults
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex-1 cyber-button py-4 flex items-center justify-center gap-2"
              data-testid="save-settings-btn"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
