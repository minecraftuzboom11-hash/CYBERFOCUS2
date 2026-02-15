'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    setLoading(true);
    const res = await fetch('/api/tasks');
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to load');
      setLoading(false);
      return;
    }
    setTasks(data.tasks || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createTask = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create');
      return;
    }
    setTitle('');
    await load();
  };

  const complete = async (id) => {
    await fetch(`/api/tasks/${id}/complete`, { method: 'PATCH' });
    await load();
  };

  const del = async (id) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Tasks</h2>
          <Link href="/dashboard" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        <div className="glass-card p-5 mt-4">
          <form onSubmit={createTask} className="flex gap-2">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
            <button className="cyber-button px-4" type="submit">Add</button>
          </form>
          {error && <div className="text-sm text-red-400 mt-2">{error}</div>}
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="glass-card p-5">Loading…</div>
          ) : tasks.length === 0 ? (
            <div className="glass-card p-5">No tasks yet.</div>
          ) : (
            tasks.map((t) => (
              <div key={t.id} className="glass-card p-5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{t.title}</div>
                  <div className="text-xs small-muted">XP {t.xpReward ?? t.xp_reward ?? 0}</div>
                </div>
                <div className="flex items-center gap-2">
                  {!t.completed && (
                    <button onClick={() => complete(t.id)} className="px-3 py-2 rounded border border-white/10 hover:border-[rgba(0,240,255,0.35)] text-xs">
                      Complete
                    </button>
                  )}
                  <button onClick={() => del(t.id)} className="px-3 py-2 rounded border border-white/10 hover:border-[rgba(255,0,245,0.35)] text-xs">
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
