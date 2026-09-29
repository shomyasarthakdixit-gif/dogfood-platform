import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const { user, error } = await requireUser();
  if (error) return error;

  const pool = getDbPool();
  
  const eventRes = await pool.query(`SELECT * FROM events WHERE id = $1`, [eventId]);
  if (eventRes.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 });
  }
  const event = eventRes.rows[0];

  if (event.status !== 'REGISTRATION') {
    return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Event is not open for registration' } }, { status: 403 });
  }

  const now = new Date();
  if (event.registration_start && new Date(event.registration_start) > now) {
    return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Registration has not opened yet' } }, { status: 403 });
  }
  if (event.registration_end && new Date(event.registration_end) < now) {
    return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Registration is closed' } }, { status: 403 });
  }

  const existingRes = await pool.query(`SELECT id FROM event_members WHERE event_id = $1 AND user_id = $2`, [eventId, user!.id]);
  if (existingRes.rowCount !== null && existingRes.rowCount > 0) {
    return NextResponse.json({ error: { code: 'CONFLICT', message: 'Already registered' } }, { status: 409 });
  }

  await pool.query('BEGIN');
  try {
    await pool.query(`
      INSERT INTO event_members (event_id, user_id, role)
      VALUES ($1, $2, 'PARTICIPANT')
    `, [eventId, user!.id]);

    await pool.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES ($1, $2, $3, $4)
    `, [user!.id, 'EVENT_REGISTRATION', 'event', eventId]);

    await pool.query('COMMIT');
    return NextResponse.json({ status: 'ok' }, { status: 201 });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
