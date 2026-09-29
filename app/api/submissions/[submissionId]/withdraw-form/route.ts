import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireTeamMember } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const submissionId = (await params).submissionId;
  const formData = await req.formData();
  const eventId = formData.get('eventId')?.toString();
  
  if (!eventId) {
    return NextResponse.redirect(new URL('/dashboard', req.url), 303);
  }

  const pool = getDbPool();
  
  const subRes = await pool.query(`
    SELECT s.*, e.status as event_status, e.submission_start, e.submission_end 
    FROM submissions s
    JOIN events e ON s.event_id = e.id
    WHERE s.id = $1
  `, [submissionId]);
  
  if (subRes.rowCount === 0) {
    return NextResponse.redirect(new URL(`/events/${eventId}?error=not_found`, req.url), 303);
  }
  
  const sub = subRes.rows[0];

  const { user, error } = await requireTeamMember(sub.team_id);
  if (error) {
    return NextResponse.redirect(new URL(`/events/${eventId}?error=auth`, req.url), 303);
  }

  if (sub.status !== 'SUBMITTED') {
    return NextResponse.redirect(new URL(`/events/${eventId}?error=invalid_state`, req.url), 303);
  }

  const now = new Date();
  if (sub.event_status === 'DRAFT' || sub.event_status === 'ARCHIVED') {
    return NextResponse.redirect(new URL(`/events/${eventId}?error=event_not_active`, req.url), 303);
  }
  if (sub.submission_end && new Date(sub.submission_end) < now) {
    return NextResponse.redirect(new URL(`/events/${eventId}?error=deadline_passed`, req.url), 303);
  }

  const res = await pool.query(`
    UPDATE submissions 
    SET status = 'DRAFT', updated_at = NOW() 
    WHERE id = $1 AND status = 'SUBMITTED' 
    RETURNING *
  `, [submissionId]);

  if (res.rowCount === 0) {
    return NextResponse.redirect(new URL(`/events/${eventId}?error=invalid_state`, req.url), 303);
  }

  await pool.query(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
    VALUES ($1, $2, $3, $4)
  `, [user!.id, 'SUBMISSION_WITHDRAWN', 'submission', submissionId]);

  return NextResponse.redirect(new URL(`/events/${eventId}`, req.url), 303);
}
