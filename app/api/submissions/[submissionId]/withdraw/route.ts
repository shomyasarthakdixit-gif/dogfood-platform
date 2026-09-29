import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireTeamMember } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
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

  const { user, error } = await requireTeamMember(sub.team_id);
  if (error) return error;

  if (sub.status !== 'SUBMITTED') {
    return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Only submitted projects can be withdrawn' } }, { status: 409 });
  }

  const now = new Date();
  if (sub.event_status === 'DRAFT' || sub.event_status === 'ARCHIVED') {
    return NextResponse.json({ error: { code: 'EVENT_NOT_ACTIVE', message: 'Event is not active' } }, { status: 403 });
  }
  if (sub.submission_end && new Date(sub.submission_end) < now) {
    return NextResponse.json({ error: { code: 'SUBMISSION_DEADLINE_PASSED', message: 'Submissions can no longer be withdrawn after the deadline.' } }, { status: 403 });
  }

  const res = await pool.query(`
    UPDATE submissions 
    SET status = 'DRAFT', updated_at = NOW() 
    WHERE id = $1 AND status = 'SUBMITTED' 
    RETURNING *
  `, [submissionId]);

  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Submission could not be withdrawn' } }, { status: 409 });
  }

  await pool.query(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
    VALUES ($1, $2, $3, $4)
  `, [user!.id, 'SUBMISSION_WITHDRAWN', 'submission', submissionId]);

  return NextResponse.json({ submission: res.rows[0] });
}
