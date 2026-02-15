import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import { questsCollection, usersCollection } from '@/lib/user';

function levelFromTotalXp(totalXp) {
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  return Math.max(1, Math.min(1000, level));
}

export async function POST(req, { params }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const questType = searchParams.get('quest_type') || 'daily';

  const qc = await questsCollection();
  const p = await params;
  const questId = p?.questId;
  const q = await qc.findOne({ id: questId, userId, type: questType }, { projection: { _id: 0 } });
  if (!q) return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
  if (q.completed) return NextResponse.json({ success: true, xp_gained: 0, level_up: false, new_level: 1 });

  const xpGained = Number(q.xpReward || 0);

  const users = await usersCollection();
  const user = await users.findOne({ id: userId }, { projection: { _id: 0 } });
  const newTotal = Number(user?.totalXp || 0) + xpGained;
  const newLevel = levelFromTotalXp(newTotal);
  const oldLevel = Number(user?.level || 1);

  await qc.updateOne({ id: questId }, { $set: { completed: true } });
  await users.updateOne({ id: userId }, { $set: { totalXp: newTotal, level: newLevel } });

  return NextResponse.json({ success: true, xp_gained: xpGained, level_up: newLevel > oldLevel, new_level: newLevel }, { status: 200 });
}
