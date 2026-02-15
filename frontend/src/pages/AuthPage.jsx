import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../App';
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const AuthPage = () => {
  const { login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        login(response.data.token, response.data.user);
      } else {
        if (formData.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          setLoading(false);
          return;
        }
        const response = await axios.post('/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        login(response.data.token, response.data.user);
        toast.success('Welcome to CyberFocus, warrior!');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] grid-background flex items-center justify-center p-4">
      {/* Background */}
      <div 
        className="fixed inset-0 opacity-10"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1627740660376-bc7506720b8a?w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8" data-testid="auth-logo">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#00F0FF] to-[#0099FF] flex items-center justify-center">
            <Zap className="w-7 h-7 text-black" />
          </div>
          <span className="text-2xl font-bold font-orbitron tracking-wider">
            CYBER<span className="text-[#00F0FF]">FOCUS</span>
          </span>
        </Link>

        {/* Auth Card */}
        <div className="glass-card p-8 border border-white/10" data-testid="auth-card">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-orbitron mb-2" data-testid="auth-title">
              {isLogin ? 'Welcome Back' : 'Join the Arena'}
            </h1>
            <p className="text-[#a0a0b0]">
              {isLogin ? 'Enter your credentials to continue' : 'Create your warrior profile'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2 text-[#a0a0b0]">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0b0]" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-colors"
                    placeholder="Choose your warrior name"
                    required={!isLogin}
                    data-testid="username-input"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-[#a0a0b0]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0b0]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-colors"
                  placeholder="warrior@example.com"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-[#a0a0b0]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a0a0b0]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-12 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-colors"
                  placeholder="••••••••"
                  required
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0b0] hover:text-white"
                  data-testid="toggle-password-btn"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full cyber-button py-4 flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="auth-submit-btn"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
                />
              ) : (
                <>
                  {isLogin ? 'Enter the Arena' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#a0a0b0] hover:text-[#00F0FF] transition-colors"
              data-testid="toggle-auth-mode-btn"
            >
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span className="text-[#00F0FF] font-semibold">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>

        {/* Back Link */}
        <Link 
          to="/" 
          className="block text-center mt-6 text-[#a0a0b0] hover:text-white transition-colors"
          data-testid="back-to-home-link"
        >
          ← Back to Home
        </Link>
      </motion.div>
    </div>
  );
};

export default AuthPage;
