import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireTeamMember } from '@/lib/auth';
import { submissionUpdateSchema } from '@/lib/validation/submissions';

export async function GET(_req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const submissionId = (await params).submissionId;
  const pool = getDbPool();
  const res = await pool.query(`
    SELECT s.*, e.status as event_status 
    FROM submissions s
    JOIN events e ON s.event_id = e.id
    WHERE s.id = $1
  `, [submissionId]);
  if (res.rowCount === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found' } }, { status: 404 });
  const sub = res.rows[0];

  if (sub.status === 'SUBMITTED' && sub.event_status !== 'DRAFT') {
    return NextResponse.json({ submission: sub });
  }

  const { error } = await requireTeamMember(sub.team_id);
  if (error) return error;

  return NextResponse.json({ submission: sub });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const submissionId = (await params).submissionId;
  const pool = getDbPool();
  
  const subRes = await pool.query(`
    SELECT s.*, e.status as event_status, e.submission_start, e.submission_end 
    FROM submissions s
    JOIN events e ON s.event_id = e.id
    WHERE s.id = $1
  `, [submissionId]);
  if (subRes.rowCount === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found' } }, { status: 404 });
  const sub = subRes.rows[0];

  if (sub.status !== 'DRAFT') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Cannot edit a finalized submission' } }, { status: 403 });
  }

  const now = new Date();
  if (sub.event_status === 'DRAFT' || sub.event_status === 'ARCHIVED') {
    return NextResponse.json({ error: { code: 'EVENT_NOT_ACTIVE', message: 'Event is not active' } }, { status: 400 });
  }
  if (sub.submission_start && new Date(sub.submission_start) > now) {
    return NextResponse.json({ error: { code: 'EVENT_NOT_ACTIVE', message: 'Submission window has not started' } }, { status: 400 });
  }
  if (sub.submission_end && new Date(sub.submission_end) < now) {
    return NextResponse.json({ error: { code: 'SUBMISSION_DEADLINE_PASSED', message: 'Submissions are no longer being accepted.' } }, { status: 400 });
  }

  const { error } = await requireTeamMember(sub.team_id);
  if (error) return error;

  try {
    const body = await req.json();
    const result = submissionUpdateSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });

    if (result.data.track_id) {
      const trackRes = await pool.query('SELECT id FROM tracks WHERE id = $1 AND event_id = $2', [result.data.track_id, sub.event_id]);
      if (trackRes.rowCount === 0) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid track' } }, { status: 400 });
    }

    const updates = Object.entries(result.data).map(([k, _v], i) => `${k} = $${i+2}`);
    if (updates.length === 0) return NextResponse.json({ status: 'ok' });

    const query = `UPDATE submissions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const res = await pool.query(query, [submissionId, ...Object.values(result.data)]);
    
    return NextResponse.json({ submission: res.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
