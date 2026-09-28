import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const pool = getDbPool();

  const assignRes = await pool.query(`
    SELECT ja.*, jp.user_id as judge_user_id, s.team_id, jp.event_id 
    FROM judge_assignments ja
    JOIN judge_profiles jp ON ja.judge_id = jp.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE ja.id = $1
  `, [assignmentId]);

  if (assignRes.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Assignment not found' } }, { status: 404 });
  }

  const assignment = assignRes.rows[0];

  if (assignment.judge_user_id !== user.id) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not authorized for this assignment' } }, { status: 403 });
  }

  // Double check COI
  const coiRes = await pool.query('SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2', [assignment.team_id, user.id]);
  if (coiRes.rowCount && coiRes.rowCount > 0) {
    return NextResponse.json({ error: { code: 'CONFLICT_OF_INTEREST', message: 'Cannot evaluate own team' } }, { status: 403 });
  }

  // Check if evaluation already exists
  const evalRes = await pool.query('SELECT * FROM evaluations WHERE assignment_id = $1', [assignmentId]);
  if (evalRes.rowCount && evalRes.rowCount > 0) {
    return NextResponse.json({ evaluation: evalRes.rows[0] });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertRes = await client.query(
      'INSERT INTO evaluations (assignment_id, status) VALUES ($1, $2) RETURNING *',
      [assignmentId, 'DRAFT']
    );
    
    await client.query(
      'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
      [assignment.event_id, user.id, 'START_EVALUATION', 'EVALUATION', insertRes.rows[0].id, '{}']
    );
    
    await client.query('COMMIT');
    return NextResponse.json({ evaluation: insertRes.rows[0] }, { status: 201 });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  } finally {
    client.release();
  }
}
