import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import clientPromise from '@/lib/mongodb';

export async function GET(req) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');

  const pref = await db.collection('user_preferences').findOne({ userId }, { projection: { _id: 0 } });
  const user = await db.collection('users').findOne({ id: userId }, { projection: { _id: 0 } });

  return NextResponse.json({ background: pref?.background || 'default', tokens: user?.backgroundTokens || 0 }, { status: 200 });
}
