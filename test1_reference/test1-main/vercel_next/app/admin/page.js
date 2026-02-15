'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const login = async (e) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(data.error || 'Admin login failed');
      return;
    }
    setMsg('Admin session created. Open global quests manager.');
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Admin</h2>
          <Link href="/dashboard" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        <div className="glass-card p-6 mt-4">
          <div className="font-semibold">Admin login</div>
          <form onSubmit={login} className="mt-4 space-y-3">
            <input className="input" placeholder="Admin username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input className="input" placeholder="Admin password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="cyber-button w-full py-2">Login</button>
          </form>
          {msg && <div className={`text-sm mt-3 ${msg.includes('failed') ? 'text-red-400' : 'text-green-300'}`}>{msg}</div>}

          <div className="mt-4">
            <Link href="/admin/quests" className="px-4 py-2 rounded border border-white/10 hover:border-[rgba(0,240,255,0.35)] text-sm">Global quests manager</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
