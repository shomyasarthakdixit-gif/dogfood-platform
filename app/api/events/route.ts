import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventCreator } from '@/lib/auth';
import { eventSchema } from '@/lib/validation/events';

export async function GET(_req: Request) {
  const pool = getDbPool();
  const res = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
  return NextResponse.json({ events: res.rows });
}

export async function POST(req: Request) {
  const { user, error } = await requireEventCreator();
  if (error) return error;

  try {
    const body = await req.json();
    const result = eventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });
    }

    const data = result.data;
    const pool = getDbPool();
    
    const existing = await pool.query('SELECT id FROM events WHERE slug = $1', [data.slug]);
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Slug already exists' } }, { status: 400 });
    }

    const insertRes = await pool.query(`
      INSERT INTO events (slug, name, description, status, start_date, end_date, registration_start, registration_end, submission_start, submission_end, judging_start, judging_end, voting_start, voting_end, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *
    `, [data.slug, data.name, data.description, data.status, data.start_date, data.end_date, data.registration_start, data.registration_end, data.submission_start, data.submission_end, data.judging_start, data.judging_end, data.voting_start, data.voting_end, user!.id]);

    const event = insertRes.rows[0];
    await pool.query("INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, 'ORGANIZER')", [event.id, user!.id]);

    return NextResponse.json({ event });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
