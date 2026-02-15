import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signUserToken } from '@/lib/auth';
import { setUserCookie } from '@/lib/cookies';
import { usersCollection, publicUser } from '@/lib/user';

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    const username = (body.username || '').trim();
    const password = body.password || '';

    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const users = await usersCollection();
    const existing = await users.findOne({ email }, { projection: { _id: 0 } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: crypto.randomUUID(),
      email,
      username,
      hashedPassword,
      level: 1,
      xp: 0,
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      disciplineScore: 50,
      backgroundTokens: 10,
      country: 'Unknown',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    await users.insertOne(user);

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
    return NextResponse.json({ error: 'Signup failed', details: String(e?.message || e) }, { status: 500 });
  }
}
