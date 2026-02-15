'use client';

import Link from 'next/link';

export default function SettingsPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Link href="/dashboard" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        <div className="glass-card p-5 mt-4">
          <div className="font-semibold">Customization</div>
          <p className="small-muted mt-2">Background settings live here:</p>
          <Link className="cyber-button inline-block px-5 py-3 mt-4" href="/settings/background">Background</Link>
        </div>
      </div>
    </main>
  );
}
