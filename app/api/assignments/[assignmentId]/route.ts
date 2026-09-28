import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin, requireUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const pool = getDbPool();
  
  const res = await pool.query(`
    SELECT ja.*, jp.user_id as judge_user_id, s.event_id 
    FROM judge_assignments ja
    JOIN judge_profiles jp ON ja.judge_id = jp.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE ja.id = $1
  `, [assignmentId]);

  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Assignment not found' } }, { status: 404 });
  }

  const assignment = res.rows[0];

  // Organizer can see it, OR the assigned judge
  const isAdmin = await requireEventAdmin(assignment.event_id);
  if (isAdmin.error && assignment.judge_user_id !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not authorized to view this assignment' } }, { status: 403 });
  }

  return NextResponse.json({ assignment });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const pool = getDbPool();

  const res = await pool.query(`
    SELECT ja.*, s.event_id 
    FROM judge_assignments ja
    JOIN submissions s ON ja.submission_id = s.id
    WHERE ja.id = $1
  `, [assignmentId]);

  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Assignment not found' } }, { status: 404 });
  }

  const assignment = res.rows[0];
  const { user, error } = await requireEventAdmin(assignment.event_id);
  if (error) return error;

  if (assignment.status === 'COMPLETED') {
    return NextResponse.json({ error: { code: 'CONFLICT', message: 'Cannot delete completed assignment' } }, { status: 409 });
  }

  await pool.query('DELETE FROM judge_assignments WHERE id = $1', [assignmentId]);
  
  await pool.query(
    'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
    [assignment.event_id, user.id, 'DELETE_ASSIGNMENT', 'JUDGE_ASSIGNMENT', assignmentId, '{}']
  );

  return NextResponse.json({ success: true });
}
