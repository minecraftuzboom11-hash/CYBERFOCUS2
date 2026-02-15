import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import { usersCollection } from '@/lib/user';

export async function GET(req, { params }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 200);

  const users = await usersCollection();
  const current = await users.findOne({ id: userId }, { projection: { _id: 0 } });

  const scope = params.scope;
  const query = scope === 'local' ? { country: current?.country || 'Unknown' } : {};

  const leaderboard = await users
    .find(query, { projection: { _id: 0, username: 1, level: 1, totalXp: 1, currentStreak: 1, country: 1 } })
    .sort({ totalXp: -1 })
    .limit(limit)
    .toArray();

  const totalUsers = await users.countDocuments(query);
  const higher = await users.countDocuments({ ...query, totalXp: { $gt: Number(current?.totalXp || 0) } });

  return NextResponse.json({
    leaderboard: leaderboard.map((u) => ({
      username: u.username,
      level: u.level,
      total_xp: u.totalXp,
      current_streak: u.currentStreak
    })),
    current_user_rank: higher + 1,
    total_users: totalUsers,
    country: current?.country || ''
  });
}
