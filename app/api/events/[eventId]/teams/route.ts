import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventRole } from '@/lib/auth';
import { teamSchema } from '@/lib/validation/teams';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const pool = getDbPool();
  const res = await pool.query('SELECT * FROM teams WHERE event_id = $1 ORDER BY created_at DESC', [eventId]);
  return NextResponse.json({ teams: res.rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const { user, error } = await requireEventRole(eventId, 'PARTICIPANT');
  if (error) return error;

  try {
    const body = await req.json();
    const result = teamSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });

    const pool = getDbPool();
    const existingMembership = await pool.query(`
      SELECT tm.id FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE t.event_id = $1 AND tm.user_id = $2
    `, [eventId, user!.id]);

    if (existingMembership.rowCount && existingMembership.rowCount > 0) {
      return NextResponse.json({ error: { code: 'ALREADY_MEMBER', message: 'User is already in a team for this event' } }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const insertTeamRes = await client.query(`
        INSERT INTO teams (event_id, name, description) VALUES ($1, $2, $3) RETURNING *
      `, [eventId, result.data.name, result.data.description]);
      
      const team = insertTeamRes.rows[0];

      await client.query(`
        INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'LEADER')
      `, [team.id, user!.id]);

      await client.query('COMMIT');
      return NextResponse.json({ team });
    } catch (e: unknown) {
      await client.query('ROLLBACK');
      if (e && typeof e === 'object' && 'code' in e && (e as {code: string}).code === '23505') {
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Team name already exists in this event' } }, { status: 400 });
      }
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
