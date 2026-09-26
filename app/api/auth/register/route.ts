import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { registerSchema } from '@/lib/validation/auth';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });
    }
    
    const { name, email, password } = result.data;
    
    const pool = getDbPool();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Email already exists' } }, { status: 400 });
    }
    
    const hashed = await hashPassword(password);
    
    const insertRes = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashed, 'USER']
    );
    
    return NextResponse.json({ user: insertRes.rows[0] });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
