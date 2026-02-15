import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/requireUser';
import { tasksCollection } from '@/lib/user';

export async function DELETE(req, { params }) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const p = await params;
  const taskId = p?.taskId;
  const res = await (await tasksCollection()).deleteOne({ id: taskId, userId });
  if (res.deletedCount === 0) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  return NextResponse.json({ success: true }, { status: 200 });
}
