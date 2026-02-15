import Link from 'next/link';

const MODES = [
  { name: 'AI Life Strategist', slug: 'ai-life-strategist' },
  { name: 'Dopamine Economy', slug: 'dopamine-economy' },
  { name: 'Identity Transformation', slug: 'identity-transformation' },
  { name: 'World Impact', slug: 'world-impact' },
  { name: 'Deep Work Engine', slug: 'deep-work-engine' },
  { name: 'Psychological Analytics', slug: 'psychological-analytics' },
  { name: 'Founder Mode', slug: 'founder-mode' }
];

export default function ModesPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Modes</h2>
          <Link href="/dashboard" className="text-sm small-muted hover:text-white">Back</Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {MODES.map((m) => (
            <Link key={m.slug} href={`/modes/${m.slug}`} className="glass-card p-6 hover:border-[rgba(0,240,255,0.35)]">
              <div className="font-semibold">{m.name}</div>
              <div className="small-muted text-sm mt-1">Create + save + list entries</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
