'use client';

import Link from 'next/link';

export default function BottomDock({ user }) {
  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[1100]">
      <div className="glass-card px-3 py-2 flex items-center gap-3">
        <div className="min-w-0">
          <div className="text-sm text-white font-semibold truncate max-w-[180px]">{user.username}</div>
          <div className="text-xs small-muted">Level {user.level}</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/profile" className="text-xs border border-white/10 rounded px-3 py-2 hover:border-[rgba(0,240,255,0.35)]">Profile</Link>
          <Link href="/settings" className="text-xs border border-white/10 rounded px-3 py-2 hover:border-[rgba(255,0,245,0.35)]">Settings</Link>
        </div>
      </div>
    </div>
  );
}
