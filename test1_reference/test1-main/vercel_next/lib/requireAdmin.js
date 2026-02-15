import { verifyToken, getCookieToken } from './auth';

export async function requireAdminId(req) {
  const token = getCookieToken(req, 'qd4_admin_token');
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    return payload.admin;
  } catch {
    return null;
  }
}
