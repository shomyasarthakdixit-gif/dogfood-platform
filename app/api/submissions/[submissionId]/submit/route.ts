import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireTeamMember } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const submissionId = (await params).submissionId;
  const pool = getDbPool();
  
  const subRes = await pool.query(`
    SELECT s.*, e.submission_start, e.submission_end 
    FROM submissions s
    JOIN events e ON s.event_id = e.id
    WHERE s.id = $1
  `, [submissionId]);
  
  if (subRes.rowCount === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found' } }, { status: 404 });
  const sub = subRes.rows[0];

  const { user, error } = await requireTeamMember(sub.team_id);
  if (error) return error;

  if (sub.status === 'SUBMITTED') {
    return NextResponse.json({ error: { code: 'SUBMISSION_ALREADY_SUBMITTED', message: 'Submission is already finalized' } }, { status: 400 });
  }

  const now = new Date();
  if (sub.submission_start && new Date(sub.submission_start) > now) {
    return NextResponse.json({ error: { code: 'EVENT_NOT_ACTIVE', message: 'Submission window has not started' } }, { status: 400 });
  }
  if (sub.submission_end && new Date(sub.submission_end) < now) {
    return NextResponse.json({ error: { code: 'SUBMISSION_DEADLINE_PASSED', message: 'Submissions are no longer being accepted.' } }, { status: 400 });
  }

  const res = await pool.query(`
    UPDATE submissions 
    SET status = 'SUBMITTED', submitted_at = NOW(), updated_at = NOW() 
    WHERE id = $1 AND status = 'DRAFT' 
    RETURNING *
  `, [submissionId]);

  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'SUBMISSION_ALREADY_SUBMITTED', message: 'Submission already finalized or modified' } }, { status: 400 });
  }

  await pool.query(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
    VALUES ($1, $2, $3, $4)
  `, [user!.id, 'SUBMIT_PROJECT', 'submission', submissionId]);

  return NextResponse.json({ submission: res.rows[0] });
}
