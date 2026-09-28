import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { updateJudgeSchema } from '@/lib/validation/judging';

export async function GET(req: Request, { params }: { params: Promise<{ judgeId: string }> }) {
  const { judgeId } = await params;
  const pool = getDbPool();

  const res = await pool.query('SELECT * FROM judge_profiles WHERE id = $1', [judgeId]);
  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Judge not found' } }, { status: 404 });
  }

  const judge = res.rows[0];
  const { error } = await requireEventAdmin(judge.event_id);
  if (error) return error;

  return NextResponse.json({ judge });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ judgeId: string }> }) {
  const { judgeId } = await params;
  const pool = getDbPool();

  const res = await pool.query('SELECT * FROM judge_profiles WHERE id = $1', [judgeId]);
  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Judge not found' } }, { status: 404 });
  }

  const judge = res.rows[0];
  const { user, error } = await requireEventAdmin(judge.event_id);
  if (error) return error;

  try {
    const body = await req.json();
    const result = updateJudgeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: (result.error as unknown as { errors: { message: string }[] }).errors[0].message } }, { status: 400 });
    }

    if (result.data.background !== undefined) {
      const updateRes = await pool.query(
        'UPDATE judge_profiles SET background = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [result.data.background, judgeId]
      );
      
      await pool.query(
        'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
        [judge.event_id, user.id, 'UPDATE_JUDGE', 'JUDGE_PROFILE', judgeId, JSON.stringify({ background: result.data.background })]
      );

      return NextResponse.json({ judge: updateRes.rows[0] });
    }

    return NextResponse.json({ judge });
  } catch (err) {
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ judgeId: string }> }) {
  const { judgeId } = await params;
  const pool = getDbPool();

  const res = await pool.query('SELECT * FROM judge_profiles WHERE id = $1', [judgeId]);
  if (res.rowCount === 0) {
    return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Judge not found' } }, { status: 404 });
  }

  const judge = res.rows[0];
  const { user, error } = await requireEventAdmin(judge.event_id);
  if (error) return error;

  // Check if they have evaluations
  const evals = await pool.query(`
    SELECT count(*) FROM evaluations e 
    JOIN judge_assignments ja ON e.assignment_id = ja.id 
    WHERE ja.judge_id = $1 AND e.status = 'SUBMITTED'
  `, [judgeId]);
  
  if (parseInt(evals.rows[0].count) > 0) {
    return NextResponse.json({ error: { code: 'CONFLICT', message: 'Cannot remove judge with submitted evaluations' } }, { status: 409 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if user is only a judge, if so, downgrade or let them be? 
    // They might be a participant or organizer. Safe approach is not to downgrade event_members, just delete profile.
    
    await client.query('DELETE FROM judge_profiles WHERE id = $1', [judgeId]);
    
    await client.query(
      'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
      [judge.event_id, user.id, 'DELETE_JUDGE', 'JUDGE_PROFILE', judgeId, JSON.stringify({})]
    );

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  } finally {
    client.release();
  }
}
