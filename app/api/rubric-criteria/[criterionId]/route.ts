import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { updateCriterionSchema } from '@/lib/validation/judging';

export async function PATCH(req: Request, { params }: { params: Promise<{ criterionId: string }> }) {
  const { criterionId } = await params;
  const pool = getDbPool();

  const res = await pool.query(`
    SELECT c.*, r.event_id 
    FROM rubric_criteria c
    JOIN rubrics r ON c.rubric_id = r.id
    WHERE c.id = $1
  `, [criterionId]);

  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Criterion not found' } }, { status: 404 });
  }

  const criterion = res.rows[0];
  const { user, error } = await requireEventAdmin(criterion.event_id);
  if (error) return error;

  const activeEvals = await pool.query(`
    SELECT count(*) FROM evaluations e
    JOIN judge_assignments ja ON e.assignment_id = ja.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1 AND e.status = 'SUBMITTED'
  `, [criterion.event_id]);
  
  if (parseInt(activeEvals.rows[0].count) > 0) {
    return NextResponse.json({ error: { code: 'RUBRIC_LOCKED', message: 'Cannot modify rubric criteria after evaluations have been submitted' } }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = updateCriterionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: (result.error as unknown as { errors: { message: string }[] }).errors[0].message } }, { status: 400 });
    }

    const { name, description, max_score, weight } = result.data;
    
    // Update dynamically
    let query = 'UPDATE rubric_criteria SET updated_at = CURRENT_TIMESTAMP';
    const values: unknown[] = [];
    let idx = 1;

    if (name !== undefined) { query += `, name = $${idx++}`; values.push(name); }
    if (description !== undefined) { query += `, description = $${idx++}`; values.push(description); }
    if (max_score !== undefined) { query += `, max_score = $${idx++}`; values.push(max_score); }
    if (weight !== undefined) { query += `, weight = $${idx++}`; values.push(weight); }

    query += ` WHERE id = $${idx} RETURNING *`;
    values.push(criterionId);

    const updateRes = await pool.query(query, values);

    await pool.query(
      'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
      [criterion.event_id, user.id, 'UPDATE_CRITERION', 'RUBRIC_CRITERION', criterionId, JSON.stringify(result.data)]
    );

    return NextResponse.json({ criterion: updateRes.rows[0] });
  } catch (err) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ criterionId: string }> }) {
  const { criterionId } = await params;
  const pool = getDbPool();

  const res = await pool.query(`
    SELECT c.*, r.event_id 
    FROM rubric_criteria c
    JOIN rubrics r ON c.rubric_id = r.id
    WHERE c.id = $1
  `, [criterionId]);

  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Criterion not found' } }, { status: 404 });
  }

  const criterion = res.rows[0];
  const { user, error } = await requireEventAdmin(criterion.event_id);
  if (error) return error;

  const activeEvals = await pool.query(`
    SELECT count(*) FROM evaluations e
    JOIN judge_assignments ja ON e.assignment_id = ja.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1 AND e.status = 'SUBMITTED'
  `, [criterion.event_id]);
  
  if (parseInt(activeEvals.rows[0].count) > 0) {
    return NextResponse.json({ error: { code: 'RUBRIC_LOCKED', message: 'Cannot delete rubric criteria after evaluations have been submitted' } }, { status: 403 });
  }

  try {
    await pool.query('DELETE FROM rubric_criteria WHERE id = $1', [criterionId]);
    await pool.query(
      'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
      [criterion.event_id, user.id, 'DELETE_CRITERION', 'RUBRIC_CRITERION', criterionId, '{}']
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  }
}
