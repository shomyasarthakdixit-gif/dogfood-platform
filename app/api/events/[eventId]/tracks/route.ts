import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { trackSchema } from '@/lib/validation/events';

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const pool = getDbPool();
  const res = await pool.query('SELECT * FROM tracks WHERE event_id = $1 ORDER BY created_at ASC', [eventId]);
  return NextResponse.json({ tracks: res.rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  try {
    const body = await req.json();
    const result = trackSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });

    const pool = getDbPool();
    const insertRes = await pool.query(`
      INSERT INTO tracks (event_id, name, description) VALUES ($1, $2, $3) RETURNING *
    `, [eventId, result.data.name, result.data.description]);

    return NextResponse.json({ track: insertRes.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
