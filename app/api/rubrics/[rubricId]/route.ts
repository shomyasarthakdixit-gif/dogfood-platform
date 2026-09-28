import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { updateRubricSchema } from '@/lib/validation/judging';

export async function GET(req: Request, { params }: { params: Promise<{ rubricId: string }> }) {
  const { rubricId } = await params;
  const pool = getDbPool();

  const res = await pool.query('SELECT * FROM rubrics WHERE id = $1', [rubricId]);
  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Rubric not found' } }, { status: 404 });
  }
  const rubric = res.rows[0];

  const criteriaRes = await pool.query('SELECT * FROM rubric_criteria WHERE rubric_id = $1 ORDER BY created_at ASC', [rubricId]);
  rubric.criteria = criteriaRes.rows;

  return NextResponse.json({ rubric });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ rubricId: string }> }) {
  const { rubricId } = await params;
  const pool = getDbPool();

  const res = await pool.query('SELECT * FROM rubrics WHERE id = $1', [rubricId]);
  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Rubric not found' } }, { status: 404 });
  }

  const rubric = res.rows[0];
  const { user, error } = await requireEventAdmin(rubric.event_id);
  if (error) return error;

  // Check if modifications should be locked
  const activeEvals = await pool.query(`
    SELECT count(*) FROM evaluations e
    JOIN judge_assignments ja ON e.assignment_id = ja.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1 AND e.status = 'SUBMITTED'
  `, [rubric.event_id]);
  
  if (parseInt(activeEvals.rows[0].count) > 0) {
    return NextResponse.json({ error: { code: 'RUBRIC_LOCKED', message: 'Cannot modify rubric after evaluations have been submitted' } }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = updateRubricSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: (result.error as unknown as { errors: { message: string }[] }).errors[0].message } }, { status: 400 });
    }

    const updateRes = await pool.query(
      'UPDATE rubrics SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [result.data.name, rubricId]
    );

    await pool.query(
      'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
      [rubric.event_id, user.id, 'UPDATE_RUBRIC', 'RUBRIC', rubricId, JSON.stringify({ name: result.data.name })]
    );

    return NextResponse.json({ rubric: updateRes.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ rubricId: string }> }) {
  const { rubricId } = await params;
  const pool = getDbPool();

  const res = await pool.query('SELECT * FROM rubrics WHERE id = $1', [rubricId]);
  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Rubric not found' } }, { status: 404 });
  }

  const rubric = res.rows[0];
  const { user, error } = await requireEventAdmin(rubric.event_id);
  if (error) return error;

  const activeEvals = await pool.query(`
    SELECT count(*) FROM evaluations e
    JOIN judge_assignments ja ON e.assignment_id = ja.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1 AND e.status = 'SUBMITTED'
  `, [rubric.event_id]);
  
  if (parseInt(activeEvals.rows[0].count) > 0) {
    return NextResponse.json({ error: { code: 'RUBRIC_LOCKED', message: 'Cannot delete rubric after evaluations have been submitted' } }, { status: 403 });
  }

  try {
    await pool.query('DELETE FROM rubrics WHERE id = $1', [rubricId]);
    await pool.query(
      'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
      [rubric.event_id, user.id, 'DELETE_RUBRIC', 'RUBRIC', rubricId, '{}']
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  }
}
