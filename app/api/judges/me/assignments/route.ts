import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function GET(req: Request) {
  const { user, error } = await requireUser();
  if (error) return error;

  const pool = getDbPool();
  const res = await pool.query(`
    SELECT ja.*, s.title as submission_title, e.name as event_name, s.team_id, jp.event_id
    FROM judge_assignments ja
    JOIN judge_profiles jp ON ja.judge_id = jp.id
    JOIN submissions s ON ja.submission_id = s.id
    JOIN events e ON s.event_id = e.id
    WHERE jp.user_id = $1
    ORDER BY ja.created_at DESC
  `, [user.id]);

  return NextResponse.json({ assignments: res.rows });
}
