import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { getDbPool } from '@/lib/db';
import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'dogfood_session';
const SESSION_EXPIRATION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string) {
  const rawToken = generateSessionToken();
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
  
  const pool = getDbPool();
  await pool.query(
    'INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, hashedToken, expiresAt]
  );
  
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function deleteSession(token: string) {
  const hashedToken = hashToken(token);
  const pool = getDbPool();
  await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashedToken]);
  await clearSessionCookie();
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  
  const hashedToken = hashToken(token);
  const pool = getDbPool();
  
  const res = await pool.query(`
    SELECT u.id, u.name, u.email, u.role, s.expires_at 
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = $1
  `, [hashedToken]);
  
  if (res.rowCount === 0) return null;
  
  const session = res.rows[0];
  if (new Date(session.expires_at) < new Date()) {
    // Session expired
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashedToken]);
    return null;
  }
  
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role
  };
}

export function authErrorResponse(code: string = 'UNAUTHORIZED', message: string = 'Authentication required.') {
  return NextResponse.json(
    { error: { code, message } },
    { status: code === 'UNAUTHORIZED' ? 401 : 403 }
  );
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, error: authErrorResponse('UNAUTHORIZED', 'Authentication required.') };
  }
  return { user, error: null };
}

export async function requirePlatformAdmin() {
  const { user, error } = await requireUser();
  if (error) return { user: null, error };
  if (user.role !== 'ADMIN') {
    return { user: null, error: authErrorResponse('FORBIDDEN', 'Access denied.') };
  }
  return { user, error: null };
}

export async function requireEventCreator() {
  const { user, error } = await requireUser();
  if (error) return { user: null, error };
  if (user.role === 'ADMIN') return { user, error: null };

  const pool = getDbPool();
  const res = await pool.query("SELECT 1 FROM event_members WHERE user_id = $1 AND role = 'ORGANIZER' LIMIT 1", [user.id]);
  if (res.rowCount && res.rowCount > 0) {
    return { user, error: null };
  }

  return { user: null, error: authErrorResponse('FORBIDDEN', 'Access denied.') };
}

export async function requireEventRole(eventId: string, requiredRole: 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT') {
  const { user, error } = await requireUser();
  if (error) return { user: null, eventRole: null, error };
  
  const pool = getDbPool();
  const res = await pool.query(
    'SELECT role FROM event_members WHERE event_id = $1 AND user_id = $2',
    [eventId, user.id]
  );
  
  if (res.rowCount === 0) {
    return { user: null, eventRole: null, error: authErrorResponse('FORBIDDEN', 'Access denied.') };
  }
  
  const userEventRole = res.rows[0].role;
  if (userEventRole !== requiredRole) {
    return { user: null, eventRole: null, error: authErrorResponse('FORBIDDEN', 'Access denied.') };
  }
  
  return { user, eventRole: userEventRole, error: null };
}

export async function requireEventAdmin(eventId: string) {
  const { user, error } = await requireUser();
  if (error) return { user: null, error };
  if (user.role === 'ADMIN') return { user, error: null };
  
  const pool = getDbPool();
  const res = await pool.query('SELECT role FROM event_members WHERE event_id = $1 AND user_id = $2', [eventId, user.id]);
  if (res.rowCount && res.rows[0].role === 'ORGANIZER') {
    return { user, error: null };
  }
  return { user: null, error: authErrorResponse('FORBIDDEN', 'Access denied.') };
}

export async function requireTeamLeader(teamId: string) {
  const { user, error } = await requireUser();
  if (error) return { user: null, teamEventId: null, error };

  const pool = getDbPool();
  const res = await pool.query(`
    SELECT tm.role, t.event_id 
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.team_id = $1 AND tm.user_id = $2
  `, [teamId, user.id]);

  if (res.rowCount === 0 || res.rows[0].role !== 'LEADER') {
    return { user: null, teamEventId: null, error: authErrorResponse('FORBIDDEN', 'Access denied. Must be team leader.') };
  }

  return { user, teamEventId: res.rows[0].event_id, error: null };
}

export async function requireTeamMember(teamId: string) {
  const { user, error } = await requireUser();
  if (error) return { user: null, teamEventId: null, error };
  
  const pool = getDbPool();
  const res = await pool.query(`
    SELECT t.event_id 
    FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.team_id = $1 AND tm.user_id = $2
  `, [teamId, user.id]);

  if (res.rowCount === 0) {
    return { user: null, teamEventId: null, error: authErrorResponse('FORBIDDEN', 'Access denied.') };
  }
  return { user, teamEventId: res.rows[0].event_id, error: null };
}

export async function cleanupExpiredSessions() {
  const pool = getDbPool();
  await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
}
