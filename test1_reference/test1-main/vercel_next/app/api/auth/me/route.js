import { NextResponse } from 'next/server';
import { verifyToken, getCookieToken } from '@/lib/auth';
import { usersCollection, publicUser } from '@/lib/user';

export async function GET(req) {
  try {
    const token = getCookieToken(new Request('http://local', { headers: { cookie: req?.headers?.get('cookie') || '' } }), 'qd4_token');
    if (!token) return NextResponse.json({ user: null }, { status: 200 });

    const payload = await verifyToken(token);
    const userId = payload.sub;

    const users = await usersCollection();
    const user = await users.findOne({ id: userId }, { projection: { _id: 0 } });
    if (!user) return NextResponse.json({ user: null }, { status: 200 });

    return NextResponse.json({ user: publicUser(user) }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ user: null, error: String(e?.message || e) }, { status: 200 });
  }
}
