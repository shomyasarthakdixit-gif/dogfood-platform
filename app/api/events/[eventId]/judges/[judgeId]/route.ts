import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireEventAdmin } from '@/lib/auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ eventId: string, judgeId: string }> }) {
  const { eventId, judgeId } = await params;
  const { user, error } = await requireEventAdmin(eventId);
  if (error) return error;

  try {
    const pool = getDbPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify judge exists
      const judgeRes = await client.query('SELECT user_id FROM judge_profiles WHERE id = $1 AND event_id = $2', [judgeId, eventId]);
      if (judgeRes.rowCount === 0) {
        return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Judge not found' } }, { status: 404 });
      }

      const userId = judgeRes.rows[0].user_id;

      // Check if judge has assignments
      const assignRes = await client.query('SELECT id FROM judge_assignments WHERE judge_id = $1', [judgeId]);
      if (assignRes.rowCount !== null && assignRes.rowCount > 0) {
        return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Cannot remove judge with existing assignments' } }, { status: 403 });
      }

      // Remove judge profile
      await client.query('DELETE FROM judge_profiles WHERE id = $1', [judgeId]);

      // Remove event_members role if they don't have another reason to be there
      // Wait, we don't know if they should be returned to PARTICIPANT. 
      // Safest is to just remove them from event_members if their role is JUDGE.
      await client.query('DELETE FROM event_members WHERE user_id = $1 AND event_id = $2 AND role = $3', [userId, eventId, 'JUDGE']);

      await client.query(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
        [user.id, 'JUDGE_REMOVED', 'JUDGE_PROFILE', judgeId]
      );

      await client.query('COMMIT');
      return NextResponse.json({ status: 'ok' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
