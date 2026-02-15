import { verifyToken, getCookieToken } from './auth';

export async function requireUserId(req) {
  const token = getCookieToken(req, 'qd4_token');
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}
