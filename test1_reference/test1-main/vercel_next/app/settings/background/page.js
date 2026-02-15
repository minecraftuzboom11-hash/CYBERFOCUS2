'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BackgroundPage() {
  const [background, setBackground] = useState('default');
  const [tokens, setTokens] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const res = await fetch('/api/user/background');
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to load');
      return;
    }
    setBackground(data.background);
    setTokens(data.tokens);
  };

  useEffect(() => {
    load();
  }, []);

  const update = async (bg) => {
    const res = await fetch('/api/user/background/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ background: bg })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    setBackground(data.background);
  };

  const generate = async () => {
    const res = await fetch('/api/user/background/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed');
      return;
    }
    setOptions(data.options || []);
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Background</h2>
          <Link href="/dashboard" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        {error && <div className="text-sm text-red-400 mt-3">{error}</div>}

        <div className="glass-card p-5 mt-4">
          <div className="small-muted text-sm">Current: <span className="text-white">{background}</span></div>
          <div className="small-muted text-sm mt-1">Tokens: <span className="text-white">{tokens}</span></div>

          <div className="mt-4 flex gap-2">
            {['default','neon-grid','cyber-sunset','deep-space'].map((bg) => (
              <button key={bg} className="px-3 py-2 rounded border border-white/10 hover:border-[rgba(0,240,255,0.35)] text-xs" onClick={() => update(bg)}>
                Set {bg}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 mt-4">
          <div className="font-semibold">Generate options (mock)</div>
          <div className="mt-3 flex gap-2">
            <input className="input" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. purple neon city" />
            <button className="cyber-button px-4" onClick={generate}>Generate</button>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-3">
            {options.map((o, idx) => (
              <button key={idx} className="glass-card p-4 text-left hover:border-[rgba(0,240,255,0.35)]" onClick={() => update(o.background)}>
                <div className="text-sm font-semibold">{o.background}</div>
                <div className="text-xs small-muted mt-1">Cost {o.cost}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
