'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomDock from '@/components/BottomDock';
import MusicPlayer from '@/components/MusicPlayer';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto glass-card p-6">Loading…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto glass-card p-6">
          <div className="text-lg font-bold">You’re not logged in</div>
          <p className="small-muted mt-2">Login to access your dashboard.</p>
          <Link className="cyber-button inline-block px-5 py-3 mt-4" href="/auth">Go to Auth</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-mono uppercase tracking-wider small-muted">Main menu</div>
            <h2 className="text-2xl font-bold mt-1">Welcome, {user.username}</h2>
            <div className="small-muted mt-1">Level {user.level} • Tokens {user.backgroundTokens ?? 0}</div>
          </div>
          <button onClick={logout} className="px-4 py-2 rounded border border-white/10 hover:border-white/30">Logout</button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {[
            ['Tasks', '/tasks'],
            ['Quests', '/quests/daily'],
            ['Leaderboard', '/leaderboard'],
            ['Background', '/settings/background'],
            ['Admin panel', '/admin'],
            ['Modes', '/modes']
          ].map(([t, href]) => (
            <Link key={href} href={href} className="glass-card p-5 hover:border-[rgba(0,240,255,0.35)]">
              <div className="font-semibold">{t}</div>
              <div className="small-muted text-sm mt-1">Open</div>
            </Link>
          ))}
        </div>

        <div className="glass-card p-6 mt-6">
          <div className="font-semibold">Quick stats</div>
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            <div className="glass-card p-4">
              <div className="small-muted text-xs font-mono uppercase">Streak</div>
              <div className="text-xl font-bold">{user.currentStreak ?? 0}</div>
            </div>
            <div className="glass-card p-4">
              <div className="small-muted text-xs font-mono uppercase">Discipline</div>
              <div className="text-xl font-bold">{user.disciplineScore ?? 50}/100</div>
            </div>
            <div className="glass-card p-4">
              <div className="small-muted text-xs font-mono uppercase">Total XP</div>
              <div className="text-xl font-bold">{user.totalXp ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      <BottomDock user={user} />
      <MusicPlayer enabled={!!user} />
    </main>
  );
}
