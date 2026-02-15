import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import clientPromise from '@/lib/mongodb';

export async function GET(req, { params }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);

  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');

  const items = await db
    .collection('mode_items')
    .find({ userId, mode: params.mode }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return NextResponse.json({ items }, { status: 200 });
}

export async function POST(req, { params }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const title = (body.title || '').trim();
  const content = (body.content || '').trim();
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 });

  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');

  const doc = {
    id: crypto.randomUUID(),
    userId,
    mode: params.mode,
    title,
    content,
    createdAt: new Date().toISOString()
  };

  await db.collection('mode_items').insertOne(doc);
  return NextResponse.json({ success: true, item: doc }, { status: 200 });
}
