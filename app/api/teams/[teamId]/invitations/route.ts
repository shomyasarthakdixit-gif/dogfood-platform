import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbPool } from '@/lib/db';
import { requireTeamMember, hashToken } from '@/lib/auth';
import { invitationRequestSchema } from '@/lib/validation/teams';

export async function GET(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const teamId = (await params).teamId;
  const { error } = await requireTeamMember(teamId);
  if (error) return error;

  const pool = getDbPool();
  const res = await pool.query(`
    SELECT ti.id, ti.status, ti.expires_at, ti.created_at, ti.updated_at, u.email as invitee_email
    FROM team_invitations ti
    LEFT JOIN users u ON u.id = ti.invitee_id
    WHERE ti.team_id = $1 
    ORDER BY ti.created_at DESC
  `, [teamId]);
  return NextResponse.json({ invitations: res.rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const teamId = (await params).teamId;
  const { user, error } = await requireTeamMember(teamId);
  if (error) return error;

  try {
    const body = await req.json();
    const email = body.email;
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Valid email is required' } }, { status: 400 });
    }

    const pool = getDbPool();
    
    // Find team and eventId
    const teamRes = await pool.query('SELECT event_id FROM teams WHERE id = $1', [teamId]);
    if (teamRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Team not found' } }, { status: 404 });
    }
    const eventId = teamRes.rows[0].event_id;

    // Find the user by email and ensure they are registered for the event
    const inviteeRes = await pool.query(`
      SELECT u.id 
      FROM users u
      JOIN event_members em ON em.user_id = u.id
      WHERE u.email = $1 AND em.event_id = $2
    `, [email, eventId]);

    if (inviteeRes.rowCount === 0) {
      return NextResponse.json({ error: { code: 'NOT_REGISTERED', message: 'No registered user found with this email for this event' } }, { status: 404 });
    }
    const inviteeId = inviteeRes.rows[0].id;

    // Ensure not already in any team for this event
    const inTeamRes = await pool.query(`
      SELECT tm.id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = $1 AND t.event_id = $2
    `, [inviteeId, eventId]);
    if (inTeamRes.rowCount !== null && inTeamRes.rowCount > 0) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'User is already in a team for this event' } }, { status: 409 });
    }

    // See if pending invitation already exists
    const existingInv = await pool.query('SELECT id FROM team_invitations WHERE team_id = $1 AND invitee_id = $2 AND status = $3', [teamId, inviteeId, 'PENDING']);
    if (existingInv.rowCount !== null && existingInv.rowCount > 0) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'Invitation already sent to this user' } }, { status: 409 });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const insertRes = await pool.query(`
      INSERT INTO team_invitations (team_id, inviter_id, invitee_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4, $5) RETURNING id, status, expires_at, created_at
    `, [teamId, user!.id, inviteeId, hashedToken, expiresAt]);

    return NextResponse.json({
      invitation: insertRes.rows[0],
      raw_token: rawToken
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
