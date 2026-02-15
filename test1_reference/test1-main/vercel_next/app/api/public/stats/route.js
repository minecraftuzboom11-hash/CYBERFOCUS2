import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME || 'quest_dashboard_4');

  const totalUsers = await db.collection('users').countDocuments({});
  const completedTasks = await db.collection('tasks').countDocuments({ completed: true });
  const allTasks = await db.collection('tasks').countDocuments({});

  const successRate = allTasks ? Math.round((completedTasks / allTasks) * 100) : 95;
  return NextResponse.json({ total_users: totalUsers, completed_tasks: completedTasks, success_rate: successRate }, { status: 200 });
}
