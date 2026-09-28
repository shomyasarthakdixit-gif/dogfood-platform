import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';
import { autoAssignSchema } from '@/lib/validation/judging';

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { user, error } = await requireEventAdmin(eventId);
  if (error) return error;

  try {
    const body = await req.json();
    const result = autoAssignSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: (result.error as unknown as { errors: { message: string }[] }).errors[0].message } }, { status: 400 });
    }

    const { judgesPerSubmission } = result.data;
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Get all submitted submissions
      const subsRes = await client.query('SELECT id, team_id FROM submissions WHERE event_id = $1 AND status = $2 ORDER BY id ASC', [eventId, 'SUBMITTED']);
      const submissions = subsRes.rows;

      if (submissions.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'No submitted submissions found' } }, { status: 400 });
      }

      // 2. Get all judges
      const judgeRes = await client.query('SELECT id, user_id FROM judge_profiles WHERE event_id = $1 ORDER BY id ASC', [eventId]);
      const judges = judgeRes.rows;

      if (judges.length < judgesPerSubmission) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: { code: 'INSUFFICIENT_JUDGES', message: 'Not enough judges to satisfy judgesPerSubmission' } }, { status: 400 });
      }

      // 3. Get existing assignments to avoid duplicates and count current load
      const assignRes = await client.query(`
        SELECT ja.judge_id, ja.submission_id 
        FROM judge_assignments ja
        JOIN submissions s ON ja.submission_id = s.id
        WHERE s.event_id = $1
      `, [eventId]);
      
      const existingAssignments = new Set(assignRes.rows.map(r => `${r.judge_id}_${r.submission_id}`));
      const judgeLoads = new Map<string, number>(judges.map(j => [j.id, 0]));
      const subLoads = new Map<string, number>(submissions.map(s => [s.id, 0]));
      
      assignRes.rows.forEach(r => {
        if (judgeLoads.has(r.judge_id)) {
          judgeLoads.set(r.judge_id, judgeLoads.get(r.judge_id)! + 1);
        }
        if (subLoads.has(r.submission_id)) {
          subLoads.set(r.submission_id, subLoads.get(r.submission_id)! + 1);
        }
      });

      // 4. Get COI mappings (Judge -> Team)
      const coiRes = await client.query(`
        SELECT jp.id as judge_id, tm.team_id 
        FROM judge_profiles jp
        JOIN team_members tm ON jp.user_id = tm.user_id
        WHERE jp.event_id = $1
      `, [eventId]);
      const coiMap = new Map<string, Set<string>>(); // judge_id -> Set of team_ids
      coiRes.rows.forEach(r => {
        if (!coiMap.has(r.judge_id)) coiMap.set(r.judge_id, new Set());
        coiMap.get(r.judge_id)!.add(r.team_id);
      });

      // 5. Algorithm: Deterministic Assignment
      const newAssignments: { judge_id: string, submission_id: string }[] = [];

      for (const sub of submissions) {
        let needed = judgesPerSubmission - (subLoads.get(sub.id) || 0);
        if (needed <= 0) continue;

        // Sort judges by load ASC, then id ASC for determinism
        const availableJudges = [...judges].sort((a, b) => {
          const loadA = judgeLoads.get(a.id) || 0;
          const loadB = judgeLoads.get(b.id) || 0;
          if (loadA !== loadB) return loadA - loadB;
          return a.id.localeCompare(b.id);
        });

        for (const judge of availableJudges) {
          if (needed <= 0) break;
          
          const key = `${judge.id}_${sub.id}`;
          if (existingAssignments.has(key)) continue;

          const judgeTeams = coiMap.get(judge.id);
          if (judgeTeams && judgeTeams.has(sub.team_id)) continue; // COI

          // Assign
          newAssignments.push({ judge_id: judge.id, submission_id: sub.id });
          existingAssignments.add(key);
          judgeLoads.set(judge.id, (judgeLoads.get(judge.id) || 0) + 1);
          needed--;
        }

        if (needed > 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ error: { code: 'INSUFFICIENT_JUDGES', message: `Could not satisfy assignment requirements for submission ${sub.id} due to COI or insufficient eligible judges.` } }, { status: 400 });
        }
      }

      // 6. Insert new assignments
      for (const a of newAssignments) {
        const insRes = await client.query(
          'INSERT INTO judge_assignments (judge_id, submission_id, status) VALUES ($1, $2, $3) RETURNING id',
          [a.judge_id, a.submission_id, 'PENDING']
        );
        await client.query(
          'WITH dummy AS (SELECT $1::text) INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($2, $3, $4, $5, $6)',
          [eventId, user.id, 'CREATE_ASSIGNMENT_AUTO', 'JUDGE_ASSIGNMENT', insRes.rows[0].id, JSON.stringify({ judge_id: a.judge_id, submission_id: a.submission_id })]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true, count: newAssignments.length }, { status: 201 });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Server error' } }, { status: 500 });
  }
}
