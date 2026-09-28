import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { trackUpdateSchema } from '@/lib/validation/events';

async function getTrackEventId(trackId: string) {
  const pool = getDbPool();
  const res = await pool.query('SELECT event_id FROM tracks WHERE id = $1', [trackId]);
  if (res.rowCount === 0) return null;
  return res.rows[0].event_id;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const trackId = (await params).trackId;
  const eventId = await getTrackEventId(trackId);
  if (!eventId) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Track not found' } }, { status: 404 });
  
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  try {
    const body = await req.json();
    const result = trackUpdateSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });

    const pool = getDbPool();
    const updates = Object.entries(result.data).map(([k, _v], i) => `${k} = $${i+2}`);
    if (updates.length === 0) return NextResponse.json({ status: 'ok' });

    const query = `UPDATE tracks SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const res = await pool.query(query, [trackId, ...Object.values(result.data)]);
    
    return NextResponse.json({ track: res.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const trackId = (await params).trackId;
  const eventId = await getTrackEventId(trackId);
  if (!eventId) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Track not found' } }, { status: 404 });

  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  const pool = getDbPool();
  await pool.query('DELETE FROM tracks WHERE id = $1', [trackId]);
  return NextResponse.json({ status: 'ok' });
}
