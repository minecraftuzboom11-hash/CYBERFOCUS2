'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function QuestsTypePage({ params }) {
  const type = params.type;
  const [quests, setQuests] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const res = await fetch(`/api/quests/${type}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to load');
      return;
    }
    setQuests(data.quests || []);
  };

  useEffect(() => {
    load();
  }, [type]);

  const complete = async (q) => {
    const res = await fetch(`/api/quest-actions/${q.id}/complete?quest_type=${type}`, { method: 'POST' });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || 'Failed to complete');
      return;
    }
    await load();
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{type} quests</h2>
          <Link href="/dashboard" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        <div className="flex gap-2 mt-4">
          {['daily','weekly','monthly','beginner','global'].map((t) => (
            <Link key={t} href={`/quests/${t}`} className={`px-3 py-2 rounded border text-xs ${t===type ? 'border-[rgba(0,240,255,0.5)] bg-[rgba(0,240,255,0.10)]' : 'border-white/10 hover:border-[rgba(0,240,255,0.35)] small-muted hover:text-white'}`}>{t}</Link>
          ))}
        </div>

        {error && <div className="text-sm text-red-400 mt-3">{error}</div>}

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {quests.map((q) => (
            <div key={q.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{q.title}</div>
                  <div className="small-muted text-sm mt-1">{q.description}</div>
                </div>
                <div className="text-xs small-muted">XP {q.xp_reward ?? 0}</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className={`text-xs ${q.completed ? 'text-green-300' : 'small-muted'}`}>{q.completed ? 'Completed' : 'Not completed'}</div>
                {!q.completed && type !== 'global' && (
                  <button onClick={() => complete(q)} className="cyber-button px-4 py-2 text-xs">Complete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
