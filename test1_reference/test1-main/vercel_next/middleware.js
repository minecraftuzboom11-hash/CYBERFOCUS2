import { NextResponse } from 'next/server';

export function middleware(req) {
  // Keep it minimal: just allow all. Client-side will redirect for now.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
