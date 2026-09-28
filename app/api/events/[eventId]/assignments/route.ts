import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { manualAssignSchema } from '@/lib/validation/judging';

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { user, error } = await requireEventAdmin(eventId);
  if (error) return error;

  try {
    const body = await req.json();
    const result = manualAssignSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: (result.error as unknown as { errors: { message: string }[] }).errors[0].message } }, { status: 400 });
    }

    const { judge_id, submission_id } = result.data;
    const pool = getDbPool();

    // Verify judge belongs to this event
    const judgeRes = await pool.query('SELECT * FROM judge_profiles WHERE id = $1 AND event_id = $2', [judge_id, eventId]);
    if (judgeRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Judge not found in this event' } }, { status: 404 });
    }
    const judge = judgeRes.rows[0];

    // Verify submission belongs to this event
    const subRes = await pool.query('SELECT * FROM submissions WHERE id = $1 AND event_id = $2', [submission_id, eventId]);
    if (subRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Submission not found in this event' } }, { status: 404 });
    }
    const submission = subRes.rows[0];

    // Verify submission is SUBMITTED
    if (submission.status !== 'SUBMITTED') {
      return NextResponse.json({ error: { code: 'INVALID_ASSIGNMENT', message: 'Can only assign submitted projects' } }, { status: 400 });
    }

    // Conflict of interest check: Judge cannot be assigned their own team's submission
    const coiRes = await pool.query(`
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = $1 AND tm.team_id = $2
    `, [judge.user_id, submission.team_id]);

    if (coiRes.rowCount && coiRes.rowCount > 0) {
      return NextResponse.json({ error: { code: 'CONFLICT_OF_INTEREST', message: 'Judge cannot evaluate their own team' } }, { status: 403 });
    }

    // Check if already assigned
    const existing = await pool.query('SELECT id FROM judge_assignments WHERE judge_id = $1 AND submission_id = $2', [judge_id, submission_id]);
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'Already assigned' } }, { status: 409 });
    }

    const insertRes = await pool.query(
      'INSERT INTO judge_assignments (judge_id, submission_id, status) VALUES ($1, $2, $3) RETURNING *',
      [judge_id, submission_id, 'PENDING']
    );

    await pool.query(
      'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
      [eventId, user.id, 'CREATE_ASSIGNMENT', 'JUDGE_ASSIGNMENT', insertRes.rows[0].id, JSON.stringify({ judge_id, submission_id })]
    );

    return NextResponse.json({ assignment: insertRes.rows[0] }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  const pool = getDbPool();
  const res = await pool.query(`
    SELECT ja.*, s.title as submission_title, u.name as judge_name
    FROM judge_assignments ja
    JOIN judge_profiles jp ON ja.judge_id = jp.id
    JOIN users u ON jp.user_id = u.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1
    ORDER BY ja.created_at DESC
  `, [eventId]);

  return NextResponse.json({ assignments: res.rows });
}
