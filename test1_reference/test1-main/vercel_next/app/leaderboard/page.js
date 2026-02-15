'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [scope, setScope] = useState('global');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const res = await fetch(`/api/leaderboard/${scope}?limit=25`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to load');
      return;
    }
    setRows(data.leaderboard || []);
  };

  useEffect(() => {
    load();
  }, [scope]);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Leaderboard</h2>
          <Link href="/dashboard" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        <div className="mt-4 flex gap-2">
          {['global','local'].map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`px-3 py-2 rounded border text-xs ${s===scope ? 'border-[rgba(0,240,255,0.5)] bg-[rgba(0,240,255,0.10)]' : 'border-white/10 hover:border-[rgba(0,240,255,0.35)] small-muted hover:text-white'}`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <div className="text-sm text-red-400 mt-3">{error}</div>}

        <div className="glass-card p-5 mt-4">
          <div className="grid grid-cols-3 text-xs small-muted font-mono uppercase tracking-wider">
            <div>User</div>
            <div>Level</div>
            <div>XP</div>
          </div>
          <div className="mt-3 space-y-2">
            {rows.map((r, idx) => (
              <div key={idx} className="grid grid-cols-3">
                <div className="truncate">{r.username}</div>
                <div>{r.level}</div>
                <div>{r.total_xp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
