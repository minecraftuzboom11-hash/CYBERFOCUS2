'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // If already logged in, bounce to dashboard
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d?.user) router.push('/dashboard');
    }).catch(() => {});
  }, [router]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload = {
        email,
        password,
        ...(mode === 'signup' ? { username } : {})
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-md glass-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{mode === 'login' ? 'Login' : 'Create account'}</h2>
          <button
            className="text-sm small-muted hover:text-white"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            type="button"
          >
            {mode === 'login' ? 'Need an account?' : 'Have an account?'}
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={submit}>
          {mode === 'signup' && (
            <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          )}
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button className="cyber-button w-full py-2" disabled={loading}>
            {loading ? 'Please wait…' : (mode === 'login' ? 'Login' : 'Sign up')}
          </button>
        </form>

        <p className="small-muted text-xs mt-3">
          Uses secure httpOnly cookies (no localStorage tokens).
        </p>
      </div>
    </main>
  );
}
