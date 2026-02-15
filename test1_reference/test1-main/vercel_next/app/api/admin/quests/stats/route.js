import { NextResponse } from 'next/server';
import { requireAdminId } from '@/lib/requireAdmin';
import { globalQuestsCollection, usersCollection } from '@/lib/user';

export async function GET(req) {
  const adminId = await requireAdminId(req);
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const totalGlobal = await (await globalQuestsCollection()).countDocuments({});
  const totalUsers = await (await usersCollection()).countDocuments({});

  return NextResponse.json({
    total_global_quests: totalGlobal,
    active_quests: totalGlobal,
    expired_quests: 0,
    total_completions: 0,
    average_completions_per_user: totalUsers ? 0 : 0
  });
}
