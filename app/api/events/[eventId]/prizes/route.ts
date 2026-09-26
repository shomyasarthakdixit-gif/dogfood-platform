import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { prizeSchema } from '@/lib/validation/events';

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const pool = getDbPool();
  const res = await pool.query('SELECT * FROM prizes WHERE event_id = $1 ORDER BY created_at ASC', [eventId]);
  return NextResponse.json({ prizes: res.rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  try {
    const body = await req.json();
    const result = prizeSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });

    const pool = getDbPool();
    const insertRes = await pool.query(`
      INSERT INTO prizes (event_id, track_id, name, description, amount) VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [eventId, result.data.track_id || null, result.data.name, result.data.description, result.data.amount]);

    return NextResponse.json({ prize: insertRes.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
