'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const MODE_TITLES = {
  'ai-life-strategist': 'AI Life Strategist',
  'dopamine-economy': 'Dopamine Economy',
  'identity-transformation': 'Identity Transformation',
  'world-impact': 'World Impact',
  'deep-work-engine': 'Deep Work Engine',
  'psychological-analytics': 'Psychological Analytics',
  'founder-mode': 'Founder Mode'
};

export default function ModeDetail({ params }) {
  const mode = params.mode;
  const title = MODE_TITLES[mode] || mode;

  const [items, setItems] = useState([]);
  const [t, setT] = useState('');
  const [c, setC] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const res = await fetch(`/api/modes/${mode}/items`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    setItems(data.items || []);
  };

  useEffect(() => {
    load();
  }, [mode]);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/modes/${mode}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, content: c })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    setT('');
    setC('');
    await load();
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{title}</h2>
          <Link href="/modes" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        {error && <div className="text-sm text-red-400 mt-3">{error}</div>}

        <div className="glass-card p-6 mt-4">
          <div className="font-semibold">Create entry</div>
          <form onSubmit={create} className="mt-3 space-y-2">
            <input className="input" placeholder="Title" value={t} onChange={(e) => setT(e.target.value)} />
            <textarea className="input" rows={4} placeholder="Content" value={c} onChange={(e) => setC(e.target.value)} />
            <button className="cyber-button px-5 py-2">Save</button>
          </form>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((it) => (
            <div key={it.id} className="glass-card p-5">
              <div className="font-semibold">{it.title}</div>
              <div className="small-muted text-sm mt-2 whitespace-pre-wrap">{it.content}</div>
              <div className="small-muted text-xs mt-2">{it.createdAt}</div>
            </div>
          ))}
          {items.length === 0 && <div className="glass-card p-5">No entries yet.</div>}
        </div>
      </div>
    </main>
  );
}
