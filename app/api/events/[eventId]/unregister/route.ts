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
  
  const memberRes = await pool.query(`SELECT role FROM event_members WHERE event_id = $1 AND user_id = $2`, [eventId, user!.id]);
  if (memberRes.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Not registered' } }, { status: 404 });
  }
  
  if (memberRes.rows[0].role !== 'PARTICIPANT') {
    return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Cannot unregister organizers or judges' } }, { status: 403 });
  }

  const teamRes = await pool.query(`
    SELECT t.id FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE t.event_id = $1 AND tm.user_id = $2
  `, [eventId, user!.id]);
  
  if (teamRes.rowCount !== null && teamRes.rowCount > 0) {
    return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Cannot unregister after forming or joining a team' } }, { status: 403 });
  }

  await pool.query('BEGIN');
  try {
    await pool.query(`DELETE FROM event_members WHERE event_id = $1 AND user_id = $2`, [eventId, user!.id]);
    
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES ($1, $2, $3, $4)
    `, [user!.id, 'EVENT_UNREGISTRATION', 'event', eventId]);

    await pool.query('COMMIT');
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
