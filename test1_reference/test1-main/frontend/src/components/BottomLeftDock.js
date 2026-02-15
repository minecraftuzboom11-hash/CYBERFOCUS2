import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, UserCircle2 } from 'lucide-react';
import { AuthContext } from '../App';

export default function BottomLeftDock() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[1100]">
      <div className="glass-card px-3 py-2 flex items-center gap-3">
        <div className="min-w-0">
          <div className="text-sm text-white font-semibold truncate max-w-[180px]">{user.username}</div>
          <div className="text-xs text-[#94A3B8]">Level {user.level}</div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="p-2 rounded hover:bg-white/5"
            aria-label="Profile"
          >
            <UserCircle2 className="w-5 h-5 text-[#00F0FF]" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/settings/background')}
            className="p-2 rounded hover:bg-white/5"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-[#FF00F5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
