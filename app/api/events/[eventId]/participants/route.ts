import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  try {
    const pool = getDbPool();
    const res = await pool.query(`
      SELECT 
        u.id, u.name, u.email, em.created_at as registration_date,
        t.name as team_name,
        s.status as submission_status
      FROM event_members em
      JOIN users u ON em.user_id = u.id
      LEFT JOIN team_members tm ON tm.user_id = u.id
      LEFT JOIN teams t ON tm.team_id = t.id AND t.event_id = em.event_id
      LEFT JOIN submissions s ON s.team_id = t.id AND s.event_id = em.event_id
      WHERE em.event_id = $1 AND em.role = 'PARTICIPANT'
      ORDER BY em.created_at DESC
    `, [eventId]);

    return NextResponse.json({ participants: res.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, { status: 500 });
  }
}
