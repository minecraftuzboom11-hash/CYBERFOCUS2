import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signUserToken } from '@/lib/auth';
import { setUserCookie } from '@/lib/cookies';
import { usersCollection, publicUser } from '@/lib/user';

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const users = await usersCollection();
    const user = await users.findOne({ email });
    if (!user?.hashedPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await users.updateOne({ id: user.id }, { $set: { lastActive: new Date().toISOString() } });

    const token = await signUserToken(user.id);

    const res = NextResponse.json({ success: true, user: publicUser(user) }, { status: 200 });
    res.cookies.set('qd4_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
