import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = (await params).eventId;
  const pool = getDbPool();

  const eventRes = await pool.query("SELECT status FROM events WHERE id = $1", [eventId]);
  if (eventRes.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 });
  }

  // Only allow gallery if event is NOT DRAFT.
  if (eventRes.rows[0].status === 'DRAFT') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Event is not publicly available' } }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const trackId = searchParams.get('trackId') || '';
  
  let page = parseInt(searchParams.get('page') || '1', 10);
  if (isNaN(page) || page < 1) page = 1;
  let limit = parseInt(searchParams.get('limit') || '20', 10);
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 20;

  const offset = (page - 1) * limit;

  // Base query for public gallery
  let queryStr = `
    SELECT s.id, s.title, s.description, s.url, s.submitted_at, 
           t.name as team_name, tr.id as track_id, tr.name as track_name
    FROM submissions s
    JOIN teams t ON s.team_id = t.id
    LEFT JOIN tracks tr ON s.track_id = tr.id
    WHERE s.event_id = $1 AND s.status = 'SUBMITTED'
  `;
  const queryParams: (string | number)[] = [eventId];
  let paramIndex = 2;

  if (q.trim()) {
    queryStr += ` AND (s.title ILIKE $${paramIndex} OR s.description ILIKE $${paramIndex} OR t.name ILIKE $${paramIndex})`;
    queryParams.push(`%${q.trim()}%`);
    paramIndex++;
  }

  if (trackId) {
    queryStr += ` AND s.track_id = $${paramIndex}`;
    queryParams.push(trackId);
    paramIndex++;
  }

  // Count total for pagination
  const countStr = `SELECT COUNT(*) FROM (${queryStr}) as total`;
  const countRes = await pool.query(countStr, queryParams);
  const total = parseInt(countRes.rows[0].count, 10);

  // Ordering and Limits
  queryStr += ` ORDER BY s.submitted_at DESC, s.id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  queryParams.push(limit, offset);

  const res = await pool.query(queryStr, queryParams);

  // Map to Public DTO
  const items = res.rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    url: row.url,
    team: {
      name: row.team_name,
    },
    track: row.track_id ? {
      id: row.track_id,
      name: row.track_name
    } : null,
    submittedAt: row.submitted_at
  }));

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
}
