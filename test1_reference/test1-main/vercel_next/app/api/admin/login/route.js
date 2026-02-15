import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signAdminToken } from '@/lib/auth';
import { setAdminCookie } from '@/lib/cookies';
import { adminsCollection } from '@/lib/user';

async function ensureSuperAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;

  const admins = await adminsCollection();
  const existing = await admins.findOne({ username }, { projection: { _id: 0 } });
  if (existing) return;

  const hashedPassword = await bcrypt.hash(password, 10);
  await admins.insertOne({
    id: crypto.randomUUID(),
    username,
    hashedPassword,
    isSuperAdmin: true,
    createdAt: new Date().toISOString()
  });
}

export async function POST(req) {
  try {
    await ensureSuperAdmin();

    const body = await req.json();
    const username = (body.username || '').trim();
    const password = body.password || '';

    const admins = await adminsCollection();
    const admin = await admins.findOne({ username });
    if (!admin?.hashedPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, admin.hashedPassword);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signAdminToken(admin.id);

    const res = NextResponse.json({ success: true }, { status: 200 });
    res.cookies.set('qd4_admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Admin login failed' }, { status: 500 });
  }
}
