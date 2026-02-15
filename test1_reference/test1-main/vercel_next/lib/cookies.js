import { cookies } from 'next/headers';

export const USER_COOKIE = 'qd4_token';
export const ADMIN_COOKIE = 'qd4_admin_token';

export function setUserCookie(token) {
  const store = cookies();
  store.set(USER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearUserCookie() {
  const store = cookies();
  store.set(USER_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export function getUserCookie() {
  return cookies().get(USER_COOKIE)?.value;
}

export function setAdminCookie(token) {
  const store = cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearAdminCookie() {
  const store = cookies();
  store.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export function getAdminCookie() {
  return cookies().get(ADMIN_COOKIE)?.value;
}
