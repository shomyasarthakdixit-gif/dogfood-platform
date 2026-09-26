import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';
import { z } from 'zod';

const AcceptSchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  try {
    const body = await request.json();
    const parsed = AcceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }
    const { userId } = parsed.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Look up invitation
    const invResult = await query(
      `SELECT ti.id, ti.team_id, ti.expires_at
       FROM team_invitations ti
       WHERE ti.token_hash = $1`,
      [tokenHash]
    );
    if (invResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invitation not found or invalid' }, { status: 404 });
    }
    const inv = invResult.rows[0];

    if (new Date(inv.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
    }

    // Check not already a member
    const memberCheck = await query(
      `SELECT id FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [inv.team_id, userId]
    );
    if (memberCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 409 }
      );
    }

    // Add member
    await query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'MEMBER')`,
      [inv.team_id, userId]
    );

    // Invalidate invitation (delete it)
    await query(`DELETE FROM team_invitations WHERE id = $1`, [inv.id]);

    return NextResponse.json({
      data: { teamId: inv.team_id, message: 'Successfully joined team' },
    });
  } catch (error) {
    console.error('POST /api/invitations/:token/accept error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
