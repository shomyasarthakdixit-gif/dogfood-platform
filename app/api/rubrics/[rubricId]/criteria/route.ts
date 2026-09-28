import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { createCriterionSchema } from '@/lib/validation/judging';

export async function POST(req: Request, { params }: { params: Promise<{ rubricId: string }> }) {
  const { rubricId } = await params;
  const pool = getDbPool();

  const rubricRes = await pool.query('SELECT * FROM rubrics WHERE id = $1', [rubricId]);
  if (rubricRes.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Rubric not found' } }, { status: 404 });
  }

  const rubric = rubricRes.rows[0];
  const { user, error } = await requireEventAdmin(rubric.event_id);
  if (error) return error;

  const activeEvals = await pool.query(`
    SELECT count(*) FROM evaluations e
    JOIN judge_assignments ja ON e.assignment_id = ja.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1 AND e.status = 'SUBMITTED'
  `, [rubric.event_id]);
  
  if (parseInt(activeEvals.rows[0].count) > 0) {
    return NextResponse.json({ error: { code: 'RUBRIC_LOCKED', message: 'Cannot modify rubric criteria after evaluations have been submitted' } }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = createCriterionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: (result.error as unknown as { errors: { message: string }[] }).errors[0].message } }, { status: 400 });
    }

    const { name, description, max_score, weight } = result.data;
    const insertRes = await pool.query(
      'INSERT INTO rubric_criteria (rubric_id, name, description, max_score, weight) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [rubricId, name, description || null, max_score, weight]
    );

    await pool.query(
      'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
      [rubric.event_id, user.id, 'CREATE_CRITERION', 'RUBRIC_CRITERION', insertRes.rows[0].id, JSON.stringify({ name, max_score, weight })]
    );

    return NextResponse.json({ criterion: insertRes.rows[0] }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  }
}
