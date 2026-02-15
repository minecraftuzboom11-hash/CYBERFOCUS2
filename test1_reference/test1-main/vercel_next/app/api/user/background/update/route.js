import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import clientPromise from '@/lib/mongodb';

export async function POST(req) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const background = body.background || 'default';

  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');

  await db.collection('user_preferences').updateOne(
    { userId },
    { $set: { userId, background, updatedAt: new Date().toISOString() } },
    { upsert: true }
  );

  return NextResponse.json({ success: true, background }, { status: 200 });
}
