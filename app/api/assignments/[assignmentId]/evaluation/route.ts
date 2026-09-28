import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { submitEvaluationSchema } from '@/lib/validation/judging';

export async function POST(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  return handleSaveOrSubmit(req, params);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  return handleSaveOrSubmit(req, params);
}

async function handleSaveOrSubmit(req: Request, params: Promise<{ assignmentId: string }>) {
  const { assignmentId } = await params;
  const { user, error } = await requireUser();
  if (error) return error;

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const body = await req.json();
    const result = submitEvaluationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: (result.error as unknown as { errors: { message: string }[] }).errors[0].message } }, { status: 400 });
    }

    const { scores, submit } = result.data;

    await client.query('BEGIN');

    // Load assignment and evaluation
    const assignRes = await client.query(`
      SELECT ja.*, jp.user_id as judge_user_id, s.event_id, s.team_id
      FROM judge_assignments ja
      JOIN judge_profiles jp ON ja.judge_id = jp.id
      JOIN submissions s ON ja.submission_id = s.id
      WHERE ja.id = $1
    `, [assignmentId]);

    if (assignRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Assignment not found' } }, { status: 404 });
    }

    const assignment = assignRes.rows[0];

    if (assignment.judge_user_id !== user.id) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not authorized for this assignment' } }, { status: 403 });
    }

    // Check COI
    const coiRes = await client.query('SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2', [assignment.team_id, user.id]);
    if (coiRes.rowCount && coiRes.rowCount > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: { code: 'CONFLICT_OF_INTEREST', message: 'Cannot evaluate own team' } }, { status: 403 });
    }

    const evalRes = await client.query('SELECT * FROM evaluations WHERE assignment_id = $1 FOR UPDATE', [assignmentId]);
    if (evalRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Evaluation not started. Call /start first.' } }, { status: 400 });
    }

    const evaluation = evalRes.rows[0];
    if (evaluation.status === 'SUBMITTED') {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: { code: 'EVALUATION_ALREADY_SUBMITTED', message: 'Evaluation is already submitted and immutable.' } }, { status: 409 });
    }

    // Load criteria for this event
    const critRes = await client.query(`
      SELECT c.* 
      FROM rubric_criteria c
      JOIN rubrics r ON c.rubric_id = r.id
      WHERE r.event_id = $1
    `, [assignment.event_id]);
    const criteria = critRes.rows;
    const criteriaMap = new Map(criteria.map(c => [c.id, c]));

    // Validate scores against criteria
    let totalScore = 0;
    let totalWeight = 0;
    const processedCriteria = new Set();

    for (const s of scores) {
      const criterion = criteriaMap.get(s.criterion_id);
      if (!criterion) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: { code: 'INVALID_SCORE', message: `Criterion ${s.criterion_id} is invalid for this event.` } }, { status: 400 });
      }

      if (s.score > criterion.max_score) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: { code: 'INVALID_SCORE', message: `Score ${s.score} exceeds max_score ${criterion.max_score} for criterion ${s.criterion_id}.` } }, { status: 400 });
      }
      
      if (processedCriteria.has(s.criterion_id)) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: { code: 'INVALID_SCORE', message: `Duplicate score for criterion ${s.criterion_id}.` } }, { status: 400 });
      }
      
      processedCriteria.add(s.criterion_id);

      const normalizedCriterion = s.score / criterion.max_score;
      const weight = parseFloat(criterion.weight.toString());
      totalScore += normalizedCriterion * weight;
      totalWeight += weight;
    }

    if (submit) {
      if (processedCriteria.size !== criteria.length) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'All criteria must be scored before submitting.' } }, { status: 400 });
      }
    }

    // Upsert scores
    for (const s of scores) {
      await client.query(`
        INSERT INTO evaluation_scores (evaluation_id, criterion_id, score) 
        VALUES ($1, $2, $3)
        ON CONFLICT (evaluation_id, criterion_id) DO UPDATE SET score = $3, updated_at = CURRENT_TIMESTAMP
      `, [evaluation.id, s.criterion_id, s.score]);
    }

    let finalScore = null;
    if (submit) {
      finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
      
      await client.query('UPDATE evaluations SET status = $1, total_score = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3', ['SUBMITTED', finalScore, evaluation.id]);
      await client.query('UPDATE judge_assignments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['COMPLETED', assignmentId]);

      await client.query(
        'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
        [assignment.event_id, user.id, 'SUBMIT_EVALUATION', 'EVALUATION', evaluation.id, JSON.stringify({ finalScore })]
      );
    } else {
      await client.query(
        'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
        [assignment.event_id, user.id, 'SAVE_EVALUATION_DRAFT', 'EVALUATION', evaluation.id, '{}']
      );
    }

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      status: submit ? 'SUBMITTED' : 'DRAFT',
      total_score: finalScore 
    });

  } catch (err) {
    console.error(err);
    await client.query('ROLLBACK');
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  } finally {
    client.release();
  }
}
