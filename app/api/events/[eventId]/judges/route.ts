import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { createJudgeSchema } from '@/lib/validation/judging';

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { user, error } = await requireEventAdmin(eventId);
  if (error) return error;

  try {
    const body = await req.json();
    const result = createJudgeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });
    }

    let { user_id, background } = result.data;
    const pool = getDbPool();

    // Check if user exists
    let userRes;
    if (user_id.includes('@')) {
      userRes = await pool.query('SELECT id FROM users WHERE email = $1', [user_id]);
    } else {
      userRes = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    }
    
    if (userRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }
    
    user_id = userRes.rows[0].id;

    // Check if already a judge
    const existing = await pool.query('SELECT id FROM judge_profiles WHERE event_id = $1 AND user_id = $2', [eventId, user_id]);
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'User is already a judge' } }, { status: 409 });
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure they have event_members role
      const memberRes = await client.query('SELECT role FROM event_members WHERE event_id = $1 AND user_id = $2', [eventId, user_id]);
      if (memberRes.rowCount === 0) {
        await client.query('INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, $3)', [eventId, user_id, 'JUDGE']);
      } else if (memberRes.rows[0].role === 'PARTICIPANT') {
        // Upgrade to JUDGE
        await client.query('UPDATE event_members SET role = $1 WHERE event_id = $2 AND user_id = $3', ['JUDGE', eventId, user_id]);
      }
      
      const insertRes = await client.query(
        'INSERT INTO judge_profiles (user_id, event_id, background) VALUES ($1, $2, $3) RETURNING *',
        [user_id, eventId, background || null]
      );
      
      await client.query(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
        [user.id, 'CREATE_JUDGE', 'JUDGE_PROFILE', insertRes.rows[0].id, JSON.stringify({ user_id, eventId })]
      );
      
      await client.query('COMMIT');
      return NextResponse.json({ judge: insertRes.rows[0] }, { status: 201 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  const pool = getDbPool();
  const res = await pool.query(`
    SELECT jp.id, jp.user_id, jp.event_id, jp.background, jp.created_at, u.name, u.email 
    FROM judge_profiles jp
    JOIN users u ON jp.user_id = u.id
    WHERE jp.event_id = $1
    ORDER BY u.name ASC
  `, [eventId]);

  return NextResponse.json({ judges: res.rows });
}
