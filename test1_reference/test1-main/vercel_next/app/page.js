import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="glass-card p-8">
          <div className="text-sm small-muted font-mono uppercase tracking-wider">Quest Dashboard</div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mt-2">Level Up Your Life</h1>
          <p className="mt-4 text-base small-muted">
            Quests, deep work, identity shifts, founder mode, and a focus music player.
          </p>

          <div className="mt-6 flex gap-3">
            <Link className="cyber-button px-5 py-3" href="/auth">Start your journey</Link>
            <Link className="px-5 py-3 rounded-lg border border-white/10 hover:border-[rgba(0,240,255,0.35)]" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {[['Daily Quests','/quests/daily'],['Leaderboard','/leaderboard'],['Admin','/admin']].map(([t,href]) => (
            <Link key={href} href={href} className="glass-card p-5 hover:border-[rgba(0,240,255,0.35)]">
              <div className="font-semibold">{t}</div>
              <div className="small-muted text-sm mt-1">Open</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
