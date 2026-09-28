import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDbPool } from '@/lib/db';
import { requireTeamLeader, hashToken } from '@/lib/auth';
import { invitationRequestSchema } from '@/lib/validation/teams';

export async function GET(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const teamId = (await params).teamId;
  const { error } = await requireTeamLeader(teamId);
  if (error) return error;

  const pool = getDbPool();
  const res = await pool.query('SELECT id, status, expires_at, created_at, updated_at FROM team_invitations WHERE team_id = $1 ORDER BY created_at DESC', [teamId]);
  return NextResponse.json({ invitations: res.rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const teamId = (await params).teamId;
  const { user, error } = await requireTeamLeader(teamId);
  if (error) return error;

  try {
    const body = await req.json();
    const result = invitationRequestSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }, { status: 400 });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + result.data.expires_in_hours * 60 * 60 * 1000);

    const pool = getDbPool();
    const insertRes = await pool.query(`
      INSERT INTO team_invitations (team_id, inviter_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4) RETURNING id, status, expires_at, created_at
    `, [teamId, user!.id, hashedToken, expiresAt]);

    return NextResponse.json({
      invitation: insertRes.rows[0],
      raw_token: rawToken
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message: 'Internal error' } }, { status: 500 });
  }
}
