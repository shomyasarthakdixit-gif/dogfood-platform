import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { loginSchema } from '@/lib/validation/auth';
import { verifyPassword, createSession, authErrorResponse } from '@/lib/auth';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });
    }
    
    const { email, password } = result.data;

    const { allowed } = await checkRateLimit('login', email, 500, 60000);
    if (!allowed) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } }, { status: 429 });
    }
    
    const pool = getDbPool();
    const userRes = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [email]);
    
    if (userRes.rowCount === 0) {
      return authErrorResponse('UNAUTHORIZED', 'Invalid email or password');
    }
    
    const user = userRes.rows[0];
    
    if (!user.password_hash) {
      return authErrorResponse('UNAUTHORIZED', 'Invalid email or password');
    }
    
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return authErrorResponse('UNAUTHORIZED', 'Invalid email or password');
    }
    
    await createSession(user.id);
    
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
