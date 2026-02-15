import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import clientPromise from '@/lib/mongodb';

export async function GET(req) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(parseInt(searchParams.get('days') || '30', 10) || 30, 365);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');

  const tasks = await db.collection('tasks').find({ userId, completed: true, completedAt: { $gte: since } }, { projection: { _id: 0 } }).limit(2000).toArray();
  const focus = await db.collection('focus_sessions').find({ userId, startTime: { $gte: since } }, { projection: { _id: 0 } }).limit(2000).toArray();

  const totalTasks = tasks.length;
  const totalFocusTime = focus.reduce((s, x) => s + (x.durationMinutes || 0), 0);

  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    const dayTasks = tasks.filter((t) => (t.completedAt || '').startsWith(dateStr)).length;
    const dayFocus = focus
      .filter((f) => (f.startTime || '').startsWith(dateStr))
      .reduce((s, f) => s + (f.durationMinutes || 0), 0);

    weeklyData.push({ date: dateStr, tasks: dayTasks, focus_minutes: dayFocus });
  }

  return NextResponse.json({
    total_tasks: totalTasks,
    total_focus_time: totalFocusTime,
    current_level: 1,
    current_xp: 0,
    next_level_xp: 100,
    discipline_score: 50,
    current_streak: 0,
    longest_streak: 0,
    burnout_risk: { risk_level: 'low', message: 'You are pacing well.' },
    optimal_time: 'Try deep work in your best focus window.',
    weekly_data: weeklyData,
    window_days: days
  });
}
