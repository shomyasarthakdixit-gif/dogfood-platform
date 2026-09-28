import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { eventUpdateSchema } from '@/lib/validation/events';

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const pool = getDbPool();
  const res = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
  if (res.rowCount === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 });
  return NextResponse.json({ event: res.rows[0] });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  try {
    const body = await req.json();
    const result = eventUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });
    }

    const pool = getDbPool();
    const eventRes = await pool.query('SELECT status FROM events WHERE id = $1', [eventId]);
    if (eventRes.rowCount === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 });
    const currentStatus = eventRes.rows[0].status;
    
    if (currentStatus === 'ARCHIVED') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Cannot modify an archived event' } }, { status: 400 });
    }

    if (result.data.status && result.data.status !== currentStatus) {
      const LIFECYCLE_ORDER = ['DRAFT', 'REGISTRATION', 'SUBMISSION', 'JUDGING', 'VOTING', 'RESULTS', 'ARCHIVED'];
      const currentIndex = LIFECYCLE_ORDER.indexOf(currentStatus);
      const nextIndex = LIFECYCLE_ORDER.indexOf(result.data.status);
      
      if (nextIndex !== currentIndex + 1) {
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid lifecycle transition. Only sequential forward transitions are allowed.' } }, { status: 400 });
      }
    }

    const updates = Object.entries(result.data).map(([k, _v], i) => `${k} = $${i+2}`);
    if (updates.length === 0) return NextResponse.json({ status: 'ok' });

    const values = Object.values(result.data);
    const query = `UPDATE events SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const res = await pool.query(query, [eventId, ...values]);
    
    return NextResponse.json({ event: res.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  const pool = getDbPool();
  
  const eventRes = await pool.query('SELECT status FROM events WHERE id = $1', [eventId]);
  if (eventRes.rowCount === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 });
  
  const currentStatus = eventRes.rows[0].status;
  if (currentStatus !== 'DRAFT') {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Only DRAFT events can be deleted. Use ARCHIVED status for progressed events.' } }, { status: 400 });
  }

  await pool.query('DELETE FROM events WHERE id = $1', [eventId]);
  return NextResponse.json({ status: 'ok' });
}
