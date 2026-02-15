import { NextResponse } from 'next/server';
import { requireAdminId } from '@/lib/requireAdmin';
import { globalQuestsCollection } from '@/lib/user';

export async function GET(req) {
  const adminId = await requireAdminId(req);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const docs = await (await globalQuestsCollection())
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray();

  return NextResponse.json({ quests: docs }, { status: 200 });
}

export async function POST(req) {
  const adminId = await requireAdminId(req);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const title = (body.title || '').trim();
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 });

  const doc = {
    id: crypto.randomUUID(),
    title,
    description: body.description || '',
    xpReward: Number(body.xp_reward || body.xpReward || 0),
    category: body.category || 'productivity',
    difficulty: body.difficulty || 'medium',
    expiresAt: body.expires_at || body.expiresAt || null,
    createdAt: new Date().toISOString()
  };

  await (await globalQuestsCollection()).insertOne(doc);
  return NextResponse.json({ success: true, quest: doc }, { status: 200 });
}
