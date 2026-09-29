import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const { user, error } = await requireUser();
  if (error) return error;

  const pool = getDbPool();

  const teamRes = await pool.query(`
    SELECT t.id FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    WHERE t.event_id = $1 AND tm.user_id = $2
  `, [eventId, user!.id]);

  if (teamRes.rowCount === 0) {
    return NextResponse.json({ submission: null });
  }

  const teamId = teamRes.rows[0].id;
  const subRes = await pool.query(`
    SELECT s.*, e.submission_start, e.submission_end 
    FROM submissions s
    JOIN events e ON s.event_id = e.id
    WHERE s.team_id = $1 AND s.event_id = $2
    LIMIT 1
  `, [teamId, eventId]);

  if (subRes.rowCount === 0) {
    return NextResponse.json({ submission: null });
  }

  return NextResponse.json({ submission: subRes.rows[0] });
}
