import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import { tasksCollection, usersCollection } from '@/lib/user';

function levelFromTotalXp(totalXp) {
  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  return Math.max(1, Math.min(1000, level));
}

export async function PATCH(req, { params }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = await params;
  const taskId = p?.taskId;
  const tasks = await tasksCollection();
  const task = await tasks.findOne({ id: taskId, userId }, { projection: { _id: 0 } });
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  if (task.completed) return NextResponse.json({ success: true, xp_gained: 0, level_up: false, new_level: 1 });

  const xpGained = Number(task.xpReward || 0);

  const users = await usersCollection();
  const user = await users.findOne({ id: userId }, { projection: { _id: 0 } });
  const newTotal = Number(user?.totalXp || 0) + xpGained;
  const newLevel = levelFromTotalXp(newTotal);
  const oldLevel = Number(user?.level || 1);

  await tasks.updateOne({ id: taskId }, { $set: { completed: true, completedAt: new Date().toISOString() } });
  await users.updateOne({ id: userId }, { $set: { totalXp: newTotal, level: newLevel } });

  return NextResponse.json({ success: true, xp_gained: xpGained, level_up: newLevel > oldLevel, new_level: newLevel }, { status: 200 });
}
