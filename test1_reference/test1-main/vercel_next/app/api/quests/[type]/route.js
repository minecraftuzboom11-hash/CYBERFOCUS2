import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import { questsCollection, globalQuestsCollection } from '@/lib/user';
import { QUEST_TEMPLATES, expiryFor } from '@/lib/quests';

export async function GET(req, { params }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = await params;
  const type = typeof p?.type === 'string' ? p.type : String(p?.type || '');

  if (type === 'global') {
    const gq = await (await globalQuestsCollection())
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();
    const quests = gq.map((q) => ({
      id: q.id,
      type: 'global',
      title: q.title,
      description: q.description,
      xp_reward: q.xpReward,
      category: q.category,
      difficulty: q.difficulty,
      completed: false,
      expires_at: q.expiresAt,
      progress: 0,
      target: 1
    }));
    return NextResponse.json({ quests, extra_quests: 0 }, { status: 200 });
  }

  const qc = await questsCollection();
  const existing = await qc.find({ userId, type }, { projection: { _id: 0 } }).toArray();
  if (existing.length) {
    return NextResponse.json({
      quests: existing.map((q) => ({
        id: q.id,
        type: q.type,
        title: q.title,
        description: q.description,
        xp_reward: q.xpReward,
        category: q.category,
        difficulty: q.difficulty,
        completed: q.completed,
        expires_at: q.expiresAt,
        progress: q.progress,
        target: q.target
      })),
      extra_quests: 0
    });
  }

  const templates = QUEST_TEMPLATES[type] || [];
  const expiresAt = expiryFor(type);

  const docs = templates.map((t) => ({
    id: crypto.randomUUID(),
    userId,
    type,
    title: t.title,
    description: t.description,
    xpReward: t.xpReward,
    category: t.category,
    difficulty: t.difficulty,
    completed: false,
    createdAt: new Date().toISOString(),
    expiresAt,
    progress: 0,
    target: 1
  }));

  if (docs.length) await qc.insertMany(docs);

  return NextResponse.json({
    quests: docs.map((q) => ({
      id: q.id,
      type: q.type,
      title: q.title,
      description: q.description,
      xp_reward: q.xpReward,
      category: q.category,
      difficulty: q.difficulty,
      completed: q.completed,
      expires_at: q.expiresAt,
      progress: q.progress,
      target: q.target
    })),
    extra_quests: 0
  });
}
