import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const pool = getDbPool();
  const res = await pool.query(`
    SELECT ja.status as assignment_status, e.status as evaluation_status 
    FROM judge_assignments ja
    JOIN judge_profiles jp ON ja.judge_id = jp.id
    LEFT JOIN evaluations e ON e.assignment_id = ja.id
    WHERE jp.user_id = $1
  `, [user.id]);

  const total = res.rowCount || 0;
  let pending = 0;
  let inProgress = 0;
  let completed = 0;

  res.rows.forEach(r => {
    if (r.assignment_status === 'COMPLETED') {
      completed++;
    } else if (r.evaluation_status === 'DRAFT') {
      inProgress++;
    } else {
      pending++;
    }
  });

  const completionPercentage = total > 0 ? (completed / total) * 100 : 0;

  return NextResponse.json({
    total,
    pending,
    inProgress,
    completed,
    completionPercentage
  });
}
