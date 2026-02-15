'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user)).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Profile</h2>
          <Link href="/dashboard" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        <div className="glass-card p-6 mt-4">
          {!user ? (
            <div className="small-muted">Not logged in.</div>
          ) : (
            <div className="space-y-2">
              <div><span className="small-muted">Username:</span> {user.username}</div>
              <div><span className="small-muted">Email:</span> {user.email}</div>
              <div><span className="small-muted">Level:</span> {user.level}</div>
              <div><span className="small-muted">Total XP:</span> {user.totalXp}</div>
              <div><span className="small-muted">Streak:</span> {user.currentStreak}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
