import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await query(
      `SELECT ti.id, ti.team_id, ti.expires_at, ti.created_at,
              t.name as team_name, t.description as team_description,
              t.event_id
       FROM team_invitations ti
       JOIN teams t ON t.id = ti.team_id
       WHERE ti.token_hash = $1`,
      [tokenHash]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invitation not found or invalid' }, { status: 404 });
    }
    const inv = result.rows[0];
    const expired = new Date(inv.expires_at) < new Date();
    return NextResponse.json({
      data: {
        id: inv.id,
        teamId: inv.team_id,
        teamName: inv.team_name,
        teamDescription: inv.team_description,
        eventId: inv.event_id,
        expiresAt: inv.expires_at,
        expired,
      },
    });
  } catch (error) {
    console.error('GET /api/invitations/:token error:', error);
    return NextResponse.json({ error: 'Failed to load invitation' }, { status: 500 });
  }
}
