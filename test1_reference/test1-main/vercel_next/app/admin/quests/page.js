'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminQuestsPage() {
  const [quests, setQuests] = useState([]);
  const [title, setTitle] = useState('');
  const [xp, setXp] = useState(100);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const res = await fetch('/api/admin/quests/global');
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Unauthorized');
      return;
    }
    setQuests(data.quests || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/quests/global', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, xp_reward: Number(xp), category: 'productivity', difficulty: 'medium' })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    setTitle('');
    await load();
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Global Quest Manager</h2>
          <Link href="/dashboard" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        {error && <div className="text-sm text-red-400 mt-3">{error}</div>}

        <div className="glass-card p-6 mt-4">
          <div className="font-semibold">Create global quest</div>
          <form onSubmit={create} className="mt-3 flex gap-2">
            <input className="input" placeholder="Quest title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input className="input w-[120px]" type="number" value={xp} onChange={(e) => setXp(e.target.value)} />
            <button className="cyber-button px-4">Create</button>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {quests.map((q) => (
            <div key={q.id} className="glass-card p-5">
              <div className="font-semibold">{q.title}</div>
              <div className="small-muted text-sm mt-1">XP {q.xpReward}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
