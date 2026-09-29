import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { requireUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ invitationId: string }> }) {
  const invitationId = (await params).invitationId;
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const pool = getDbPool();
    // Verify invitation belongs to user, is pending, and not expired
    const invRes = await pool.query(`
      SELECT * FROM team_invitations 
      WHERE id = $1 AND invitee_id = $2 AND status = 'PENDING' AND expires_at > NOW()
    `, [invitationId, user!.id]);

    if (invRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Invitation not found, expired, or already processed' } }, { status: 404 });
    }
    const inv = invRes.rows[0];

    // Check if user is already in a team for this event
    const teamRes = await pool.query('SELECT event_id FROM teams WHERE id = $1', [inv.team_id]);
    const eventId = teamRes.rows[0].event_id;

    const inOtherTeamRes = await pool.query(`
      SELECT tm.id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = $1 AND t.event_id = $2
    `, [user!.id, eventId]);

    if (inOtherTeamRes.rowCount !== null && inOtherTeamRes.rowCount > 0) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'You are already in a team for this event' } }, { status: 409 });
    }

    await pool.query('BEGIN');
    
    // Add to team_members
    await pool.query(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, 'MEMBER')
    `, [inv.team_id, user!.id]);

    // Update invitation status
    await pool.query(`
      UPDATE team_invitations SET status = 'ACCEPTED', updated_at = NOW() WHERE id = $1
    `, [invitationId]);

    // Audit log
    await pool.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
      VALUES ($1, $2, $3, $4)
    `, [user!.id, 'INVITATION_ACCEPTED', 'team', inv.team_id]);

    await pool.query('COMMIT');
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    console.error(err);
    const pool = getDbPool();
    await pool.query('ROLLBACK');
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ invitationId: string }> }) {
  const invitationId = (await params).invitationId;
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const pool = getDbPool();
    const invRes = await pool.query(`
      SELECT * FROM team_invitations 
      WHERE id = $1 AND invitee_id = $2 AND status = 'PENDING'
    `, [invitationId, user!.id]);

    if (invRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Invitation not found or already processed' } }, { status: 404 });
    }

    await pool.query(`
      UPDATE team_invitations SET status = 'DECLINED', updated_at = NOW() WHERE id = $1
    `, [invitationId]);

    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
