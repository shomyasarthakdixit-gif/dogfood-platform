import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  const pool = getDbPool();
  
  const judgesRes = await pool.query('SELECT count(*) FROM judge_profiles WHERE event_id = $1', [eventId]);
  const totalJudges = parseInt(judgesRes.rows[0].count);

  const assignmentsRes = await pool.query(`
    SELECT ja.status as assignment_status 
    FROM judge_assignments ja
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1
  `, [eventId]);

  const totalAssignments = assignmentsRes.rowCount || 0;
  let completedAssignments = 0;
  let pendingAssignments = 0;

  assignmentsRes.rows.forEach(r => {
    if (r.assignment_status === 'COMPLETED') completedAssignments++;
    else pendingAssignments++;
  });

  const completionPercentage = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  // Submissions needing evaluations
  const subRes = await pool.query(`
    SELECT s.id, count(ja.id) as assignment_count, sum(case when ja.status = 'COMPLETED' then 1 else 0 end) as completed_count
    FROM submissions s
    LEFT JOIN judge_assignments ja ON ja.submission_id = s.id
    WHERE s.event_id = $1 AND s.status = 'SUBMITTED'
    GROUP BY s.id
  `, [eventId]);

  let submissionsAwaitingEvaluations = 0;
  subRes.rows.forEach(r => {
    if (parseInt(r.completed_count) < 1) { // Maybe configurable, but we'll just say "at least 1"
      submissionsAwaitingEvaluations++;
    }
  });

  return NextResponse.json({
    totalJudges,
    totalAssignments,
    completedAssignments,
    pendingAssignments,
    completionPercentage,
    submissionsAwaitingEvaluations
  });
}
