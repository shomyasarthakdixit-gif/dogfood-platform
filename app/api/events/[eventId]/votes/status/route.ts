import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const { eventId } = await params;
    const pool = getDbPool();

    const evRes = await pool.query('SELECT status, voting_start, voting_end FROM events WHERE id = $1', [eventId]);
    if (evRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found.' } }, { status: 404 });
    }
    const ev = evRes.rows[0];
    const now = new Date();

    const hasStarted = ev.voting_start && new Date(ev.voting_start) <= now;
    const hasEnded = ev.voting_end && new Date(ev.voting_end) < now;
    const isOpen = hasStarted && !hasEnded;

    return NextResponse.json({ 
      voting_start: ev.voting_start,
      voting_end: ev.voting_end,
      is_open: isOpen
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve voting status.' } }, { status: 500 });
  }
}
