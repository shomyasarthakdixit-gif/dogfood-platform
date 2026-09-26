import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const submissionId = (await params).submissionId;
  const pool = getDbPool();

  const queryStr = `
    SELECT s.id, s.title, s.description, s.url, s.submitted_at, s.status, s.event_id,
           t.name as team_name, tr.id as track_id, tr.name as track_name,
           e.status as event_status
    FROM submissions s
    JOIN teams t ON s.team_id = t.id
    JOIN events e ON s.event_id = e.id
    LEFT JOIN tracks tr ON s.track_id = tr.id
    WHERE s.id = $1
  `;
  
  const res = await pool.query(queryStr, [submissionId]);

  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found' } }, { status: 404 });
  }

  const row = res.rows[0];

  // Event must not be DRAFT
  if (row.event_status === 'DRAFT') {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found' } }, { status: 404 });
  }

  // Submission must be SUBMITTED
  if (row.status !== 'SUBMITTED') {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found' } }, { status: 404 });
  }

  const publicDto = {
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
  };

  return NextResponse.json({ submission: publicDto });
}
