import { NextResponse } from 'next/server';
import { clearUserCookie } from '@/lib/cookies';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('qd4_token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
