import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';

export async function POST(req) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const prompt = (body.prompt || 'neo gradient').trim();

  const options = [
    { background: `gradient:${prompt}:cyan-magenta`, cost: 2 },
    { background: `gradient:${prompt}:purple-blue`, cost: 2 },
    { background: `gradient:${prompt}:neon-grid`, cost: 2 }
  ];

  return NextResponse.json({ success: true, options }, { status: 200 });
}
