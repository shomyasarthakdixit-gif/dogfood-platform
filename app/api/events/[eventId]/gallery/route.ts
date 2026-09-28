import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getTop10Projects } from '@/lib/api/events';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const pool = getDbPool();

  const eventRes = await pool.query("SELECT status FROM events WHERE id = $1", [eventId]);
  if (eventRes.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 });
  }

  if (eventRes.rows[0].status !== 'RESULTS' && eventRes.rows[0].status !== 'ARCHIVED') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Projects are not yet publicly available' } }, { status: 403 });
  }

  const items = await getTop10Projects(eventId);
  return NextResponse.json({ items });
}
