import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { submissionSchema } from '@/lib/validation/submissions';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const pool = getDbPool();
  const res = await pool.query(`
    SELECT id, team_id, title, description, url, status, submitted_at, created_at, updated_at
    FROM submissions
    WHERE event_id = $1 AND status = 'SUBMITTED'
    ORDER BY created_at DESC
  `, [eventId]);
  return NextResponse.json({ submissions: res.rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const body = await req.json();
    const result = submissionSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });

    const pool = getDbPool();

    const teamRes = await pool.query(`
      SELECT t.id FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE t.event_id = $1 AND tm.user_id = $2
    `, [eventId, user!.id]);

    if (teamRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'TEAM_NOT_FOUND', message: 'You are not in a team for this event' } }, { status: 403 });
    }

    const teamId = teamRes.rows[0].id;

    const insertRes = await pool.query(`
      INSERT INTO submissions (team_id, event_id, title, description, url, status)
      VALUES ($1, $2, $3, $4, $5, 'DRAFT') RETURNING *
    `, [teamId, eventId, result.data.title, result.data.description, result.data.url]);

    return NextResponse.json({ submission: insertRes.rows[0] });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as any).code === '23505') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Team already has a submission' } }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
