import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateNormalizedResults } from '@/lib/judging/normalization';

export async function GET(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  
  const pool = getDbPool();
  const evRes = await pool.query('SELECT status FROM events WHERE id = $1', [eventId]);
  if (evRes.rowCount === 0) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Event not found' } }, { status: 404 });
  const evStatus = evRes.rows[0].status;

  const user = await getCurrentUser();
  let isAdmin = false;
  if (user && user.role === 'ADMIN') isAdmin = true;
  else if (user) {
    const roleRes = await pool.query('SELECT role FROM event_members WHERE event_id = $1 AND user_id = $2', [eventId, user.id]);
    if ((roleRes.rowCount ?? 0) > 0 && roleRes.rows[0].role === 'ORGANIZER') isAdmin = true;
  }

  if (!isAdmin && evStatus !== 'RESULTS') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Results are hidden during active voting and judging.' } }, { status: 403 });
  }



  const evalsRes = await pool.query(`
    SELECT e.total_score, ja.judge_id, ja.submission_id 
    FROM evaluations e
    JOIN judge_assignments ja ON e.assignment_id = ja.id
    JOIN submissions s ON ja.submission_id = s.id
    WHERE s.event_id = $1 AND e.status = 'SUBMITTED'
  `, [eventId]);

  const results = calculateNormalizedResults(evalsRes.rows);

  // Fetch submission metadata to enrich results
  const subRes = await pool.query(`
    SELECT s.id, s.title, t.name as team_name, tr.name as track_name
    FROM submissions s
    JOIN teams t ON s.team_id = t.id
    LEFT JOIN tracks tr ON s.track_id = tr.id
    WHERE s.event_id = $1
  `, [eventId]);
  const subMap = new Map(subRes.rows.map(s => [s.id, s]));

  // Combine
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

  // Re-sort by rawScore for raw results (since default was normalized)
  enrichedResults.sort((a, b) => {
    if (a.rawScore !== b.rawScore) return b.rawScore - a.rawScore;
    return a.submissionId.localeCompare(b.submissionId);
  });
  
  // Re-assign raw rank
  enrichedResults.forEach((r, idx) => r.rank = idx + 1);

  return NextResponse.json({ results: enrichedResults });
}
