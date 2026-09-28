import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { calculateNormalizedResults } from '@/lib/judging/normalization';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  
  const { error } = await requireEventAdmin(eventId);
  if (error) return error;

  const pool = getDbPool();

  const evalsRes = await pool.query(`
    SELECT e.total_score, ja.judge_id, ja.submission_id 
    FROM evaluations e
    JOIN judge_assignments ja ON e.assignment_id = ja.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1 AND e.status = 'SUBMITTED'
  `, [eventId]);

  const results = calculateNormalizedResults(evalsRes.rows);

  const subRes = await pool.query(`
    SELECT s.id, s.title, t.name as team_name, tr.name as track_name
    FROM submissions s
    JOIN teams t ON s.team_id = t.id
    LEFT JOIN tracks tr ON s.track_id = tr.id
    WHERE s.event_id = $1
  `, [eventId]);
  const subMap = new Map(subRes.rows.map(s => [s.id, s]));

  const enrichedResults = results.map(r => {
    const s = subMap.get(r.submission_id);
    return {
      submissionId: r.submission_id,
      title: s?.title || 'Unknown',
      team: { name: s?.team_name || 'Unknown' },
      track: { name: s?.track_name || 'None' },
      evaluationCount: r.evaluationCount,
      rawScore: r.rawScore,
      normalizedScore: r.normalizedScore,
      rank: r.rank
    };
  });

  return NextResponse.json({ results: enrichedResults });
}
