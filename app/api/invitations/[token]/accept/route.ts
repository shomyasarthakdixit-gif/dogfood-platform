import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser, hashToken } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const { user, error } = await requireUser();
  if (error) return error;

  const pool = getDbPool();
  const hashedToken = hashToken(token);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const invRes = await client.query(`
      SELECT ti.*, t.event_id 
      FROM team_invitations ti
      JOIN teams t ON ti.team_id = t.id
      WHERE ti.token_hash = $1 FOR UPDATE
    `, [hashedToken]);

    if (invRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Invitation not found' } }, { status: 404 });
    }

    const invitation = invRes.rows[0];

    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: { code: 'INVITATION_ALREADY_ACCEPTED', message: 'Invitation already accepted or invalid' } }, { status: 400 });
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: { code: 'INVITATION_EXPIRED', message: 'Invitation expired' } }, { status: 400 });
    }

    const memRes = await client.query('SELECT role FROM event_members WHERE event_id = $1 AND user_id = $2', [invitation.event_id, user!.id]);
    if (memRes.rowCount === 0 || memRes.rows[0].role !== 'PARTICIPANT') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not eligible to join this event' } }, { status: 403 });
    }

    const existingTeam = await client.query(`
      SELECT tm.id FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE t.event_id = $1 AND tm.user_id = $2
    `, [invitation.event_id, user!.id]);

    if (existingTeam.rowCount && existingTeam.rowCount > 0) {
      return NextResponse.json({ error: { code: 'ALREADY_MEMBER', message: 'You are already in a team for this event' } }, { status: 400 });
    }

    await client.query(`
      INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'MEMBER')
    `, [invitation.team_id, user!.id]);

    await client.query(`
      UPDATE team_invitations SET status = 'ACCEPTED', updated_at = NOW() WHERE id = $1
    `, [invitation.id]);

    await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)
    `, [user!.id, 'ACCEPT_INVITATION', 'team', invitation.team_id]);

    await client.query('COMMIT');
    return NextResponse.json({ status: 'ok', team_id: invitation.team_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  } finally {
    client.release();
  }
}
