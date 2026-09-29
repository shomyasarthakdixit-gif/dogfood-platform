import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireTeamMember } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const submissionId = (await params).submissionId;
  const pool = getDbPool();
  
  const subRes = await pool.query(`
    SELECT s.*, e.status as event_status, e.submission_start, e.submission_end 
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
  if (sub.event_status === 'DRAFT' || sub.event_status === 'ARCHIVED') {
    return NextResponse.json({ error: { code: 'EVENT_NOT_ACTIVE', message: 'Event is not active' } }, { status: 400 });
  }
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

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const eventRes = await client.query('SELECT required_judges FROM events WHERE id = $1', [sub.event_id]);
      const requiredJudges = eventRes.rows[0].required_judges;

      const judgesRes = await client.query(`
        SELECT jp.id, COUNT(ja.id) as load
        FROM judge_profiles jp
        LEFT JOIN judge_assignments ja ON jp.id = ja.judge_id
        WHERE jp.event_id = $1
        GROUP BY jp.id
        ORDER BY load ASC, jp.id ASC
      `, [sub.event_id]);
      
      const judges = judgesRes.rows;

      const coiRes = await client.query(`
        SELECT jp.id 
        FROM judge_profiles jp
        JOIN team_members tm ON jp.user_id = tm.user_id
        WHERE jp.event_id = $1 AND tm.team_id = $2
      `, [sub.event_id, sub.team_id]);
      const coiJudges = new Set(coiRes.rows.map(r => r.id));

      const eligibleJudges = judges.filter(j => !coiJudges.has(j.id));
      const judgesToAssign = eligibleJudges.slice(0, requiredJudges);
      
      for (const j of judgesToAssign) {
        const insRes = await client.query(
          'INSERT INTO judge_assignments (judge_id, submission_id, status) VALUES ($1, $2, $3) RETURNING id',
          [j.id, submissionId, 'PENDING']
        );
        await client.query(
          'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
          [sub.event_id, user!.id, 'CREATE_ASSIGNMENT_AUTO', 'JUDGE_ASSIGNMENT', insRes.rows[0].id, JSON.stringify({ judge_id: j.id, submission_id: submissionId })]
        );
      }
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Failed to auto-assign judges:', e);
    } finally {
      client.release();
    }
  } catch (e) {
    console.error('Failed to connect for auto-assign:', e);
  }

  await pool.query(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
    VALUES ($1, $2, $3, $4)
  `, [user!.id, 'SUBMIT_PROJECT', 'submission', submissionId]);

  return NextResponse.json({ submission: res.rows[0] });
}
