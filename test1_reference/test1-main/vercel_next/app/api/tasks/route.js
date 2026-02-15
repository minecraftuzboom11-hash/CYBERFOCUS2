import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import { tasksCollection, usersCollection } from '@/lib/user';

export async function GET(req) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const completedParam = searchParams.get('completed');
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10) || 200, 500);
  const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0);

  const query = { userId };
  if (completedParam !== null) query.completed = completedParam === 'true';

  const tasks = await (await tasksCollection())
    .find(query, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();

  return NextResponse.json({ tasks }, { status: 200 });
}

export async function POST(req) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const title = (body.title || '').trim();
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 });

  const users = await usersCollection();
  const user = await users.findOne({ id: userId }, { projection: { _id: 0 } });

  const difficulty = Number(body.difficulty || 1);
  const estimatedMinutes = Number(body.estimated_minutes || body.estimatedMinutes || 10);

  const streak = Number(user?.currentStreak || 0);
  const xpReward = Math.floor((difficulty * 20 + estimatedMinutes * 2) * Math.min(1 + streak * 0.1, 3));

  const task = {
    id: crypto.randomUUID(),
    userId,
    title,
    description: body.description || '',
    skillTree: body.skill_tree || body.skillTree || 'Mind',
    difficulty,
    estimatedMinutes,
    xpReward,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  await (await tasksCollection()).insertOne(task);
  return NextResponse.json({ success: true, task }, { status: 200 });
}
